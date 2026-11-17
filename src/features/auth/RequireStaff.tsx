import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { ErrorNotice, Loading } from '../../components/Feedback'

export function RequireStaff() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading) return <Loading label="Comprobando acceso a LABFIS…" />
  if (!auth.session) return <Navigate to="/acceso" replace state={{ from: location.pathname }} />
  if (auth.roleError)
    return (
      <ErrorNotice title="No pudimos verificar tu acceso.">
        Actualiza la página para volver a comprobarlo.
      </ErrorNotice>
    )
  if (!auth.isStaff)
    return (
      <section className="narrow-page">
        <p className="eyebrow">Acceso a LABFIS</p>
        <h1>Tu cuenta aún no tiene autorización</h1>
        <p className="lead">
          Puedes consultar los objetos encontrados. Para registrar hallazgos, solicita al
          responsable de LABFIS que habilite tu cuenta.
        </p>
        <a className="button button--primary" href="/objetos">
          Consultar objetos
        </a>
      </section>
    )
  return <Outlet />
}
