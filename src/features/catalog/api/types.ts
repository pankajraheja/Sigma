// ---------------------------------------------------------------------------
// Catalog API — backend response types (snake_case, mirrors PostgreSQL schema)
// ---------------------------------------------------------------------------

export type BackendPublicationStatus = 'preview' | 'ga' | 'deprecated' | 'retired'

export interface BackendAsset {
  id: string
  name: string
  short_summary: string | null
  description: string | null
  asset_kind: string
  publication_status: BackendPublicationStatus
  published_at: string | null
  deprecated_at: string | null
  retired_at: string | null

  source_module_id: string
  source_entity_type: string
  source_entity_id: string

  owner_id: string

  primary_country_id: string | null
  opco_id: string | null
  function_group_id: string | null
  industry_sector_id: string | null
  service_offering_id: string | null

  data_classification: string | null
  hosting_type: string | null
  audience_type: string | null
  business_criticality: string | null
  data_residency: string | null
  contains_pii: boolean
  is_client_facing: boolean
  retention_requirement: string | null
  sla_description: string | null
  compliance_tags: string[]

  domain: string | null
  approved_submission_id: string | null
  usage_count: number
  featured: boolean

  created_at: string
  updated_at: string
}

export interface BackendSourceRef {
  id: string
  asset_id: string
  ref_type: 'forge_asset_id' | 'github_repo' | 'dbt_model' | 'confluence_page' | 'jira_project' | 'other'
  ref_value: string
  label: string | null
  href: string | null
  is_primary: boolean
  added_by: string | null
  added_at: string
}

export interface BackendAssetVersion {
  id: string
  asset_id: string
  version: string
  is_current: boolean
  change_summary: string | null
  released_at: string | null
  released_by: string | null
  submission_id: string | null
}

export interface ApiAssetListResponse {
  items: BackendAsset[]
  page: number
  pageSize: number
  total: number
}

export interface ApiAssetDetailResponse {
  asset: BackendAsset
  sourceRef: BackendSourceRef | null
}

export interface ApiHealthResponse {
  status: 'ok' | 'degraded' | 'down'
  version: string
  timestamp: string
  checks: Array<{
    service: string
    status: 'ok' | 'degraded' | 'down'
    latencyMs: number | null
    error?: string
  }>
}

// GET /api/catalog/taxonomy  — a single taxonomy term
export interface BackendTaxonomyTerm {
  id: string
  scheme_code: string
  code: string
  label: string
  is_active: boolean
}

// GET /api/catalog/taxonomy  — response envelope
export interface ApiTaxonomyResponse {
  data: BackendTaxonomyTerm[]
}

// GET /api/catalog/tags  — a single tag
export interface BackendTag {
  id: string
  label: string
  created_at: string
}

// GET /api/catalog/tags  — response envelope
export interface ApiTagsResponse {
  data: BackendTag[]
}

// GET /api/catalog/assets/:id/classifications  — a classification with joined term fields
export interface BackendAssetClassification {
  id: string
  asset_id: string
  term_id: string
  scheme_code: string
  classified_by: string
  classified_at: string
  term_label: string
  term_code: string
}

// GET /api/catalog/assets/:id/classifications  — response envelope
export interface ApiAssetClassificationsResponse {
  data: BackendAssetClassification[]
}

// GET /api/catalog/assets/:id/tags  — an asset tag with joined label
export interface BackendAssetTag {
  asset_id: string
  tag_id: string
  tagged_by: string
  tagged_at: string
  tag_label: string
}

// GET /api/catalog/assets/:id/tags  — response envelope
export interface ApiAssetTagsResponse {
  data: BackendAssetTag[]
}

// GET /api/catalog/search — query params
export interface SearchParams {
  q: string
  publication_status?: BackendPublicationStatus
  asset_kind?: string
  compliance_tag?: string
  domain?: string
  page?: number
  pageSize?: number
}

// GET /api/catalog/search — response
export interface ApiSearchResponse {
  data: BackendAsset[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// GET /api/catalog/assets/:id/similar — a single similar asset with score
export interface BackendSimilarAsset extends BackendAsset {
  // Heuristic similarity score (higher = more signals in common).
  // TODO (Phase 2): replaced by pgvector cosine distance when embeddings exist.
  similarity_score: number
}

// GET /api/catalog/assets/:id/similar — response
export interface ApiSimilarAssetsResponse {
  data: BackendSimilarAsset[]
  assetId: string
}

// Query params for GET /api/catalog/assets
export interface CatalogListParams {
  publication_status?: BackendPublicationStatus
  asset_kind?: string
  compliance_tag?: string
  domain?: string
  primary_country_id?: string
  opco_id?: string
  function_group_id?: string
  industry_sector_id?: string
  service_offering_id?: string
  page?: number
  pageSize?: number
  sort?: 'name' | 'published_at' | 'updated_at'
  order?: 'asc' | 'desc'
}

// GET /api/catalog/assets/:id/summary — AI-generated asset summary
export interface ApiAssetAiSummaryResponse {
  assetId: string
  businessSummary: string
  technicalSummary: string
  reuseGuidance: string
  keyRisks: string[]
  generatedAt: string
  provider: 'openai' | 'stub'
  model: string
}

// GET /api/catalog/assets/:id/recommendations — AI-recommended similar assets
export interface ApiAssetRecommendation {
  asset: BackendSimilarAsset
  reason: string
  similarityScore: number
}

export interface ApiAssetRecommendationsResponse {
  data: ApiAssetRecommendation[]
  assetId: string
  generatedAt: string
  provider: 'openai' | 'stub'
}

// GET /api/catalog/assets/:id/enrichment-suggestions — AI enrichment suggestions
export interface ApiEnrichmentSuggestion<T> {
  value: T
  confidence: 'high' | 'medium' | 'low'
  rationale: string
}

export interface ApiAssetEnrichmentSuggestionsResponse {
  assetId: string
  suggestedTags: ApiEnrichmentSuggestion<string>[]
  suggestedClassifications: ApiEnrichmentSuggestion<{
    scheme_code: string
    code: string
    label: string
  }>[]
  nfrClarifications: ApiEnrichmentSuggestion<{
    field: string
    currentValue: string | null
    suggestedValue: string
  }>[]
  generatedAt: string
  provider: 'openai' | 'stub'
}

// Query params for GET /api/catalog/taxonomy
export interface TaxonomyParams {
  scheme?: string
  include_inactive?: boolean
}

// Query params for GET /api/catalog/tags
export interface TagSearchParams {
  q?: string
  page?: number
  pageSize?: number
}
