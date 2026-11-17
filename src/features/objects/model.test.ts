import { describe, expect, it } from 'vitest'
import { displayDate, isCalendarDate, registrationSchema } from './model'

const valid = {
  reporter: 'Juan Pérez',
  description: 'Mochila negra',
  location: 'Laboratorio de Física 1',
  date: '2026-11-09',
  photo: new File(['photo'], 'mochila.jpg', { type: 'image/jpeg' }),
}
describe('datos de registro', () => {
  it('acepta los cinco datos y elimina espacios externos', () => {
    expect(registrationSchema.parse({ ...valid, reporter: ' Juan Pérez ' }).reporter).toBe(
      'Juan Pérez',
    )
  })
  it('identifica todos los datos obligatorios incompletos', () => {
    const result = registrationSchema.safeParse({
      reporter: ' ',
      description: '',
      location: '',
      date: '',
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(new Set(result.error.issues.map((issue) => issue.path[0]))).toEqual(
        new Set(['reporter', 'description', 'location', 'date', 'photo']),
      )
  })
  it('requiere una fotografía real seleccionada', () => {
    const result = registrationSchema.safeParse({ ...valid, photo: undefined })
    expect(result.success).toBe(false)
  })
  it('rechaza SVG y archivos que superan el límite de almacenamiento', () => {
    expect(
      registrationSchema.safeParse({
        ...valid,
        photo: new File(['svg'], 'image.svg', { type: 'image/svg+xml' }),
      }).success,
    ).toBe(false)
    expect(
      registrationSchema.safeParse({
        ...valid,
        photo: new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
      }).success,
    ).toBe(false)
  })
  it('valida el calendario y no cambia el día por la zona horaria', () => {
    expect(isCalendarDate('2026-02-30')).toBe(false)
    expect(isCalendarDate('2024-02-29')).toBe(true)
    expect(displayDate('2026-11-09')).toBe('09/11/2026')
  })
})
