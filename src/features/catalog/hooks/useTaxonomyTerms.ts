import { useState, useEffect } from 'react'
import { catalogApi, ApiError } from '../api/catalogApi'
import type { BackendTaxonomyTerm } from '../api/types'

export interface UseTaxonomyTermsResult {
  terms: BackendTaxonomyTerm[]
  loading: boolean
  error: string | null
}

/**
 * Fetch taxonomy terms for a given scheme code.
 * Pass `undefined` to load all active terms across all schemes.
 */
export function useTaxonomyTerms(scheme?: string): UseTaxonomyTermsResult {
  const [terms, setTerms] = useState<BackendTaxonomyTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    catalogApi
      .getTaxonomy(scheme ? { scheme } : {})
      .then((result) => {
        if (!cancelled) {
          setTerms(result.data)
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
  }, [scheme])

  return { terms, loading, error }
}
