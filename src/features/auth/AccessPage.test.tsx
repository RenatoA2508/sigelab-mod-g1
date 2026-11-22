import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AccessPage } from './AccessPage'

const auth = vi.hoisted(() => ({ signUp: vi.fn(), signInWithPassword: vi.fn() }))

vi.mock('../../lib/supabase', () => ({ supabase: { auth } }))
vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ session: null, loading: false, isStaff: false, roleError: false }),
}))

it('permite comprobar cada contraseña y solo crea la cuenta si coinciden', async () => {
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <AccessPage />
    </MemoryRouter>,
  )
  await user.click(screen.getByRole('button', { name: 'Es mi primer acceso' }))

  const password = screen.getByLabelText('Contraseña', { exact: true })
  const confirmation = screen.getByLabelText('Confirmar contraseña', { exact: true })
  await user.type(screen.getByLabelText('Correo electrónico'), 'personal@example.test')
  await user.type(password, 'clave-original')
  await user.type(confirmation, 'clave-distinta')
  expect(password).toHaveAttribute('type', 'password')
  expect(confirmation).toHaveAttribute('type', 'password')
  await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
  expect(password).toHaveAttribute('type', 'text')
  expect(confirmation).toHaveAttribute('type', 'password')
  await user.click(screen.getByRole('button', { name: 'Mostrar confirmación de contraseña' }))
  await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
  expect(password).toHaveAttribute('type', 'password')
  expect(confirmation).toHaveAttribute('type', 'text')

  const submit = screen.getByRole('button', { name: 'Crear cuenta y confirmar correo' })
  await user.click(submit)
  expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas deben coincidir.')
  expect(confirmation).toHaveFocus()
  expect(auth.signUp).not.toHaveBeenCalled()

  await user.clear(confirmation)
  await user.type(confirmation, 'clave-original')
  await user.click(submit)
  expect(await screen.findByRole('status')).toHaveTextContent('confirma tu cuenta')
  expect(auth.signUp).toHaveBeenCalledExactlyOnceWith({
    email: 'personal@example.test',
    password: 'clave-original',
    options: { emailRedirectTo: `${window.location.origin}/acceso` },
  })
})
