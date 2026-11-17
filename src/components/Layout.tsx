import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { ArrowUpRight, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../features/auth/AuthProvider'
import { ErrorNotice } from './Feedback'

export function Layout() {
  const { isStaff, session, signOut } = useAuth()
  const [error, setError] = useState(false)
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <div className="institution">
        <div className="container institution-inner">
          <span>LABFIS · ESCUELA POLITÉCNICA NACIONAL</span>
          <span className="institution-extra">Comunidad que cuida lo que encuentras</span>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/objetos" aria-label="SIGELAB, inicio">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <strong>SIGELAB</strong>
              <small>Objetos perdidos · LABFIS</small>
            </span>
          </Link>
          <nav aria-label="Navegación principal">
            <NavLink to="/objetos">Objetos encontrados</NavLink>
            <NavLink to="/registrar">Registrar hallazgo</NavLink>
          </nav>
          {session ? (
            <button
              className="header-access"
              onClick={() => {
                setError(false)
                void signOut().catch(() => setError(true))
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              Cerrar sesión
            </button>
          ) : (
            <Link className="header-access" to="/acceso">
              <ShieldCheck size={16} aria-hidden="true" />
              Personal LABFIS
            </Link>
          )}
        </div>
      </header>
      <main id="main-content" className="container main-container" tabIndex={-1}>
        {error && (
          <ErrorNotice title="No pudimos cerrar tu sesión.">
            Revisa tu conexión y vuelve a intentarlo.
          </ErrorNotice>
        )}
        {isStaff && (
          <p className="staff-indicator">
            <ShieldCheck size={14} aria-hidden="true" />
            Sesión autorizada de LABFIS
          </p>
        )}
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>SIGELAB</strong>
            <p>Gestión de objetos encontrados en los laboratorios.</p>
          </div>
          <a href="https://www.epn.edu.ec" target="_blank" rel="noreferrer">
            Escuela Politécnica Nacional
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </footer>
    </>
  )
}
