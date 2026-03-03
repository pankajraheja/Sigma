import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { ApiSearchResponse, SearchParams } from '../api/types'

export interface UseSearchCatalogAssetsResult {
  data: ApiSearchResponse | null
  loading: boolean
  error: string | null
}

const MIN_QUERY_LENGTH = 2

/**
 * Full-text search against GET /api/catalog/search.
 * Returns empty immediately (no API call) when q is shorter than MIN_QUERY_LENGTH.
 * The backend uses PostgreSQL tsvector ranked by ts_rank (name > summary > description).
 */
export function useSearchCatalogAssets(params: SearchParams): UseSearchCatalogAssetsResult {
  const [data, setData] = useState<ApiSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const key = JSON.stringify(params)

  useEffect(() => {
    if (!params.q || params.q.trim().length < MIN_QUERY_LENGTH) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .searchAssets(params)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Search failed')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading, error }
}
