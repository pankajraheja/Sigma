import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { ApiAssetRecommendation } from '../api/types'

export interface UseAssetRecommendationsResult {
  recommendations: ApiAssetRecommendation[]
  provider: 'openai' | 'stub' | null
  loading: boolean
  error: string | null
}

export function useAssetRecommendations(
  assetId: string | undefined,
  limit = 5,
): UseAssetRecommendationsResult {
  const [recommendations, setRecommendations] = useState<ApiAssetRecommendation[]>([])
  const [provider, setProvider] = useState<'openai' | 'stub' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setRecommendations([])
      setProvider(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .getAssetRecommendations(assetId, limit)
      .then((result) => {
        if (!cancelled) {
          setRecommendations(result.data)
          setProvider(result.provider)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load recommendations')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [assetId, limit])

  return { recommendations, provider, loading, error }
}
