// ---------------------------------------------------------------------------
// Catalog API client — thin fetch wrapper around the catalog backend
// Base URL: VITE_CATALOG_API_URL env var (defaults to localhost:3001/api/catalog)
// ---------------------------------------------------------------------------

import type {
  ApiAssetListResponse,
  ApiAssetDetailResponse,
  ApiAssetClassificationsResponse,
  ApiAssetTagsResponse,
  ApiHealthResponse,
  ApiSearchResponse,
  ApiSimilarAssetsResponse,
  ApiTaxonomyResponse,
  ApiTagsResponse,
  ApiAssetAiSummaryResponse,
  ApiAssetRecommendationsResponse,
  ApiAssetEnrichmentSuggestionsResponse,
  BackendAssetVersion,
  BackendSourceRef,
  CatalogListParams,
  SearchParams,
  TaxonomyParams,
  TagSearchParams,
} from './types'

const BASE =
  (import.meta.env['VITE_CATALOG_API_URL'] as string | undefined) ??
  'http://localhost:3001/api/catalog'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new ApiError(body.message ?? res.statusText, res.status)
  }
  return res.json() as Promise<T>
}

export const catalogApi = {
  health: () =>
    get<ApiHealthResponse>('/health'),

  listAssets: (params: CatalogListParams = {}) =>
    get<ApiAssetListResponse>('/assets', params as Record<string, string | number | undefined>),

  getAsset: (id: string) =>
    get<ApiAssetDetailResponse>(`/assets/${encodeURIComponent(id)}`),

  getVersions: (id: string) =>
    get<{ data: BackendAssetVersion[] }>(`/assets/${encodeURIComponent(id)}/versions`),

  getSourceRefs: (id: string) =>
    get<{ data: BackendSourceRef[] }>(`/assets/${encodeURIComponent(id)}/source-refs`),

  getClassifications: (id: string) =>
    get<ApiAssetClassificationsResponse>(`/assets/${encodeURIComponent(id)}/classifications`),

  getAssetTags: (id: string) =>
    get<ApiAssetTagsResponse>(`/assets/${encodeURIComponent(id)}/tags`),

  getTaxonomy: (params: TaxonomyParams = {}) =>
    get<ApiTaxonomyResponse>('/taxonomy', params as Record<string, string | undefined>),

  getTags: (params: TagSearchParams = {}) =>
    get<ApiTagsResponse>('/tags', params as Record<string, string | number | undefined>),

  searchAssets: (params: SearchParams) =>
    get<ApiSearchResponse>('/search', params as Record<string, string | number | undefined>),

  getSimilarAssets: (id: string, limit = 5) =>
    get<ApiSimilarAssetsResponse>(
      `/assets/${encodeURIComponent(id)}/similar`,
      { limit },
    ),

  getAssetSummary: (id: string) =>
    get<ApiAssetAiSummaryResponse>(`/assets/${encodeURIComponent(id)}/summary`),

  getAssetRecommendations: (id: string, limit = 5) =>
    get<ApiAssetRecommendationsResponse>(
      `/assets/${encodeURIComponent(id)}/recommendations`,
      { limit },
    ),

  getEnrichmentSuggestions: (id: string) =>
    get<ApiAssetEnrichmentSuggestionsResponse>(
      `/assets/${encodeURIComponent(id)}/enrichment-suggestions`,
    ),
}
