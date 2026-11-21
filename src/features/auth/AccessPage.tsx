import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from './AuthProvider'
import { ErrorNotice, Loading } from '../../components/Feedback'

export function AccessPage() {
  const { session, loading, isStaff, roleError } = useAuth()
  const location = useLocation()
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    document.title = 'Acceso LABFIS · SIGELAB'
  }, [])
  const from: unknown = location.state?.from
  const destination =
    typeof from === 'string' && /^\/(registrar|hallazgos\/[0-9a-f-]+\/confirmacion)$/.test(from)
      ? from
      : '/registrar'
  if (loading) return <Loading label="Comprobando sesión…" />
  if (session && isStaff) return <Navigate to={destination} replace />
  if (session)
    return (
      <div className="narrow-page">
        <h1>
          {roleError ? 'No pudimos verificar tu acceso' : 'Tu cuenta aún no tiene autorización'}
        </h1>
        <p className="lead">
          Contacta al responsable de LABFIS para habilitar el registro de hallazgos. La consulta
          pública sigue disponible.
        </p>
        <a className="button button--primary" href="/objetos">
          Consultar objetos
        </a>
      </div>
    )
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      if (creating) {
        const { data, error: failure } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/acceso` },
        })
        if (failure) throw failure
        if (!data.session)
          setNotice(
            'Revisa tu correo y confirma tu cuenta. Después podrás iniciar sesión con tu contraseña. La autorización para registrar depende del responsable de LABFIS.',
          )
      } else {
        const { error: failure } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (failure) throw failure
      }
    } catch {
      setError(
        creating
          ? 'No pudimos activar la cuenta. Comprueba tus datos e inténtalo de nuevo. Si ya tienes una cuenta, inicia sesión.'
          : 'No pudimos iniciar sesión. Revisa el correo y la contraseña; si acabas de crear tu cuenta, confirma primero tu correo.',
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="access-layout">
      <section className="panel access-panel">
        <p className="eyebrow">Personal LABFIS</p>
        <h1>{creating ? 'Activar cuenta de LABFIS' : 'Iniciar sesión'}</h1>
        <p className="muted">
          {creating
            ? 'Usa el correo que el responsable autorizó para LABFIS.'
            : 'Accede con tu cuenta del personal de LABFIS.'}
        </p>
        {error && <ErrorNotice title="Revisa tu acceso">{error}</ErrorNotice>}
        {notice && (
          <div className="notice notice--success" role="status">
            <Mail aria-hidden="true" size={22} />
            <p>{notice}</p>
          </div>
        )}
        <form onSubmit={submit} className="form-stack">
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={creating ? 'new-password' : 'current-password'}
              minLength={creating ? 8 : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
            {creating && <p className="field-help">Usa al menos 8 caracteres.</p>}
          </div>
          <button className="button button--primary button--block" disabled={pending}>
            {pending
              ? 'Procesando…'
              : creating
                ? 'Crear cuenta y confirmar correo'
                : 'Iniciar sesión'}
          </button>
        </form>
        <button
          type="button"
          className="text-button"
          disabled={pending}
          onClick={() => {
            setCreating(!creating)
            setError('')
            setNotice('')
            setPassword('')
          }}
        >
          {creating ? 'Ya tengo una cuenta' : 'Es mi primer acceso'}
        </button>
        <p className="field-help">
          Los estudiantes y docentes pueden consultar el catálogo sin iniciar sesión.
        </p>
      </section>
    </div>
  )
}
