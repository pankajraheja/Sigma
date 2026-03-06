// ---------------------------------------------------------------------------
// Discovery Repository — full-text search and similarity scoring for catalog.assets
//
// Search: PostgreSQL tsvector (GENERATED ALWAYS column `search_vector`), GIN-indexed.
//   Weighted: name (A) > short_summary (B) > description (C)
//   Ranked by ts_rank() DESC; restricted to ga/preview by default.
//
// Similar assets: heuristic multi-signal scoring using shared taxonomy
//   classifications, shared tags, same domain, same asset_kind, same org
//   dimensions. Ordered by total signal score DESC.
//
// ---------------------------------------------------------------------------
// TODO (Phase 2 — Semantic Similarity):
// When pgvector embeddings are available:
//   1. CREATE EXTENSION IF NOT EXISTS vector;
//   2. ALTER TABLE catalog.assets ADD COLUMN embedding vector(1536);
//   3. Backfill via background pipeline (POST /internal/embeddings/generate)
//   4. Replace `findSimilar` heuristic query with:
//        ORDER BY a.embedding <=> ref_embedding LIMIT $limit
//      where `ref_embedding` is fetched by asset ID.
//   5. Replace `search` tsquery with:
//        ORDER BY a.embedding <=> query_embedding LIMIT $limit
//      where `query_embedding` is generated at query time by the embedding provider.
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';
import type { SearchQuery } from '../models/api.types.js';
import { parsePagination, buildMeta } from '../models/api.types.js';
import type { CatalogAsset, SimilarAsset } from '../models/catalog.types.js';

export interface SearchPage {
  assets: CatalogAsset[];
  total: number;
  page: number;
  pageSize: number;
}

