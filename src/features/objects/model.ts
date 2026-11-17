import { z } from 'zod'

export const PHOTO_LIMIT = 10 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const registrationSchema = z.object({
  reporter: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre de quien reporta.')
    .max(200, 'Usa un máximo de 200 caracteres.'),
  description: z
    .string()
    .trim()
    .min(1, 'Ingresa una descripción del objeto.')
    .max(2000, 'Usa un máximo de 2000 caracteres.'),
  location: z
    .string()
    .trim()
    .min(1, 'Indica el lugar del hallazgo.')
    .max(200, 'Usa un máximo de 200 caracteres.'),
  date: z
    .string()
    .min(1, 'Ingresa la fecha del hallazgo.')
    .refine(isCalendarDate, 'Ingresa una fecha válida.'),
  photo: z
    .custom<File>((value) => value instanceof File, 'Adjunta una fotografía del objeto.')
    .refine((file) => !file || file.size > 0, 'La imagen está vacía.')
    .refine((file) => !file || file.size <= PHOTO_LIMIT, 'La imagen debe pesar como máximo 10 MB.')
    .refine(
      (file) => !file || PHOTO_TYPES.includes(file.type),
      'Selecciona una imagen JPG, PNG o WebP.',
    ),
})

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export type Registration = z.infer<typeof registrationSchema>
export type PublicObject = {
  id: string
  description: string
  found_location: string
  found_on: string
  photo_path: string
  status: 'available' | 'returned'
  created_at: string
  updated_at: string
  photoUrl: string | null
}
export type InternalObject = PublicObject & { reporter_name: string; photo_original_name: string }

export function displayDate(value: string): string {
  if (!isCalendarDate(value)) return value
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export async function hasValidImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (file.type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (file.type === 'image/png')
    return [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
  if (file.type === 'image/webp')
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    )
  return false
}
