import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { ApiAssetListResponse, CatalogListParams } from '../api/types'

export interface UseCatalogAssetsResult {
  data: ApiAssetListResponse | null
  loading: boolean
  error: string | null
}

export function useCatalogAssets(params: CatalogListParams): UseCatalogAssetsResult {
  const [data, setData] = useState<ApiAssetListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Serialise params to a stable string so the effect re-runs only on real changes
  const key = JSON.stringify(params)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .listAssets(params)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load assets')
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
