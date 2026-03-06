// ---------------------------------------------------------------------------
// Metadata-Taxonomy Repository
//
// SQL queries against the 4-table configurable taxonomy schema:
//   metadata.taxonomy_schemes  →  taxonomy_buckets  →  taxonomy_terms
//                                                      taxonomy_aliases
//
// All queries are parameterized. Read-only.
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';
import type {
  TaxScheme,
  TaxBucket,
  TaxTerm,
  TaxAlias,
  TaxTermSearchHit,
} from '../models/metadata-taxonomy.types.js';

export const metadataTaxonomyRepository = {

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEMES
  // ═══════════════════════════════════════════════════════════════════════════

  /** All active schemes ordered by sort_order. */
  async findAllSchemes(): Promise<TaxScheme[]> {
    const sql = `
      SELECT *
        FROM metadata.taxonomy_schemes
       WHERE is_active = true
       ORDER BY sort_order ASC, label ASC
    `;
    const result = await db.query<TaxScheme>(sql);
    return result.rows;
  },

  /** Single scheme by key. */
  async findSchemeByKey(schemeKey: string): Promise<TaxScheme | null> {
    const sql = `
      SELECT *
        FROM metadata.taxonomy_schemes
       WHERE scheme_key = $1
    `;
    const result = await db.query<TaxScheme>(sql, [schemeKey]);
    return result.rows[0] ?? null;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUCKETS
  // ═══════════════════════════════════════════════════════════════════════════

  /** All active buckets for a scheme (by scheme ID). */
  async findBucketsBySchemeId(schemeId: string): Promise<TaxBucket[]> {
    const sql = `
      SELECT *
        FROM metadata.taxonomy_buckets
       WHERE scheme_id = $1
         AND is_active = true
       ORDER BY sort_order ASC, label ASC
    `;
    const result = await db.query<TaxBucket>(sql, [schemeId]);
    return result.rows;
  },

  /** Single bucket by (schemeId, bucketKey). */
  async findBucketByKey(schemeId: string, bucketKey: string): Promise<TaxBucket | null> {
    const sql = `
      SELECT *
        FROM metadata.taxonomy_buckets
       WHERE scheme_id = $1
         AND bucket_key = $2
    `;
    const result = await db.query<TaxBucket>(sql, [schemeId, bucketKey]);
    return result.rows[0] ?? null;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TERMS
  // ═══════════════════════════════════════════════════════════════════════════

  /** All active terms for a bucket. */
  async findTermsByBucketId(bucketId: string): Promise<TaxTerm[]> {
    const sql = `
      SELECT *
        FROM metadata.taxonomy_terms
       WHERE bucket_id = $1
         AND is_active = true
       ORDER BY sort_order ASC, label ASC
    `;
    const result = await db.query<TaxTerm>(sql, [bucketId]);
    return result.rows;
  },

  /** All active terms for multiple bucket IDs (batch). */
  async findTermsByBucketIds(bucketIds: string[]): Promise<TaxTerm[]> {
    if (bucketIds.length === 0) return [];
    const sql = `
      SELECT *
        FROM metadata.taxonomy_terms
       WHERE bucket_id = ANY($1::uuid[])
         AND is_active = true
       ORDER BY bucket_id ASC, sort_order ASC, label ASC
    `;
    const result = await db.query<TaxTerm>(sql, [bucketIds]);
    return result.rows;
  },

  /** Single term by ID. */
  async findTermById(termId: string): Promise<TaxTerm | null> {
    const sql = `SELECT * FROM metadata.taxonomy_terms WHERE id = $1`;
    const result = await db.query<TaxTerm>(sql, [termId]);
    return result.rows[0] ?? null;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ALIASES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Aliases for a set of term IDs (batch). */
  async findAliasesByTermIds(termIds: string[]): Promise<TaxAlias[]> {
    if (termIds.length === 0) return [];
    const sql = `
      SELECT *
        FROM metadata.taxonomy_aliases
       WHERE term_id = ANY($1::uuid[])
       ORDER BY term_id ASC, alias_label ASC
    `;
    const result = await db.query<TaxAlias>(sql, [termIds]);
    return result.rows;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH — label + alias (uses GIN trigram indexes)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Free-text search across term labels and aliases.
   * Returns flat rows with context (bucket + scheme info, matched alias).
   * Uses ILIKE backed by GIN trigram indexes for performance.
   */
  async searchTerms(
    query: string,
    opts: { limit?: number; schemeKey?: string; bucketKey?: string } = {},
  ): Promise<TaxTermSearchHit[]> {
    const { limit = 50, schemeKey, bucketKey } = opts;
    const pattern = `%${query.replace(/[%_]/g, '\\$&')}%`;

    const conditions: string[] = ['t.is_active = true'];
    const params: unknown[] = [pattern];
    let idx = 2;

    if (schemeKey) {
      conditions.push(`s.scheme_key = $${idx++}`);
      params.push(schemeKey);
    }
    if (bucketKey) {
      conditions.push(`b.bucket_key = $${idx++}`);
      params.push(bucketKey);
    }

    params.push(limit);

    const where = conditions.join(' AND ');

    // UNION of label matches and alias matches, deduplicated by term_id,
    // preferring the alias match (so matched_alias is populated).
    const sql = `
      WITH label_hits AS (
        SELECT
          t.id            AS term_id,
          t.term_key,
          t.label         AS term_label,
          t.description   AS term_description,
          t.bucket_id,
          b.bucket_key,
          b.label         AS bucket_label,
          s.id            AS scheme_id,
          s.scheme_key,
          s.label         AS scheme_label,
          NULL::text       AS matched_alias,
          t.parent_term_id,
          t.is_active,
          t.sort_order
        FROM metadata.taxonomy_terms  t
        JOIN metadata.taxonomy_buckets b ON b.id = t.bucket_id
        JOIN metadata.taxonomy_schemes s ON s.id = b.scheme_id
       WHERE t.label ILIKE $1
         AND ${where}
      ),
      alias_hits AS (
        SELECT
          t.id            AS term_id,
          t.term_key,
          t.label         AS term_label,
          t.description   AS term_description,
          t.bucket_id,
          b.bucket_key,
          b.label         AS bucket_label,
          s.id            AS scheme_id,
          s.scheme_key,
          s.label         AS scheme_label,
          a.alias_label   AS matched_alias,
          t.parent_term_id,
          t.is_active,
          t.sort_order
        FROM metadata.taxonomy_aliases a
        JOIN metadata.taxonomy_terms   t ON t.id = a.term_id
        JOIN metadata.taxonomy_buckets b ON b.id = t.bucket_id
        JOIN metadata.taxonomy_schemes s ON s.id = b.scheme_id
       WHERE a.alias_label ILIKE $1
         AND ${where}
      ),
      combined AS (
        SELECT * FROM alias_hits
        UNION ALL
        SELECT * FROM label_hits
      )
      SELECT DISTINCT ON (term_id) *
        FROM combined
       ORDER BY term_id, matched_alias NULLS LAST
       LIMIT $${idx}
    `;

    const result = await db.query<TaxTermSearchHit>(sql, params);
    return result.rows;
  },
};
