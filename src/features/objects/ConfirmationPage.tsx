import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ArrowRight, Plus } from 'lucide-react'
import { z } from 'zod'
import { getInternalObject } from './api'
import { displayDate } from './model'
import { useAuth } from '../auth/AuthProvider'
import { ErrorNotice, Loading } from '../../components/Feedback'
import { ObjectPhoto } from '../../components/ObjectPhoto'
import { userMessage } from '../../lib/errors'

export function ConfirmationPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  const valid = z.uuid().safeParse(id).success
  const query = useQuery({
    queryKey: ['internal-object', session?.user.id, id],
    queryFn: () => getInternalObject(id),
    enabled: valid,
    refetchInterval: 240_000,
  })
  useEffect(() => {
    document.title = 'Hallazgo registrado · SIGELAB'
  }, [])
  if (!valid)
    return (
      <ErrorNotice title="Registro no encontrado.">Comprueba el enlace del hallazgo.</ErrorNotice>
    )
  if (query.isPending) return <Loading label="Consultando el registro…" />
  if (query.isError)
    return (
      <ErrorNotice title="No pudimos consultar el hallazgo">{userMessage(query.error)}</ErrorNotice>
    )
  const object = query.data
  if (!object)
    return (
      <ErrorNotice title="Registro no encontrado.">
        El hallazgo no existe o no está disponible para tu cuenta.
      </ErrorNotice>
    )
  return (
    <section className="confirmation">
      <div className="success-mark">
        <Check size={34} aria-hidden="true" />
      </div>
      <p className="eyebrow" role="status">
        Registro exitoso
      </p>
      <h1>Hallazgo registrado</h1>
      <p className="lead">La información se guardó correctamente en SIGELAB.</p>
      <article className="panel confirmation-record">
        <div>
          <span className="status-label">
            {object.status === 'available' ? 'Disponible' : 'Devuelto'}
          </span>
          <h2>{object.description}</h2>
          <dl>
            {[
              ['Persona que reporta', object.reporter_name],
              ['Lugar del hallazgo', object.found_location],
              ['Fecha del hallazgo', displayDate(object.found_on)],
              ['Fotografía', object.photo_original_name],
            ].map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ObjectPhoto
          className="confirmation-photo"
          src={object.photoUrl}
          alt={`Fotografía de ${object.description}`}
        />
      </article>
      <p className="privacy-note">
        Resumen interno · los datos del reportante no se muestran en el catálogo público.
      </p>
      <div className="confirmation-actions">
        <Link className="button button--primary" to="/objetos">
          Consultar objetos encontrados
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link className="button button--secondary" to="/registrar">
          <Plus size={17} aria-hidden="true" />
          Registrar otro hallazgo
        </Link>
      </div>
    </section>
  )
}
