import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { BackendSimilarAsset } from '../api/types'

export interface UseSimilarAssetsResult {
  assets: BackendSimilarAsset[]
  loading: boolean
  error: string | null
}

/**
 * Fetch similar assets for a catalog asset via GET /assets/:id/similar.
 * Ranking is heuristic (shared taxonomy/tags/org) until pgvector embeddings
 * are wired (Phase 2).
 * Returns empty immediately when assetId is undefined.
 */
export function useSimilarAssets(
  assetId: string | undefined,
  limit = 5,
): UseSimilarAssetsResult {
  const [assets, setAssets] = useState<BackendSimilarAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setAssets([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .getSimilarAssets(assetId, limit)
      .then((result) => {
        if (!cancelled) {
          setAssets(result.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load similar assets')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [assetId, limit])

  return { assets, loading, error }
}
