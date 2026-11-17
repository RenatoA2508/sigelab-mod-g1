// @vitest-environment node
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'

let db: PGlite
const STAFF = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const OBJECT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PATH = `${STAFF}/${OBJECT}/photo.jpg`

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, storage to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);
    alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to anon,authenticated;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
  `)
  const directory = new URL('../../supabase/migrations/', import.meta.url)
  for (const name of readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(new URL(name, directory), 'utf8'))
  }
}, 30_000)
afterAll(async () => {
  await db?.close()
})
beforeEach(async () => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','',false);
    truncate public.found_objects, private.found_object_reports, private.staff_members, storage.objects, auth.users cascade;
    insert into auth.users values ('${STAFF}','staff@example.com',now()),('${OTHER}','other@example.com',now());
    insert into private.staff_members(email) values ('staff@example.com');
    insert into storage.objects(bucket_id,name,metadata) values ('found-object-photos','${PATH}','{"mimetype":"image/jpeg"}');`)
})

async function asRole<T>(
  role: 'anon' | 'authenticated',
  user: string | null,
  fn: () => Promise<T>,
) {
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [user ?? ''])
  await db.exec(`set role ${role}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}
async function register(overrides: unknown[] = []) {
  const args: unknown[] = [
    OBJECT,
    'Juan Pérez',
    'Mochila negra',
    'Laboratorio de Física 1',
    '2026-11-09',
    PATH,
    'mochila.jpg',
  ]
  overrides.forEach((value, index) => {
    if (value !== undefined) args[index] = value
  })
  return db.query<{ result: Record<string, unknown> }>(
    'select public.register_found_object($1::uuid,$2,$3,$4,$5::date,$6,$7) as result',
    args,
  )
}

describe('PostgreSQL: registro, privacidad y reglas RLS', () => {
  it('registra los cinco datos y conserva el nombre de la fotografía en la información interna', async () => {
    const value = await asRole('authenticated', STAFF, () => register())
    expect(value.rows[0].result).toMatchObject({
      reporter_name: 'Juan Pérez',
      description: 'Mochila negra',
      photo_original_name: 'mochila.jpg',
      status: 'available',
    })
    const report = await db.query('select * from private.found_object_reports')
    expect(report.rows).toHaveLength(1)
  })
  it('no permite registrar de forma anónima', async () => {
    await expect(asRole('anon', null, () => register())).rejects.toThrow(/permission denied/)
  })
  it('una cuenta autenticada sin autorización tampoco puede registrar', async () => {
    await expect(asRole('authenticated', OTHER, () => register())).rejects.toThrow(/exclusivo/)
  })
  it('requiere que el correo autorizado esté confirmado', async () => {
    await db.exec(`update auth.users set email_confirmed_at=null where id='${STAFF}'`)
    await expect(asRole('authenticated', STAFF, () => register())).rejects.toThrow(/exclusivo/)
  })
  it.each([1, 2, 3])(
    'rechaza el campo textual vacío en la posición %s sin crear registros parciales',
    async (index) => {
      const changes = Array.from({ length: 7 }, () => undefined as unknown)
      changes[index] = '   '
      await expect(asRole('authenticated', STAFF, () => register(changes))).rejects.toThrow(
        /obligatorios/,
      )
      expect((await db.query('select id from public.found_objects')).rows).toHaveLength(0)
      expect(
        (await db.query('select object_id from private.found_object_reports')).rows,
      ).toHaveLength(0)
    },
  )
  it('rechaza la fecha ausente', async () => {
    await expect(
      asRole('authenticated', STAFF, () =>
        register([undefined, undefined, undefined, undefined, null]),
      ),
    ).rejects.toThrow(/obligatorios/)
  })
  it('rechaza el registro si no existe una fotografía cargada', async () => {
    await db.exec('delete from storage.objects')
    await expect(asRole('authenticated', STAFF, () => register())).rejects.toThrow(/fotografía/)
  })
  it('no acepta una fotografía perteneciente a otra operación', async () => {
    await expect(
      asRole('authenticated', STAFF, () =>
        register([
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          `${STAFF}/${OTHER}/photo.jpg`,
        ]),
      ),
    ).rejects.toThrow(/corresponde/)
  })
  it('un reintento idéntico es idempotente', async () => {
    await asRole('authenticated', STAFF, () => register())
    await asRole('authenticated', STAFF, () => register())
    expect((await db.query('select id from public.found_objects')).rows).toHaveLength(1)
  })
  it('una reutilización con datos diferentes no modifica el registro original', async () => {
    await asRole('authenticated', STAFF, () => register())
    await expect(
      asRole('authenticated', STAFF, () => register([undefined, undefined, 'Datos distintos'])),
    ).rejects.toThrow(/identificador/)
    expect(
      (await db.query<{ description: string }>('select description from public.found_objects'))
        .rows[0].description,
    ).toBe('Mochila negra')
  })
  it('el público solo ve disponibles y nunca puede leer la identidad del reportante', async () => {
    await asRole('authenticated', STAFF, () => register())
    const visible = await asRole('anon', null, () => db.query('select * from public.found_objects'))
    expect(visible.rows).toHaveLength(1)
    expect(visible.rows[0]).not.toHaveProperty('reporter_name')
    await expect(
      asRole('anon', null, () => db.query('select * from private.found_object_reports')),
    ).rejects.toThrow(/permission denied/)
    await db.exec(`update public.found_objects set status='returned' where id='${OBJECT}'`)
    expect(
      (await asRole('anon', null, () => db.query('select * from public.found_objects'))).rows,
    ).toHaveLength(0)
  })
  it('no filtra nombres internos mediante la función de consulta', async () => {
    await asRole('authenticated', STAFF, () => register())
    await expect(
      asRole('authenticated', OTHER, () =>
        db.query('select public.get_internal_found_object($1)', [OBJECT]),
      ),
    ).rejects.toThrow(/exclusivo/)
  })
  it('las fotografías solo son públicas mientras el objeto está disponible', async () => {
    expect(
      (await asRole('anon', null, () => db.query('select name from storage.objects'))).rows,
    ).toHaveLength(0)
    await asRole('authenticated', STAFF, () => register())
    expect(
      (await asRole('anon', null, () => db.query('select name from storage.objects'))).rows,
    ).toHaveLength(1)
    await db.exec(`update public.found_objects set status='returned'`)
    expect(
      (await asRole('anon', null, () => db.query('select name from storage.objects'))).rows,
    ).toHaveLength(0)
  })
  it('impide borrar una fotografía ya asociada a un hallazgo', async () => {
    await asRole('authenticated', STAFF, () => register())
    const deleted = await asRole('authenticated', STAFF, () =>
      db.query('delete from storage.objects returning id'),
    )
    expect(deleted.rows).toHaveLength(0)
  })
  it('permite limpiar una carga propia que nunca se registró', async () => {
    expect(
      (
        await asRole('authenticated', STAFF, () =>
          db.query('delete from storage.objects returning id'),
        )
      ).rows,
    ).toHaveLength(1)
  })
  it('el personal no puede saltarse la operación atómica insertando directamente', async () => {
    await expect(
      asRole('authenticated', STAFF, () =>
        db.query('insert into public.found_objects(id) values ($1)', [OBJECT]),
      ),
    ).rejects.toThrow(/permission denied/)
  })
})
