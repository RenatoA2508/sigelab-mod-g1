import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'
import { createFoundObject } from './api'
import { AppError } from '../../lib/errors'

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { id: '11111111-1111-4111-8111-111111111111' } } }),
}))
vi.mock('./api', () => ({ createFoundObject: vi.fn() }))
const file = new File(['test image'], 'mochila.jpg', { type: 'image/jpeg' })
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/registrar']}>
        <Routes>
          <Route path="/registrar" element={<RegisterPage />} />
          <Route path="/hallazgos/:id/confirmacion" element={<h1>Confirmación del hallazgo</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return userEvent.setup()
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Persona que reporta/), 'Juan Pérez')
  await user.type(screen.getByLabelText(/Descripción general/), 'Mochila negra')
  await user.type(screen.getByLabelText(/Lugar del hallazgo/), 'Laboratorio de Física 1')
  await user.type(screen.getByLabelText(/Fecha del hallazgo/), '2026-11-09')
}
beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:preview'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
})
describe('HU-01: formulario conectado al servicio', () => {
  it('campos incompletos: presenta todos los errores y nunca llama al backend', async () => {
    const user = setup()
    await user.upload(screen.getByLabelText(/Fotografía del objeto/), file)
    await user.click(screen.getByRole('button', { name: 'Guardar registro' }))
    expect(await screen.findByText('Ingresa el nombre de quien reporta.')).toBeVisible()
    expect(screen.getByText('Ingresa una descripción del objeto.')).toBeVisible()
    expect(screen.getByText('Indica el lugar del hallazgo.')).toBeVisible()
    expect(screen.getByText('Ingresa la fecha del hallazgo.')).toBeVisible()
    expect(createFoundObject).not.toHaveBeenCalled()
    expect(screen.getByText('mochila.jpg')).toBeVisible()
  })
  it('fotografía faltante: conserva los datos y evita el envío', async () => {
    const user = setup()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Guardar registro' }))
    expect(await screen.findByText('Falta la fotografía')).toBeVisible()
    expect(screen.getByText('Adjunta una fotografía del objeto.')).toBeVisible()
    expect(screen.getByLabelText(/Persona que reporta/)).toHaveValue('Juan Pérez')
    expect(screen.getByLabelText(/Descripción general/)).toHaveValue('Mochila negra')
    expect(createFoundObject).not.toHaveBeenCalled()
  })
  it('un envío válido usa la sesión del personal y abre la confirmación persistente', async () => {
    vi.mocked(createFoundObject).mockResolvedValue({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    } as Awaited<ReturnType<typeof createFoundObject>>)
    const user = setup()
    await fill(user)
    await user.upload(screen.getByLabelText(/Fotografía del objeto/), file)
    await user.click(screen.getByRole('button', { name: 'Guardar registro' }))
    expect(await screen.findByRole('heading', { name: 'Confirmación del hallazgo' })).toBeVisible()
    expect(createFoundObject).toHaveBeenCalledWith(
      expect.objectContaining({
        reporter: 'Juan Pérez',
        description: 'Mochila negra',
        photo: file,
      }),
      expect.any(String),
      '11111111-1111-4111-8111-111111111111',
    )
  })
  it('un fallo de red conserva el formulario y reutiliza la operación al reintentar', async () => {
    vi.mocked(createFoundObject).mockRejectedValue(new AppError('Conexión interrumpida'))
    const user = setup()
    await fill(user)
    await user.upload(screen.getByLabelText(/Fotografía del objeto/), file)
    await user.click(screen.getByRole('button', { name: 'Guardar registro' }))
    expect(await screen.findByText('Conexión interrumpida')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Guardar registro' }))
    await waitFor(() => expect(createFoundObject).toHaveBeenCalledTimes(2))
    expect(vi.mocked(createFoundObject).mock.calls[0][1]).toBe(
      vi.mocked(createFoundObject).mock.calls[1][1],
    )
    expect(screen.getByLabelText(/Persona que reporta/)).toHaveValue('Juan Pérez')
  })
})
