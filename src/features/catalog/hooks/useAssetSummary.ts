import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { ApiAssetAiSummaryResponse } from '../api/types'

export interface UseAssetSummaryResult {
  summary: ApiAssetAiSummaryResponse | null
  loading: boolean
  error: string | null
}

export function useAssetSummary(assetId: string | undefined): UseAssetSummaryResult {
  const [summary, setSummary] = useState<ApiAssetAiSummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setSummary(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .getAssetSummary(assetId)
      .then((result) => {
        if (!cancelled) {
          setSummary(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load AI summary')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [assetId])

  return { summary, loading, error }
}
