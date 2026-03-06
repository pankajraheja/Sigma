// ---------------------------------------------------------------------------
// Shared taxonomy types — 4-table metadata taxonomy schema
//
//   metadata.taxonomy_schemes  → Scheme
//   metadata.taxonomy_buckets  → Bucket
//   metadata.taxonomy_terms    → Term
//   metadata.taxonomy_aliases  → Alias
// ---------------------------------------------------------------------------

// ── Row types (mirror Postgres columns) ─────────────────────────────────────

/** Top-level taxonomy scheme (e.g. "Consulting Firm Taxonomy"). */
export interface Scheme {
  id: string
  scheme_key: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/** A logical bucket within a scheme (e.g. "Service Lines", "Industries"). */
export interface Bucket {
  id: string
  scheme_id: string
  bucket_key: string
  label: string
  description: string | null
  is_multi_select: boolean
  is_required: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/** A selectable term within a bucket. Supports nesting via parent_term_id. */
export interface Term {
  id: string
  bucket_id: string
  term_key: string
  label: string
  description: string | null
  parent_term_id: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/** An alternative label / search alias for a term. */
export interface Alias {
  id: string
  term_id: string
  alias_label: string
  locale: string
  created_at: string
  updated_at: string
}

// ── Nested / tree response shapes ───────────────────────────────────────────

/** A term with its children (recursive) and aliases resolved. */
export interface TermNode extends Term {
  aliases: Alias[]
  children: TermNode[]
}

/** A bucket populated with its nested term tree. */
export interface BucketWithTerms extends Bucket {
  terms: TermNode[]
}

/** Full scheme detail — scheme + buckets + nested term trees. */
export interface SchemeDetail extends Scheme {
  buckets: BucketWithTerms[]
}

/** Flat search-result row (term + bucket + scheme context + matched alias). */
export interface TermSearchHit {
  term_id: string
  term_key: string
  term_label: string
  term_description: string | null
  bucket_id: string
  bucket_key: string
  bucket_label: string
  scheme_id: string
  scheme_key: string
  scheme_label: string
  matched_alias: string | null // null when the match was on term.label
  parent_term_id: string | null
  is_active: boolean
  sort_order: number
}

// ── API response envelopes ──────────────────────────────────────────────────

export interface SchemesResponse {
  data: Scheme[]
}

export interface SchemeDetailResponse {
  data: SchemeDetail
}

export interface BucketsResponse {
  data: Bucket[]
}

export interface TermsResponse {
  data: TermNode[]
}

export interface TermSearchResponse {
  data: TermSearchHit[]
}
