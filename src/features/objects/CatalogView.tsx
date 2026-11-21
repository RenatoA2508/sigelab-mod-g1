import type { Dispatch, SetStateAction } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Archive, ArrowLeft, ArrowRight } from 'lucide-react'
import { PAGE_SIZE } from './api'
import { displayDate, type PublicObject } from './model'
import { ErrorNotice, Loading } from '../../components/Feedback'
import { ObjectPhoto } from '../../components/ObjectPhoto'
import { userMessage } from '../../lib/errors'

type Props = {
  query: UseQueryResult<{ objects: PublicObject[]; count: number }, Error>
  page: number
  setPage: Dispatch<SetStateAction<number>>
}

export function CatalogView({ query, page, setPage }: Props) {
  return (
    <section className="panel catalog-panel">
      <div className="catalog-toolbar">
        <h2 id="catalog-heading">Objetos encontrados</h2>
        <button
          className="button button--secondary button--small"
          onClick={() => {
            void query.refetch()
          }}
          disabled={query.isFetching}
        >
          Actualizar listado
        </button>
      </div>
      {query.isPending ? (
        <Loading label="Cargando objetos encontrados…" />
      ) : query.isError ? (
        <ErrorNotice title="No pudimos cargar el catálogo">{userMessage(query.error)}</ErrorNotice>
      ) : (
        <>
          <p className="result-count" role="status">
            {query.data.count}{' '}
            {query.data.count === 1 ? 'OBJETO DISPONIBLE' : 'OBJETOS DISPONIBLES'}
          </p>
          {query.data.count === 0 ? (
            <section className="empty-state" aria-labelledby="empty-heading">
              <div className="empty-icon">
                <Archive size={32} aria-hidden="true" />
              </div>
              <h3 id="empty-heading">No hay objetos disponibles</h3>
              <p>
                No hay hallazgos disponibles para consulta en este momento.
                <br />
                Vuelve a revisar más tarde.
              </p>
            </section>
          ) : query.data.objects.length === 0 ? (
            <div className="empty-state">
              <h3>El listado ha cambiado</h3>
              <p>Vuelve a la primera página para ver los objetos disponibles.</p>
              <button className="button button--secondary" onClick={() => setPage(0)}>
                Volver al inicio del listado
              </button>
            </div>
          ) : (
            <section className="objects-grid" aria-labelledby="catalog-heading">
              {query.data.objects.map((object) => (
                <article className="object-card" key={object.id}>
                  <div className="object-photo-wrap">
                    <ObjectPhoto
                      className="object-photo"
                      src={object.photoUrl}
                      alt={`Fotografía de ${object.description}`}
                    />
                    <span className="availability">Disponible</span>
                  </div>
                  <div className="object-card-body">
                    <h3>{object.description}</h3>
                    <div className="object-card-meta">
                      <p>{object.found_location}</p>
                      <p>
                        Hallazgo ·{' '}
                        <time dateTime={object.found_on}>{displayDate(object.found_on)}</time>
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
          {query.data.count > PAGE_SIZE && query.data.objects.length > 0 && (
            <nav aria-label="Páginas del catálogo" className="pagination">
              <button
                className="button button--secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Anterior
              </button>
              <span>
                Página {page + 1} de {Math.ceil(query.data.count / PAGE_SIZE)}
              </span>
              <button
                className="button button--secondary"
                disabled={(page + 1) * PAGE_SIZE >= query.data.count}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
          <p className="catalog-footnote">
            Se muestran únicamente objetos disponibles para recuperación. Los datos de quien reporta
            son de uso interno de LABFIS.
          </p>
        </>
      )}
    </section>
  )
}
