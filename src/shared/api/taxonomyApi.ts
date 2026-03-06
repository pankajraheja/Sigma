// ---------------------------------------------------------------------------
// Taxonomy API client — 4-table metadata taxonomy
//
// Talks to:  GET /api/metadata/taxonomy/...
// ---------------------------------------------------------------------------

import type {
  SchemesResponse,
  SchemeDetailResponse,
  BucketsResponse,
  TermsResponse,
  TermSearchResponse,
} from '../types/taxonomy'

const BASE =
  (import.meta.env['VITE_TAXONOMY_API_URL'] as string | undefined) ??
  'http://localhost:3002/api/metadata/taxonomy'

// ── Error class ─────────────────────────────────────────────────────────────

export class TaxonomyApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'TaxonomyApiError'
    this.status = status
  }
}

// ── Internal fetch helper ───────────────────────────────────────────────────

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
    throw new TaxonomyApiError(body.message ?? res.statusText, res.status)
  }

  return res.json() as Promise<T>
}

// ── Exported API ────────────────────────────────────────────────────────────

export const taxonomyApi = {
  /** List all taxonomy schemes. */
  listSchemes(): Promise<SchemesResponse> {
    return get('/schemes')
  },

  /** Get a full scheme detail (scheme + buckets + nested term trees). */
  getScheme(schemeKey: string): Promise<SchemeDetailResponse> {
    return get(`/schemes/${encodeURIComponent(schemeKey)}`)
  },

  /** List buckets for a given scheme. */
  getBuckets(schemeKey: string): Promise<BucketsResponse> {
    return get(`/schemes/${encodeURIComponent(schemeKey)}/buckets`)
  },

  /** Get the term tree for a specific bucket within a scheme. */
  getTerms(schemeKey: string, bucketKey: string): Promise<TermsResponse> {
    return get(
      `/schemes/${encodeURIComponent(schemeKey)}/buckets/${encodeURIComponent(bucketKey)}/terms`,
    )
  },

  /** Full-text search across terms (and aliases). */
  searchTerms(
    q: string,
    opts?: { scheme?: string; bucket?: string; limit?: number },
  ): Promise<TermSearchResponse> {
    return get('/terms/search', {
      q,
      scheme: opts?.scheme,
      bucket: opts?.bucket,
      limit: opts?.limit,
    } as Record<string, string | number | undefined>)
  },
}
