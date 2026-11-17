import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.e2e')
const env = process.env
const makeClient = () =>
  createClient(env.E2E_SUPABASE_URL, env.E2E_SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
const publicClient = makeClient(),
  staff = makeClient(),
  other = makeClient()
const passed = []
function ok(condition, label) {
  assert.ok(condition, label)
  passed.push(label)
  console.log('PASS', label)
}
const signIn = async (client, email, password) => {
  const result = await client.auth.signInWithPassword({ email, password })
  assert.ifError(result.error)
}
await signIn(staff, env.E2E_STAFF_EMAIL, env.E2E_STAFF_PASSWORD)
await signIn(other, env.E2E_OTHER_EMAIL, env.E2E_OTHER_PASSWORD)
ok(
  (await staff.rpc('is_labfis_staff')).data === true,
  'personal autorizado reconocido por PostgreSQL',
)
ok((await other.rpc('is_labfis_staff')).data === false, 'cuenta sin autorización rechazada')
const before = await publicClient.from('found_objects').select('id', { count: 'exact' })
assert.ifError(before.error)
ok(before.count === 0, 'catálogo inicial realmente vacío')
const anonymous = await publicClient.rpc('get_internal_found_object', { p_id: env.E2E_OBJECT_ID })
ok(Boolean(anonymous.error), 'RPC interna inaccesible al público')
const bytes = readFileSync(new URL('../tests/fixtures/mochila.jpg', import.meta.url))
const path = `${env.E2E_STAFF_ID}/${env.E2E_OBJECT_ID}/photo.jpg`
assert.ifError(
  (
    await staff.storage
      .from('found-object-photos')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false })
  ).error,
)
ok(
  Boolean((await publicClient.storage.from('found-object-photos').createSignedUrl(path, 60)).error),
  'fotografía huérfana no visible al público',
)
const args = {
  p_id: env.E2E_OBJECT_ID,
  p_reporter_name: 'Juan Pérez',
  p_description: 'Mochila negra',
  p_found_location: 'Laboratorio de Física 1',
  p_found_on: '2026-11-09',
  p_photo_path: path,
  p_photo_name: 'mochila.jpg',
}
ok(
  Boolean((await staff.rpc('register_found_object', { ...args, p_reporter_name: '  ' })).error),
  'datos obligatorios validados en el servidor',
)
const missingId = randomUUID()
ok(
  Boolean(
    (
      await staff.rpc('register_found_object', {
        ...args,
        p_id: missingId,
        p_photo_path: `${env.E2E_STAFF_ID}/${missingId}/photo.jpg`,
      })
    ).error,
  ),
  'fotografía obligatoria comprobada en el servidor',
)
const registered = await staff.rpc('register_found_object', args)
assert.ifError(registered.error)
ok(
  registered.data.reporter_name === 'Juan Pérez' &&
    registered.data.photo_original_name === 'mochila.jpg',
  'registro real con sus datos internos',
)
assert.ifError((await staff.rpc('register_found_object', args)).error)
const visible = await publicClient.from('found_objects').select('*', { count: 'exact' })
assert.ifError(visible.error)
ok(visible.count === 1, 'reintento sin duplicación')
ok(
  !('reporter_name' in visible.data[0]) && !('photo_original_name' in visible.data[0]),
  'identidad y nombre original del archivo fuera del catálogo público',
)
ok(
  Boolean((await other.rpc('get_internal_found_object', { p_id: env.E2E_OBJECT_ID })).error),
  'datos internos inaccesibles para otra cuenta',
)
const signed = await publicClient.storage.from('found-object-photos').createSignedUrl(path, 60)
assert.ifError(signed.error)
const image = await fetch(signed.data.signedUrl)
ok(
  image.ok && image.headers.get('content-type')?.includes('image/jpeg'),
  'fotografía descargable del hallazgo disponible',
)
const reopened = makeClient()
await signIn(reopened, env.E2E_STAFF_EMAIL, env.E2E_STAFF_PASSWORD)
const persistent = await reopened.rpc('get_internal_found_object', { p_id: env.E2E_OBJECT_ID })
assert.ifError(persistent.error)
ok(
  persistent.data.description === 'Mochila negra',
  'registro persistente tras iniciar una nueva sesión',
)
for (const [id, description, location, date] of [
  [env.E2E_NOTEBOOK_ID, 'Cuaderno', 'Laboratorio de Física 2', '2026-11-08'],
  [env.E2E_RETURNED_ID, 'Paraguas azul', 'Laboratorio de Física 1', '2026-11-07'],
]) {
  const photoPath = `${env.E2E_STAFF_ID}/${id}/photo.jpg`
  assert.ifError(
    (
      await staff.storage
        .from('found-object-photos')
        .upload(photoPath, bytes, { contentType: 'image/jpeg' })
    ).error,
  )
  assert.ifError(
    (
      await staff.rpc('register_found_object', {
        ...args,
        p_id: id,
        p_description: description,
        p_found_location: location,
        p_found_on: date,
        p_photo_path: photoPath,
      })
    ).error,
  )
}
writeFileSync(
  '.env.live-result.json',
  JSON.stringify(
    {
      date: new Date().toISOString(),
      passed,
      objectIds: [env.E2E_OBJECT_ID, env.E2E_NOTEBOOK_ID, env.E2E_RETURNED_ID],
    },
    null,
    2,
  ),
)
console.log(
  `Backend real: ${passed.length} comprobaciones correctas; tres registros ficticios preparados para revisión y limpieza.`,
)
await Promise.all([staff.auth.signOut(), other.auth.signOut(), reopened.auth.signOut()])
