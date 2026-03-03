import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { ApiAssetDetailResponse, BackendAssetVersion } from '../api/types'

export interface UseCatalogAssetDetailResult {
  detail: ApiAssetDetailResponse | null
  versions: BackendAssetVersion[]
  loading: boolean
  error: string | null
  notFound: boolean
}

export function useCatalogAssetDetail(id: string | undefined): UseCatalogAssetDetailResult {
  const [detail, setDetail] = useState<ApiAssetDetailResponse | null>(null)
  const [versions, setVersions] = useState<BackendAssetVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)

    Promise.all([catalogApi.getAsset(id), catalogApi.getVersions(id)])
      .then(([assetDetail, versionsResp]) => {
        if (!cancelled) {
          setDetail(assetDetail)
          setVersions(versionsResp.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true)
          } else {
            setError(err instanceof ApiError ? err.message : 'Failed to load asset')
          }
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return { detail, versions, loading, error, notFound }
}
