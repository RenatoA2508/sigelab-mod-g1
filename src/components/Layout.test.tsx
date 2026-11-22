import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuth } from '../features/auth/AuthProvider'
import { Layout } from './Layout'

vi.mock('../features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))

const staffSession = { user: { id: 'staff' } } as NonNullable<ReturnType<typeof useAuth>['session']>

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})
afterEach(() => vi.unstubAllGlobals())

function renderCatalog(auth: Partial<ReturnType<typeof useAuth>> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    session: null,
    isStaff: false,
    loading: false,
    roleError: false,
    signOut: vi.fn(),
    ...auth,
  })
  render(
    <MemoryRouter initialEntries={['/objetos']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/objetos" element={<h2>Objetos encontrados</h2>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

it.each([
  ['visitante', {}],
  ['cuenta sin autorización', { session: staffSession }],
  ['permiso sin verificar', { session: staffSession, isStaff: true, roleError: true }],
] as const)('muestra el catálogo sin acciones de gestión para %s', (_, auth) => {
  renderCatalog(auth)
  expect(screen.getByRole('heading', { name: 'Objetos encontrados' })).toBeVisible()
  expect(screen.queryByRole('navigation', { name: 'Gestión de objetos perdidos' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Registrar hallazgo' })).toBeNull()
})

it('muestra el registro en la navegación del personal autorizado', () => {
  renderCatalog({ session: staffSession, isStaff: true })
  expect(screen.getByRole('navigation', { name: 'Gestión de objetos perdidos' })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Registrar hallazgo' })).toHaveAttribute(
    'href',
    '/registrar',
  )
})
