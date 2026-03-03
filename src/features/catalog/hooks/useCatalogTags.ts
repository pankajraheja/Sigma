import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { BackendTag, TagSearchParams } from '../api/types'

export interface UseCatalogTagsResult {
  tags: BackendTag[]
  loading: boolean
  error: string | null
}

/**
 * Fetch available tags from the catalog, optionally filtered by a search string.
 */
export function useCatalogTags(params: TagSearchParams = {}): UseCatalogTagsResult {
  const [tags, setTags] = useState<BackendTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const key = JSON.stringify(params)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .getTags(params)
      .then((result) => {
        if (!cancelled) {
          setTags(result.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load tags')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { tags, loading, error }
}
