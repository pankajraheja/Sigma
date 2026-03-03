// ---------------------------------------------------------------------------
// API request/response types for the Catalog backend
// ---------------------------------------------------------------------------

import type { PublicationStatus, CatalogAsset, AssetSourceRef, SimilarAsset } from './catalog.types.js';

// ---------------------------------------------------------------------------
// Concrete response shapes for the 3 wired endpoints
// ---------------------------------------------------------------------------

// GET /api/catalog/assets
export interface AssetListResponse {
  items: CatalogAsset[];
  page: number;
  pageSize: number;
  total: number;
}

// GET /api/catalog/assets/:id
export interface AssetDetailResponse {
  asset: CatalogAsset;
  sourceRef: AssetSourceRef | null; // primary source ref; null if none exists
}

// ---------------------------------------------------------------------------
// Generic envelope (kept for non-asset endpoints)
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// GET /api/catalog/assets  — query params
// ---------------------------------------------------------------------------

export interface AssetListQuery {
  publication_status?: PublicationStatus;
  asset_kind?: string;
  compliance_tag?: string;
  domain?: string;
  primary_country_id?: string;
  opco_id?: string;
  function_group_id?: string;
  industry_sector_id?: string;
  service_offering_id?: string;
  page?: number;
  pageSize?: number;
  sort?: 'name' | 'published_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// GET /api/catalog/search  — query params and response
// ---------------------------------------------------------------------------

export interface SearchQuery {
  q: string;
  publication_status?: PublicationStatus;
  asset_kind?: string;
  compliance_tag?: string;
  domain?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  data: CatalogAsset[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// GET /api/catalog/assets/:id/similar  — response
// ---------------------------------------------------------------------------

export interface SimilarAssetsResponse {
  data: SimilarAsset[];
  assetId: string;
}

// ---------------------------------------------------------------------------
// GET /api/catalog/tags  — query params
// ---------------------------------------------------------------------------

export interface TagListQuery {
  q?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// GET /api/catalog/taxonomy  — query params
// ---------------------------------------------------------------------------

export interface TaxonomyQuery {
  scheme?: string;
  include_inactive?: boolean;
}

// ---------------------------------------------------------------------------
// Health response
// ---------------------------------------------------------------------------

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface HealthCheck {
  service: string;
  status: HealthStatus;
  latencyMs: number | null;
  error?: string;
}

export interface HealthResponse {
  status: HealthStatus;
  version: string;
  timestamp: string;
  checks: HealthCheck[];
}

// ---------------------------------------------------------------------------
// GET /api/catalog/assets/:id/summary  — AI summary
// ---------------------------------------------------------------------------

export interface AssetAiSummaryResponse {
  assetId: string;
  businessSummary: string;
  technicalSummary: string;
  reuseGuidance: string;
  keyRisks: string[];
  generatedAt: string;
  provider: 'openai' | 'stub';
  model: string;
}

// ---------------------------------------------------------------------------
// GET /api/catalog/assets/:id/recommendations  — AI recommendations
// ---------------------------------------------------------------------------

export interface AssetRecommendation {
  asset: CatalogAsset;
  reason: string;
  similarityScore: number;
}

export interface AssetRecommendationsResponse {
  data: AssetRecommendation[];
  assetId: string;
  generatedAt: string;
  provider: 'openai' | 'stub';
}

// ---------------------------------------------------------------------------
// GET /api/catalog/assets/:id/enrichment-suggestions  — AI enrichment
// ---------------------------------------------------------------------------

export interface EnrichmentSuggestion<T> {
  value: T;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface AssetEnrichmentSuggestionsResponse {
  assetId: string;
  suggestedTags: EnrichmentSuggestion<string>[];
  suggestedClassifications: EnrichmentSuggestion<{
    scheme_code: string;
    code: string;
    label: string;
  }>[];
  nfrClarifications: EnrichmentSuggestion<{
    field: string;
    currentValue: string | null;
    suggestedValue: string;
  }>[];
  generatedAt: string;
  provider: 'openai' | 'stub';
}

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

export function parsePagination(query: {
  page?: unknown;
  pageSize?: unknown;
}): { page: number; pageSize: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { page, pageSize };
}

export function buildMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
