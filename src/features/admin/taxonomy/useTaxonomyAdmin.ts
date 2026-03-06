// ---------------------------------------------------------------------------
// useTaxonomyAdmin — hook for taxonomy admin CRUD operations
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react'
import { taxonomyApi, TaxonomyApiError } from '../../../shared/api/taxonomyApi'
import type {
  TaxonomyTerm,
  ConceptScheme,
  CreateTermInput,
  UpdateTermInput,
  CreateSchemeInput,
  UpdateSchemeInput,
} from '../../../shared/types/taxonomy'

export interface UseTaxonomyAdminReturn {
  // Data
  schemes: ConceptScheme[]
  terms: TaxonomyTerm[]
  // Loading / error
  loading: boolean
  error: string | null
  // Refresh
  refreshSchemes: () => Promise<void>
  refreshTerms: (scheme?: string) => Promise<void>
  // Mutations
  createScheme: (input: CreateSchemeInput) => Promise<ConceptScheme>
  updateScheme: (code: string, input: UpdateSchemeInput) => Promise<ConceptScheme>
  createTerm: (input: CreateTermInput) => Promise<TaxonomyTerm>
  updateTerm: (id: string, input: UpdateTermInput) => Promise<TaxonomyTerm>
  deleteTerm: (id: string) => Promise<void>
}

export function useTaxonomyAdmin(initialScheme?: string): UseTaxonomyAdminReturn {
  const [schemes, setSchemes] = useState<ConceptScheme[]>([])
  const [terms, setTerms] = useState<TaxonomyTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSchemes = useCallback(async () => {
    try {
      const res = await taxonomyApi.listConceptSchemes()
      setSchemes(res.data)
    } catch (err) {
      setError(err instanceof TaxonomyApiError ? err.message : 'Failed to load schemes')
    }
  }, [])

  const refreshTerms = useCallback(async (scheme?: string) => {
    try {
      const res = await taxonomyApi.listTerms({
        scheme,
        include_inactive: true,
      })
      setTerms(res.data)
    } catch (err) {
      setError(err instanceof TaxonomyApiError ? err.message : 'Failed to load terms')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      taxonomyApi.listConceptSchemes(),
      taxonomyApi.listTerms({ scheme: initialScheme, include_inactive: true }),
    ])
      .then(([sRes, tRes]) => {
        if (!cancelled) {
          setSchemes(sRes.data)
          setTerms(tRes.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof TaxonomyApiError ? err.message : 'Failed to load taxonomy data')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [initialScheme])

  const createScheme = useCallback(async (input: CreateSchemeInput) => {
    const res = await taxonomyApi.createConceptScheme(input)
    await refreshSchemes()
    return res.data
  }, [refreshSchemes])

  const updateScheme = useCallback(async (code: string, input: UpdateSchemeInput) => {
    const res = await taxonomyApi.updateConceptScheme(code, input)
    await refreshSchemes()
    return res.data
  }, [refreshSchemes])

  const createTerm = useCallback(async (input: CreateTermInput) => {
    const res = await taxonomyApi.createTerm(input)
    setTerms((prev) => [...prev, res.data])
    return res.data
  }, [])

  const updateTerm = useCallback(async (id: string, input: UpdateTermInput) => {
    const res = await taxonomyApi.updateTerm(id, input)
    setTerms((prev) => prev.map((t) => (t.id === id ? res.data : t)))
    return res.data
  }, [])

  const deleteTerm = useCallback(async (id: string) => {
    await taxonomyApi.deleteTerm(id)
    setTerms((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    schemes,
    terms,
    loading,
    error,
    refreshSchemes,
    refreshTerms,
    createScheme,
    updateScheme,
    createTerm,
    updateTerm,
    deleteTerm,
  }
}
