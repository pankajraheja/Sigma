// ---------------------------------------------------------------------------
// Taxonomy Repository — metadata.taxonomy_terms and metadata.tags
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';
import type { TaxonomyTerm, Tag } from '../models/catalog.types.js';
import type { TagListQuery, TaxonomyQuery } from '../models/api.types.js';

export interface TagPage {
  tags: Tag[];
  total: number;
}

export const taxonomyRepository = {
  // -------------------------------------------------------------------------
  // List taxonomy terms — optionally filtered by scheme
  // -------------------------------------------------------------------------
  async findTerms(query: TaxonomyQuery): Promise<TaxonomyTerm[]> {
    const { scheme, include_inactive = false } = query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (scheme) {
      conditions.push(`t.scheme_code = $${idx++}`);
      params.push(scheme);
    }
    if (!include_inactive) {
      conditions.push(`t.is_active = true`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT t.*
      FROM metadata.taxonomy_terms t
      ${where}
      ORDER BY t.scheme_code ASC, t.label ASC
    `;
    const result = await db.query<TaxonomyTerm>(sql, params);
    return result.rows;
  },

  // -------------------------------------------------------------------------
  // List tags — optionally filtered by label prefix (trigram search)
  // -------------------------------------------------------------------------
  async findTags(query: TagListQuery): Promise<TagPage> {
    const { q, page = 1, pageSize = 50 } = query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (q && q.trim().length > 0) {
      // Uses the GIN trigram index on tags.label
      conditions.push(`t.label ILIKE $${idx++}`);
      params.push(`%${q.trim()}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const sql = `
      SELECT t.*
      FROM metadata.tags t
      ${where}
      ORDER BY t.label ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(pageSize, offset);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM metadata.tags t
      ${where}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query<Tag>(sql, params),
      db.query<{ total: number }>(countSql, params.slice(0, -2)),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    return { tags: dataResult.rows, total };
  },

  // -------------------------------------------------------------------------
  // List all distinct schemes in taxonomy_terms
  // -------------------------------------------------------------------------
  async findSchemes(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT t.scheme_code
      FROM metadata.taxonomy_terms t
      WHERE t.is_active = true
      ORDER BY t.scheme_code ASC
    `;
    const result = await db.query<{ scheme_code: string }>(sql);
    return result.rows.map((r) => r.scheme_code);
  },
};
