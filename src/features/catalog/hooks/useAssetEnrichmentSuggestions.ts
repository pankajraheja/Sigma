import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { ApiAssetEnrichmentSuggestionsResponse } from '../api/types'

export interface UseAssetEnrichmentSuggestionsResult {
  suggestions: ApiAssetEnrichmentSuggestionsResponse | null
  loading: boolean
  error: string | null
}

export function useAssetEnrichmentSuggestions(
  assetId: string | undefined,
): UseAssetEnrichmentSuggestionsResult {
  const [suggestions, setSuggestions] = useState<ApiAssetEnrichmentSuggestionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setSuggestions(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .getEnrichmentSuggestions(assetId)
      .then((result) => {
        if (!cancelled) {
          setSuggestions(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load enrichment suggestions')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [assetId])

  return { suggestions, loading, error }
}
