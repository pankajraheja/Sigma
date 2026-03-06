// ---------------------------------------------------------------------------
// Domain types for the configurable metadata taxonomy (4-table schema)
//
//   metadata.taxonomy_schemes   → TaxScheme
//   metadata.taxonomy_buckets   → TaxBucket
//   metadata.taxonomy_terms     → TaxTerm
//   metadata.taxonomy_aliases   → TaxAlias
// ---------------------------------------------------------------------------

// ── Row types (mirror Postgres) ─────────────────────────────────────────────

export interface TaxScheme {
  id: string;
  scheme_key: string;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxBucket {
  id: string;
  scheme_id: string;
  bucket_key: string;
  label: string;
  description: string | null;
  is_multi_select: boolean;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxTerm {
  id: string;
  bucket_id: string;
  term_key: string;
  label: string;
  description: string | null;
  parent_term_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxAlias {
  id: string;
  term_id: string;
  alias_label: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

// ── Nested / tree response shapes ───────────────────────────────────────────

/** A term with its children (recursive) and aliases. */
export interface TaxTermNode extends TaxTerm {
  aliases: TaxAlias[];
  children: TaxTermNode[];
}

/** A bucket with its nested term tree. */
export interface TaxBucketWithTerms extends TaxBucket {
  terms: TaxTermNode[];
}

/** Full scheme payload — scheme + buckets + nested term trees. */
export interface TaxSchemeDetail extends TaxScheme {
  buckets: TaxBucketWithTerms[];
}

/** Flat search-result row (term + bucket label + scheme key + matching alias). */
export interface TaxTermSearchHit {
  term_id: string;
  term_key: string;
  term_label: string;
  term_description: string | null;
  bucket_id: string;
  bucket_key: string;
  bucket_label: string;
  scheme_id: string;
  scheme_key: string;
  scheme_label: string;
  matched_alias: string | null;    // null when the match was on term.label
  parent_term_id: string | null;
  is_active: boolean;
  sort_order: number;
}
