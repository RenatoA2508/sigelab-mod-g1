import { lazy, Suspense, Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/AuthProvider'
import { RequireStaff } from './features/auth/RequireStaff'
import { AccessPage } from './features/auth/AccessPage'
import { Layout } from './components/Layout'
import { Loading } from './components/Feedback'
import { isConfigured } from './lib/supabase'

const Catalog = lazy(() =>
  import('./features/objects/CatalogPage').then((m) => ({ default: m.CatalogPage })),
)
const Register = lazy(() =>
  import('./features/objects/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const Confirmation = lazy(() =>
  import('./features/objects/ConfirmationPage').then((m) => ({ default: m.ConfirmationPage })),
)
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 }, mutations: { retry: false } },
})

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <div className="unavailable">
          <h1>No pudimos abrir SIGELAB</h1>
          <p>Recarga la página para volver a intentarlo.</p>
          <button className="button button--primary" onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      )
    return this.props.children
  }
}

export function App() {
  if (!isConfigured)
    return (
      <section className="unavailable">
        <p className="eyebrow">SIGELAB</p>
        <h1>El servicio aún no está disponible</h1>
        <p>Contacta al responsable de LABFIS para completar la configuración del servicio.</p>
      </section>
    )
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading label="Abriendo SIGELAB…" />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Navigate to="/objetos" replace />} />
                  <Route path="objetos" element={<Catalog />} />
                  <Route path="acceso" element={<AccessPage />} />
                  <Route element={<RequireStaff />}>
                    <Route path="registrar" element={<Register />} />
                    <Route path="hallazgos/:id/confirmacion" element={<Confirmation />} />
                  </Route>
                  <Route
                    path="*"
                    element={
                      <section className="narrow-page">
                        <p className="eyebrow">Página no encontrada</p>
                        <h1>Volvamos a los objetos encontrados</h1>
                        <Link to="/objetos" className="button button--primary">
                          Consultar objetos
                        </Link>
                      </section>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