export const discoveryRepository = {
  // -------------------------------------------------------------------------
  // Full-text search using the tsvector GENERATED ALWAYS column.
  // Defaults to discoverable assets (ga/preview) unless publication_status
  // is explicitly provided.
  // -------------------------------------------------------------------------
  async search(rawQuery: Partial<SearchQuery> & { q?: string }): Promise<SearchPage> {
    const { q, publication_status, asset_kind, compliance_tag, domain } = rawQuery as {
      q?: string;
      publication_status?: string;
      asset_kind?: string;
      compliance_tag?: string;
      domain?: string;
    };
    const { page, pageSize } = parsePagination(rawQuery);

    if (!q || q.trim().length === 0) {
      return { assets: [], total: 0, page, pageSize };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Full-text search using the tsvector generated column
    conditions.push(`a.search_vector @@ plainto_tsquery('english', $${idx++})`);
    params.push(q.trim());

    if (publication_status) {
      conditions.push(`a.publication_status = $${idx++}`);
      params.push(publication_status);
    } else {
      conditions.push(`a.publication_status IN ('ga', 'preview')`);
    }

    if (asset_kind) {
      conditions.push(`a.asset_kind = $${idx++}`);
      params.push(asset_kind);
    }
    if (compliance_tag) {
      conditions.push(`$${idx++} = ANY(a.compliance_tags)`);
      params.push(compliance_tag);
    }
    if (domain) {
      conditions.push(`a.domain = $${idx++}`);
      params.push(domain);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

    // ts_rank gives relevance score; $1 is the query text (already in params at idx=1)
    const sql = `
      SELECT a.*,
             ts_rank(a.search_vector, plainto_tsquery('english', $1)) AS rank
      FROM catalog.assets a
      ${where}
      ORDER BY rank DESC, a.updated_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(pageSize, offset);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM catalog.assets a
      ${where}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query<CatalogAsset>(sql, params),
      db.query<{ total: number }>(countSql, params.slice(0, -2)),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    return { assets: dataResult.rows, total, page, pageSize };
  },

  // -------------------------------------------------------------------------
  // findFiltered — structured column-filter search (no full-text query).
  //
  // Used by Sigma Chat structured retrieval and fallback when the user's
  // intent maps to specific field filters rather than keyword search, or
  // when we need a "get latest assets" query without a text term.
  // -------------------------------------------------------------------------
  async findFiltered(rawQuery: {
    asset_kind?: string;
    domain?: string;
    publication_status?: string;
    compliance_tag?: string;
    data_residency?: string;
    contains_pii?: string;
    pageSize?: number;
  }): Promise<SearchPage> {
    const pageSize = rawQuery.pageSize ?? 10;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Default: only discoverable assets
    if (rawQuery.publication_status) {
      conditions.push(`a.publication_status = $${idx++}`);
      params.push(rawQuery.publication_status);
    } else {
      conditions.push(`a.publication_status IN ('ga', 'preview')`);
    }

    if (rawQuery.asset_kind) {
      conditions.push(`a.asset_kind = $${idx++}`);
      params.push(rawQuery.asset_kind);
    }
    if (rawQuery.domain) {
      conditions.push(`a.domain = $${idx++}`);
      params.push(rawQuery.domain);
    }
    if (rawQuery.compliance_tag) {
      conditions.push(`$${idx++} = ANY(a.compliance_tags)`);
      params.push(rawQuery.compliance_tag);
    }
    if (rawQuery.data_residency) {
      conditions.push(`a.data_residency = $${idx++}`);
      params.push(rawQuery.data_residency);
    }
    if (rawQuery.contains_pii === 'true' || rawQuery.contains_pii === 'yes') {
      conditions.push(`a.contains_pii = true`);
    } else if (rawQuery.contains_pii === 'false' || rawQuery.contains_pii === 'no') {
      conditions.push(`a.contains_pii = false`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT a.*
      FROM catalog.assets a
      ${where}
      ORDER BY a.updated_at DESC
      LIMIT $${idx++}
    `;
    params.push(pageSize);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM catalog.assets a
      ${where}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query<CatalogAsset>(sql, params),
      db.query<{ total: number }>(countSql, params.slice(0, -1)),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    return { assets: dataResult.rows, total, page: 1, pageSize };
  },

  // -------------------------------------------------------------------------
  // Heuristic similarity scoring for "Similar Assets".
  //
  // Signal weights (higher = stronger relevance signal):
  //   +3  Same domain
  //   +2  Same asset_kind
  //   +2  Each shared taxonomy classification (catalog.asset_classifications)
  //   +1  Same opco
  //   +1  Same function_group
  //   +1  Each shared informal tag (catalog.asset_tags)
  //
  // Only discoverable assets (ga/preview) are returned. The source asset
  // is excluded from results.
  //
  // TODO (Phase 2 — pgvector):
  // Replace this CTE with: ORDER BY a.embedding <=> ref.embedding
  // after the embedding pipeline is wired and backfilled.
  // -------------------------------------------------------------------------
  async findSimilar(assetId: string, limit: number): Promise<SimilarAsset[]> {
    const sql = `
      WITH reference AS (
        SELECT asset_kind, domain, opco_id, function_group_id, compliance_tags
        FROM catalog.assets
        WHERE id = $1
      ),
      scores AS (
        -- Same domain: strong topical signal (+3)
        SELECT a.id, 3 AS score
        FROM catalog.assets a, reference r
        WHERE a.domain IS NOT NULL
          AND a.domain = r.domain
          AND a.id != $1
          AND a.publication_status IN ('ga', 'preview')

        UNION ALL

        -- Same asset_kind: structural similarity (+2)
        SELECT a.id, 2 AS score
        FROM catalog.assets a, reference r
        WHERE a.asset_kind = r.asset_kind
          AND a.id != $1
          AND a.publication_status IN ('ga', 'preview')

        UNION ALL

        -- Shared taxonomy classifications: governance/domain alignment (+2 each)
        SELECT ac2.asset_id AS id, 2 AS score
        FROM catalog.asset_classifications ac1
        JOIN catalog.asset_classifications ac2
          ON ac1.term_id = ac2.term_id
         AND ac2.asset_id != ac1.asset_id
        JOIN catalog.assets a
          ON a.id = ac2.asset_id
         AND a.publication_status IN ('ga', 'preview')
        WHERE ac1.asset_id = $1

        UNION ALL

        -- Same opco: organisational alignment (+1)
        SELECT a.id, 1 AS score
        FROM catalog.assets a, reference r
        WHERE r.opco_id IS NOT NULL
          AND a.opco_id = r.opco_id
          AND a.id != $1
          AND a.publication_status IN ('ga', 'preview')

        UNION ALL

        -- Same function_group: team/function alignment (+1)
        SELECT a.id, 1 AS score
        FROM catalog.assets a, reference r
        WHERE r.function_group_id IS NOT NULL
          AND a.function_group_id = r.function_group_id
          AND a.id != $1
          AND a.publication_status IN ('ga', 'preview')

        UNION ALL

        -- Shared informal tags: user-contributed topical overlap (+1 each)
        SELECT at2.asset_id AS id, 1 AS score
        FROM catalog.asset_tags at1
        JOIN catalog.asset_tags at2
          ON at1.tag_id = at2.tag_id
         AND at2.asset_id != at1.asset_id
        JOIN catalog.assets a
          ON a.id = at2.asset_id
         AND a.publication_status IN ('ga', 'preview')
        WHERE at1.asset_id = $1
      )
      SELECT a.*, SUM(s.score)::int AS similarity_score
      FROM scores s
      JOIN catalog.assets a ON a.id = s.id
      GROUP BY a.id
      ORDER BY similarity_score DESC, a.usage_count DESC
      LIMIT $2
    `;

    const result = await db.query<SimilarAsset>(sql, [assetId, limit]);
    return result.rows;
  },
};
