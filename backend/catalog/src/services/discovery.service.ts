// ---------------------------------------------------------------------------
// Discovery Service — full-text search across catalog.assets
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';
import type { SearchQuery } from '../models/api.types.js';
import { parsePagination, buildMeta } from '../models/api.types.js';
import type { CatalogAsset } from '../models/catalog.types.js';

export interface SearchResponse {
  data: CatalogAsset[];
  meta: ReturnType<typeof buildMeta>;
}

export const discoveryService = {
  // -------------------------------------------------------------------------
  // Full-text search using tsvector column on catalog.assets
  //
  // SQL pattern:
  //   WHERE search_vector @@ plainto_tsquery('english', $query)
  //   ORDER BY ts_rank(search_vector, plainto_tsquery(...)) DESC
  // -------------------------------------------------------------------------
  async search(rawQuery: Partial<SearchQuery> & { q?: string }): Promise<SearchResponse> {
    const { q, publication_status, asset_kind, compliance_tag } = rawQuery;
    const { page, pageSize } = parsePagination(rawQuery);

    if (!q || q.trim().length === 0) {
      return { data: [], meta: buildMeta(page, pageSize, 0) };
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

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

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

    // TODO: Execute against real DB when adapter is swapped
    const [dataResult, countResult] = await Promise.all([
      db.query<CatalogAsset>(sql, params),
      db.query<{ total: number }>(countSql, params.slice(0, -2)),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    return {
      data: dataResult.rows,
      meta: buildMeta(page, pageSize, total),
    };
  },
};
