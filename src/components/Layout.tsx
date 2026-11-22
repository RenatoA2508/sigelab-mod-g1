import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useMatch } from 'react-router-dom'
import { LogOut, Menu, PackageSearch, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../features/auth/AuthProvider'
import { ErrorNotice } from './Feedback'

function Sidebar({ close }: { close?: () => void }) {
  return (
    <div className="sidebar">
      <Link className="brand" to="/objetos" onClick={close} aria-label="LABFIS, inicio">
        <span className="brand-mark" aria-hidden="true">
          L
        </span>
        <span>
          <strong>LABFIS</strong>
          <small>Gestión de laboratorios</small>
        </span>
      </Link>
      {close && (
        <button className="close-menu" onClick={close} aria-label="Cerrar menú">
          <X size={18} />
        </button>
      )}
      <nav aria-label="Módulos LABFIS">
        <p className="nav-label">Módulos</p>
        <NavLink to="/objetos" className="nav" onClick={close}>
          <PackageSearch size={18} aria-hidden="true" /> Objetos perdidos
        </NavLink>
      </nav>
      <p className="sidebar-foot">SIGELAB · Facultad de Ingeniería de Sistemas</p>
    </div>
  )
}

export function Layout() {
  const { isStaff, session, loading, roleError, signOut } = useAuth()
  const staffView = Boolean(session && isStaff && !loading && !roleError)
  const catalog = useMatch('/objetos')
  const register = useMatch('/registrar')
  const [error, setError] = useState(false)
  const drawer = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 781px)')
    function closeOnDesktop() {
      if (desktop.matches) drawer.current?.close()
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>
      <dialog
        className="menu-dialog"
        ref={drawer}
        aria-label="Menú principal"
        onClick={(event) => {
          if (event.target === event.currentTarget) drawer.current?.close()
        }}
      >
        <Sidebar close={() => drawer.current?.close()} />
      </dialog>
      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="menu-toggle"
              aria-label="Abrir menú"
              aria-haspopup="dialog"
              onClick={() => drawer.current?.showModal()}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <div>
              <strong>LABFIS</strong>
              <span className="top-sub"> · Sistema modular</span>
            </div>
          </div>
          <div className="topbar-actions">
            {session ? (
              <button
                className="button button--secondary button--small"
                onClick={() => {
                  setError(false)
                  void signOut().catch(() => setError(true))
                }}
              >
                <LogOut size={15} aria-hidden="true" />
                Cerrar sesión
              </button>
            ) : (
              <Link className="button button--secondary button--small" to="/acceso">
                <ShieldCheck size={15} aria-hidden="true" />
                Personal LABFIS
              </Link>
            )}
          </div>
        </header>
        <main id="main-content" className="content" tabIndex={-1}>
          {error && (
            <ErrorNotice title="No pudimos cerrar tu sesión.">
              Revisa tu conexión y vuelve a intentarlo.
            </ErrorNotice>
          )}
          {staffView && (
            <p className="staff-indicator">
              <ShieldCheck size={14} aria-hidden="true" />
              Sesión autorizada de LABFIS
            </p>
          )}
          {(catalog || (register && staffView)) && (
            <header className="page-intro">
              <p className="eyebrow">Módulo 01 · SIGELAB</p>
              <h1>Objetos perdidos</h1>
              <p className="lead">
                {staffView
                  ? 'Registro y consulta de objetos encontrados en los laboratorios.'
                  : 'Consulta los objetos encontrados en los laboratorios.'}
              </p>
              {staffView && (
                <nav className="tabs" aria-label="Gestión de objetos perdidos">
                  <NavLink to="/objetos">Consultar objetos</NavLink>
                  <NavLink to="/registrar">Registrar hallazgo</NavLink>
                </nav>
              )}
            </header>
          )}
          <Outlet />
        </main>
        <footer>
          LABFIS · SIGELAB ·{' '}
          <a href="https://www.epn.edu.ec" target="_blank" rel="noreferrer">
            Escuela Politécnica Nacional
          </a>
        </footer>
      </div>
    </div>
  )
}
