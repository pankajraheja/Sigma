import { useState, useEffect } from 'react'
import { catalogApi } from '../api/catalogApi'
import type { ApiHealthResponse } from '../api/types'

export interface UseCatalogHealthResult {
  health: ApiHealthResponse | null
  loading: boolean
  error: string | null
}

export function useCatalogHealth(): UseCatalogHealthResult {
  const [health, setHealth] = useState<ApiHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    catalogApi
      .health()
      .then((result) => {
        if (!cancelled) {
          setHealth(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to reach Catalog service')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { health, loading, error }
}
