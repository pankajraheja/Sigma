import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { BackendAssetClassification, BackendAssetTag } from '../api/types'

export interface UseAssetTaxonomyResult {
  classifications: BackendAssetClassification[]
  tags: BackendAssetTag[]
  loading: boolean
  error: string | null
}

/**
 * Fetch taxonomy classifications and informal tags for a single catalog asset.
 * Both requests run in parallel. Returns empty arrays when the asset has none.
 */
export function useAssetTaxonomy(assetId: string | undefined): UseAssetTaxonomyResult {
  const [classifications, setClassifications] = useState<BackendAssetClassification[]>([])
  const [tags, setTags] = useState<BackendAssetTag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setClassifications([])
      setTags([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      catalogApi.getClassifications(assetId),
      catalogApi.getAssetTags(assetId),
    ])
      .then(([classRes, tagRes]) => {
        if (!cancelled) {
          setClassifications(classRes.data)
          setTags(tagRes.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load taxonomy')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [assetId])

  return { classifications, tags, loading, error }
}
