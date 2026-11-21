import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, Check, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import { registrationSchema, type Registration } from './model'
import { createFoundObject } from './api'
import { useAuth } from '../auth/AuthProvider'
import { AppError, userMessage } from '../../lib/errors'
import { ErrorNotice } from '../../components/Feedback'

function PhotoPreview({ photo }: { photo: File | undefined }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    if (ref.current) ref.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [photo])
  return photo ? (
    <img ref={ref} className="upload-preview" alt="Vista previa de la fotografía seleccionada" />
  ) : (
    <Camera size={27} aria-hidden="true" />
  )
}

export function RegisterPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const operation = useRef<{ fingerprint: string; id: string } | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Registration>({
    resolver: zodResolver(registrationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { reporter: '', description: '', location: '', date: '' },
  })
  const photo = useWatch({ name: 'photo', control })
  useEffect(() => {
    register('photo')
  }, [register])
  useEffect(() => {
    document.title = 'Registrar un hallazgo · SIGELAB'
  }, [])
  const inputKeys = Object.keys(errors).filter((key) => key !== 'root')
  const photoOnly = inputKeys.length === 1 && inputKeys[0] === 'photo'
  async function submit(values: Registration) {
    if (!session) return
    const fingerprint = JSON.stringify([
      values.reporter,
      values.description,
      values.location,
      values.date,
      values.photo.name,
      values.photo.size,
      values.photo.lastModified,
    ])
    if (operation.current?.fingerprint !== fingerprint)
      operation.current = { fingerprint, id: crypto.randomUUID() }
    try {
      const object = await createFoundObject(values, operation.current.id, session.user.id)
      queryClient.setQueryData(['internal-object', session.user.id, object.id], object)
      await queryClient.invalidateQueries({ queryKey: ['available-objects'] })
      navigate(`/hallazgos/${object.id}/confirmacion`, { replace: true })
    } catch (error) {
      if (error instanceof AppError && error.field === 'photo')
        setError('photo', { type: 'server', message: error.message }, { shouldFocus: true })
      else setError('root', { message: userMessage(error) })
    }
  }
  return (
    <>
      <div className="registration-layout">
        <section className="panel registration-panel" aria-labelledby="form-title">
          <div className="panel-topline">
            <span className="step-dot">
              <Check size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 id="form-title">Registrar un hallazgo</h2>
              <p className="muted">
                Los campos con <span aria-hidden="true">*</span> son obligatorios.
              </p>
            </div>
          </div>
          {inputKeys.length > 0 && (
            <ErrorNotice
              title={
                photoOnly
                  ? photo
                    ? 'Revisa la fotografía'
                    : 'Falta la fotografía'
                  : 'Revisa los campos obligatorios'
              }
            >
              Completa los campos señalados. El hallazgo aún no se ha registrado.
            </ErrorNotice>
          )}
          {errors.root?.message && (
            <ErrorNotice title="No pudimos confirmar el registro">
              {errors.root.message}
            </ErrorNotice>
          )}
          <form
            onSubmit={(event) => {
              void handleSubmit(submit, (failures) => {
                if (failures.photo && Object.keys(failures).length === 1)
                  document.getElementById('photo')?.focus()
              })(event)
            }}
            noValidate
            aria-busy={isSubmitting}
          >
            <fieldset disabled={isSubmitting}>
              <legend className="sr-only">Datos del hallazgo</legend>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="reporter">
                    Persona que reporta <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reporter"
                    autoComplete="name"
                    maxLength={200}
                    required
                    {...register('reporter')}
                    aria-invalid={!!errors.reporter}
                    aria-describedby={errors.reporter ? 'reporter-error' : undefined}
                  />
                  {errors.reporter && (
                    <p id="reporter-error" className="field-error">
                      {errors.reporter.message}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="date">
                    Fecha del hallazgo <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    required
                    {...register('date')}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? 'date-error' : undefined}
                  />
                  {errors.date && (
                    <p id="date-error" className="field-error">
                      {errors.date.message}
                    </p>
                  )}
                </div>
                <div className="field field--full">
                  <label htmlFor="location">
                    Lugar del hallazgo <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="location"
                    placeholder="Bloque o laboratorio donde se encontró"
                    maxLength={200}
                    required
                    {...register('location')}
                    aria-invalid={!!errors.location}
                    aria-describedby={errors.location ? 'location-error' : undefined}
                  />
                  {errors.location && (
                    <p id="location-error" className="field-error">
                      {errors.location.message}
                    </p>
                  )}
                </div>
                <div className="field field--full">
                  <label htmlFor="description">
                    Descripción general <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Tipo, color y condición general del objeto"
                    maxLength={2000}
                    required
                    {...register('description')}
                    aria-invalid={!!errors.description}
                    aria-describedby={`description-help${errors.description ? ' description-error' : ''}`}
                  />
                  <p id="description-help" className="field-help">
                    Describe solo la información que se mostrará públicamente. Reserva los rasgos
                    únicos para la verificación en LABFIS.
                  </p>
                  {errors.description && (
                    <p id="description-error" className="field-error">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="field upload-field">
                <label htmlFor="photo">
                  Fotografía del objeto <span aria-hidden="true">*</span>
                </label>
                <div className={`upload-surface${errors.photo ? ' upload-surface--error' : ''}`}>
                  <div className="upload-icon">
                    <PhotoPreview photo={photo} />
                  </div>
                  <div className="upload-info">
                    <strong>{photo ? photo.name : 'Añadir fotografía'}</strong>
                    <p>JPG, PNG o WebP · hasta 10 MB</p>
                    <input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      name="photo"
                      required
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) setValue('photo', file, { shouldValidate: true })
                      }}
                      aria-invalid={!!errors.photo}
                      aria-describedby={errors.photo ? 'photo-error' : 'photo-help'}
                    />
                    {photo && (
                      <button
                        className="text-button remove-photo"
                        type="button"
                        onClick={() => {
                          const element = document.getElementById(
                            'photo',
                          ) as HTMLInputElement | null
                          if (element) element.value = ''
                          setValue('photo', undefined as unknown as File, { shouldValidate: true })
                        }}
                      >
                        <X size={13} aria-hidden="true" />
                        Quitar fotografía
                      </button>
                    )}
                  </div>
                </div>
                <p id="photo-help" className="field-help">
                  Una imagen clara facilita el reconocimiento.
                </p>
                {errors.photo && (
                  <p className="field-error" id="photo-error">
                    {errors.photo.message}
                  </p>
                )}
              </div>
              <button
                className="button button--primary button--block submit-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="spinner" size={18} aria-hidden="true" />
                    Guardando hallazgo…
                  </>
                ) : (
                  'Guardar registro'
                )}
              </button>
            </fieldset>
          </form>
        </section>
        <aside className="panel registration-aside">
          <div className="aside-icon">
            <ShieldCheck size={27} aria-hidden="true" />
          </div>
          <h2>Información cuidada desde el inicio</h2>
          <p>
            El nombre de quien reporta es de uso interno. La comunidad verá únicamente la
            información general del objeto, el lugar, la fecha y su fotografía.
          </p>
          <div className="aside-divider" />
          <h3>Antes de registrar</h3>
          <ul>
            <li>Comprueba el lugar y la fecha del hallazgo.</li>
            <li>Usa una descripción clara y general.</li>
            <li>Evita incluir datos personales en la fotografía.</li>
          </ul>
          <p className="aside-note">
            Una vez guardado, el hallazgo estará disponible en el catálogo de SIGELAB.
          </p>
        </aside>
      </div>
    </>
  )
}
