import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CatalogView } from './CatalogView'
import { listAvailableObjects } from './api'

export function CatalogPage() {
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: ['available-objects', page],
    queryFn: ({ signal }) => listAvailableObjects(page, signal),
    refetchInterval: 240_000,
  })
  useEffect(() => {
    document.title = 'Objetos encontrados · SIGELAB'
  }, [])
  return <CatalogView query={query} page={page} setPage={setPage} />
}
