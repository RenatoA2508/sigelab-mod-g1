import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { AppError } from '../../lib/errors'
import {
  hasValidImageSignature,
  type InternalObject,
  type PublicObject,
  type Registration,
} from './model'

const BUCKET = 'found-object-photos'
export const PAGE_SIZE = 12
const internalSchema = z.object({
  id: z.uuid(),
  description: z.string(),
  found_location: z.string(),
  found_on: z.string(),
  photo_path: z.string(),
  status: z.enum(['available', 'returned']),
  created_at: z.string(),
  updated_at: z.string(),
  reporter_name: z.string(),
  photo_original_name: z.string(),
})

async function photos<T extends { photo_path: string }>(
  rows: T[],
): Promise<(T & { photoUrl: string | null })[]> {
  if (!rows.length) return []
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(
    rows.map((r) => r.photo_path),
    300,
  )
  const urls = new Map(data?.map((item) => [item.path, item.signedUrl]))
  return rows.map((row) => ({ ...row, photoUrl: urls.get(row.photo_path) || null }))
}

export async function listAvailableObjects(
  page: number,
  signal?: AbortSignal,
): Promise<{ objects: PublicObject[]; count: number }> {
  let request = supabase
    .from('found_objects')
    .select('*', { count: 'exact' })
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  if (signal) request = request.abortSignal(signal)
  const { data, error, count } = await request
  if (error) throw new AppError('No pudimos cargar los objetos encontrados. Inténtalo de nuevo.')
  return { objects: await photos(data ?? []), count: count ?? 0 }
}

export async function getInternalObject(id: string): Promise<InternalObject | null> {
  const { data, error } = await supabase.rpc('get_internal_found_object', { p_id: id })
  if (error)
    throw new AppError(
      'No pudimos consultar el registro. Comprueba que tu cuenta tenga acceso a LABFIS.',
    )
  if (!data) return null
  const row = internalSchema.parse(data)
  return (await photos([row]))[0]
}

export async function createFoundObject(
  input: Registration,
  id: string,
  userId: string,
): Promise<InternalObject> {
  if (!(await hasValidImageSignature(input.photo)))
    throw new AppError('La imagen no corresponde a un archivo JPG, PNG o WebP válido.', 'photo')
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[
    input.photo.type
  ]
  if (!extension) throw new AppError('Selecciona una imagen JPG, PNG o WebP.', 'photo')
  const path = `${userId}/${id}/photo.${extension}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.photo, {
    upsert: false,
    contentType: input.photo.type,
    cacheControl: '300',
  })
  if (uploadError && uploadError.statusCode !== '409')
    throw new AppError(
      'No pudimos cargar la fotografía. Los datos del formulario se mantienen; vuelve a intentarlo.',
    )
  const { data, error } = await supabase.rpc('register_found_object', {
    p_id: id,
    p_reporter_name: input.reporter,
    p_description: input.description,
    p_found_location: input.location,
    p_found_on: input.date,
    p_photo_path: path,
    p_photo_name: input.photo.name,
  })
  if (error) {
    if (/^(22|23|42|P0)/.test(error.code)) await supabase.storage.from(BUCKET).remove([path])
    if (error.code === '42501')
      throw new AppError(
        'Tu cuenta no está autorizada para registrar hallazgos. Contacta al responsable de LABFIS.',
      )
    throw new AppError(
      'No pudimos confirmar el registro. Conservamos tus datos; vuelve a intentar guardar para recuperar el resultado sin duplicarlo.',
    )
  }
  return (await photos([internalSchema.parse(data)]))[0]
}
