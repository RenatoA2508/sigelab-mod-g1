import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CatalogPage } from './CatalogPage'
import { listAvailableObjects } from './api'
import { AppError } from '../../lib/errors'

vi.mock('./api', () => ({ listAvailableObjects: vi.fn(), PAGE_SIZE: 12 }))
function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <CatalogPage />
    </QueryClientProvider>,
  )
}
describe('HU-02: estados del catálogo', () => {
  it('muestra el estado vacío con contador cero', async () => {
    vi.mocked(listAvailableObjects).mockResolvedValue({ objects: [], count: 0 })
    renderPage()
    expect(await screen.findByText('No hay objetos disponibles')).toBeVisible()
    expect(screen.getByText('0 OBJETOS DISPONIBLES')).toBeVisible()
  })
  it('muestra la información general del catálogo sin identidad del reportante', async () => {
    vi.mocked(listAvailableObjects).mockResolvedValue({
      objects: [
        {
          id: '1',
          description: 'Mochila negra',
          found_location: 'Laboratorio de Física 1',
          found_on: '2026-11-09',
          photo_path: 'photo.jpg',
          photoUrl: 'https://example.com/photo.jpg',
          status: 'available',
          created_at: '',
          updated_at: '',
        },
      ],
      count: 1,
    })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Mochila negra' })).toBeVisible()
    expect(screen.getByText('1 OBJETO DISPONIBLE')).toBeVisible()
    expect(screen.getByText('09/11/2026')).toBeVisible()
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
  })
  it('distingue un fallo del backend de un catálogo vacío', async () => {
    vi.mocked(listAvailableObjects).mockRejectedValue(new AppError('Servicio no disponible'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible')
    expect(screen.queryByText('No hay objetos disponibles')).not.toBeInTheDocument()
  })
})
