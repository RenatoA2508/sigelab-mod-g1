-- HU-01 / HU-02. Public metadata and internal report data have separate boundaries.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.found_object_status as enum ('available', 'returned');

create table private.staff_members (
  email text primary key check (email = lower(btrim(email)) and length(email) > 3),
  active boolean not null default true,
  granted_at timestamptz not null default now()
);
alter table private.staff_members enable row level security;

create function public.is_labfis_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.staff_members s
    join auth.users u on lower(u.email) = s.email
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null and s.active
  );
$$;
revoke all on function public.is_labfis_staff() from public;
grant execute on function public.is_labfis_staff() to authenticated;

create table public.found_objects (
  id uuid primary key,
  description text not null check (length(btrim(description)) between 1 and 2000),
  found_location text not null check (length(btrim(found_location)) between 1 and 200),
  found_on date not null,
  photo_path text not null unique check (length(photo_path) between 1 and 500),
  status public.found_object_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index found_objects_available_created_idx on public.found_objects(created_at desc, id desc) where status = 'available';
alter table public.found_objects enable row level security;
revoke all on public.found_objects from public, anon, authenticated;
grant select on public.found_objects to anon, authenticated;

create policy available_objects_read on public.found_objects for select to anon, authenticated
  using (status = 'available');
create policy staff_objects_read on public.found_objects for select to authenticated
  using ((select public.is_labfis_staff()));

create table private.found_object_reports (
  object_id uuid primary key references public.found_objects(id) on delete cascade,
  reporter_name text not null check (length(btrim(reporter_name)) between 1 and 200),
  photo_original_name text not null check (length(btrim(photo_original_name)) between 1 and 255),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index found_object_reports_created_by_idx on private.found_object_reports(created_by);
alter table private.found_object_reports enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

create function public.get_internal_found_object(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not public.is_labfis_staff() then
    raise exception 'Acceso exclusivo para personal autorizado de LABFIS.' using errcode = '42501';
  end if;
  select to_jsonb(o) || jsonb_build_object('reporter_name', r.reporter_name, 'photo_original_name', r.photo_original_name)
  into result from public.found_objects o
  join private.found_object_reports r on r.object_id = o.id
  where o.id = p_id;
  return result;
end;
$$;
revoke all on function public.get_internal_found_object(uuid) from public;
grant execute on function public.get_internal_found_object(uuid) to authenticated;

create function public.register_found_object(
  p_id uuid, p_reporter_name text, p_description text,
  p_found_location text, p_found_on date, p_photo_path text, p_photo_name text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare existing_report private.found_object_reports;
begin
  if not public.is_labfis_staff() then
    raise exception 'Acceso exclusivo para personal autorizado de LABFIS.' using errcode = '42501';
  end if;
  if p_id is null or p_found_on is null or
     p_reporter_name is null or length(btrim(p_reporter_name)) not between 1 and 200 or
     p_description is null or length(btrim(p_description)) not between 1 and 2000 or
     p_found_location is null or length(btrim(p_found_location)) not between 1 and 200 or
     p_photo_name is null or length(btrim(p_photo_name)) not between 1 and 255 then
    raise exception 'Completa los datos obligatorios del hallazgo.' using errcode = '22023';
  end if;
  if p_photo_path is null or p_photo_path not in (
    auth.uid()::text || '/' || p_id::text || '/photo.jpg',
    auth.uid()::text || '/' || p_id::text || '/photo.png',
    auth.uid()::text || '/' || p_id::text || '/photo.webp'
  ) then
    raise exception 'La fotografía no corresponde a este registro.' using errcode = '22023';
  end if;
  if p_photo_path is null or
     split_part(p_photo_path, '/', 1) <> auth.uid()::text or
     split_part(p_photo_path, '/', 2) <> p_id::text or
     array_length(string_to_array(p_photo_path, '/'), 1) <> 3 then
    raise exception 'Adjunta una fotografía del objeto.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from storage.objects s where s.bucket_id = 'found-object-photos'
      and s.name = p_photo_path
      and s.metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
  ) then
    raise exception 'La fotografía no se ha cargado correctamente.' using errcode = '22023';
  end if;
  -- Serialize the same client operation; retries after a lost response never duplicate it.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select * into existing_report from private.found_object_reports where object_id = p_id;
  if found then
    if existing_report.created_by = auth.uid() and exists (
      select 1 from public.found_objects o where o.id = p_id and o.photo_path = p_photo_path
        and o.description = btrim(p_description) and o.found_location = btrim(p_found_location)
        and o.found_on = p_found_on and existing_report.reporter_name = btrim(p_reporter_name)
        and existing_report.photo_original_name = btrim(p_photo_name)
    ) then
      return public.get_internal_found_object(p_id);
    end if;
    raise exception 'Este identificador de registro ya se utilizó.' using errcode = '23505';
  end if;
  insert into public.found_objects(id, description, found_location, found_on, photo_path)
  values(p_id, btrim(p_description), btrim(p_found_location), p_found_on, p_photo_path);
  insert into private.found_object_reports(object_id, reporter_name, photo_original_name, created_by)
  values(p_id, btrim(p_reporter_name), btrim(p_photo_name), auth.uid());
  return public.get_internal_found_object(p_id);
end;
$$;
revoke all on function public.register_found_object(uuid, text, text, text, date, text, text) from public;
grant execute on function public.register_found_object(uuid, text, text, text, date, text, text) to authenticated;

create function private.touch_found_object()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger found_objects_updated before update on public.found_objects
for each row execute function private.touch_found_object();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('found-object-photos', 'found-object-photos', false, 10485760, array['image/jpeg','image/png','image/webp']);

create policy staff_photo_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'found-object-photos'
  and (select public.is_labfis_staff())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/photo\.(jpg|png|webp)$'
);

create policy available_photo_read on storage.objects for select to anon, authenticated
using (
  bucket_id = 'found-object-photos'
  and exists (select 1 from public.found_objects o where o.photo_path = name and o.status = 'available')
);
create policy staff_photo_read on storage.objects for select to authenticated
using (bucket_id = 'found-object-photos' and (select public.is_labfis_staff()));

-- Only unattached own uploads can be cleaned up. A committed record is never deleted
-- by a client compensating for a lost network response.
create policy staff_unattached_photo_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'found-object-photos' and (select public.is_labfis_staff())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (select 1 from public.found_objects o where o.photo_path = name)
);

comment on table public.found_objects is 'HU-01/HU-02: public object metadata; reporter identity stays in private.found_object_reports.';
comment on table private.staff_members is 'Admin-managed allowlist. Authenticated and verified email is required; public signup never grants itself permissions.';
