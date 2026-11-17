import { AlertCircle, LoaderCircle } from 'lucide-react'

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spinner" size={22} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorNotice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="notice notice--error" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </div>
  )
}
