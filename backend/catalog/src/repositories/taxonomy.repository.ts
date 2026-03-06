// ---------------------------------------------------------------------------
// Taxonomy Repository — metadata.taxonomy_terms, metadata.tags, metadata.concept_schemes
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';
import type { TaxonomyTerm, Tag, ConceptScheme } from '../models/catalog.types.js';
import type { TagListQuery, TaxonomyQuery } from '../models/api.types.js';

export interface TagPage {
  tags: Tag[];
  total: number;
}

export interface TermPage {
  terms: TaxonomyTerm[];
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
      ORDER BY t.scheme_code ASC, t.sort_order ASC, t.label ASC
    `;
    const result = await db.query<TaxonomyTerm>(sql, params);
    return result.rows;
  },

  // -------------------------------------------------------------------------
  // Get a single term by ID
  // -------------------------------------------------------------------------
  async findTermById(id: string): Promise<TaxonomyTerm | null> {
    const sql = `SELECT t.* FROM metadata.taxonomy_terms t WHERE t.id = $1`;
    const result = await db.query<TaxonomyTerm>(sql, [id]);
    return result.rows[0] ?? null;
  },

  // -------------------------------------------------------------------------
  // Create a taxonomy term
  // -------------------------------------------------------------------------
  async createTerm(term: {
    scheme_code: string;
    scheme_id?: string;
    code: string;
    label: string;
    description?: string;
    parent_term_id?: string;
    sort_order?: number;
  }): Promise<TaxonomyTerm> {
    const sql = `
      INSERT INTO metadata.taxonomy_terms
        (scheme_code, scheme_id, code, label, description, parent_term_id, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query<TaxonomyTerm>(sql, [
      term.scheme_code,
      term.scheme_id ?? null,
      term.code,
      term.label,
      term.description ?? null,
      term.parent_term_id ?? null,
      term.sort_order ?? 0,
    ]);
    return result.rows[0];
  },

  // -------------------------------------------------------------------------
  // Update a taxonomy term
  // -------------------------------------------------------------------------
  async updateTerm(
    id: string,
    updates: Partial<{
      label: string;
      description: string | null;
      parent_term_id: string | null;
      sort_order: number;
      is_active: boolean;
    }>,
  ): Promise<TaxonomyTerm | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (updates.label !== undefined)          { sets.push(`label = $${idx++}`);          params.push(updates.label); }
    if (updates.description !== undefined)    { sets.push(`description = $${idx++}`);    params.push(updates.description); }
    if (updates.parent_term_id !== undefined) { sets.push(`parent_term_id = $${idx++}`); params.push(updates.parent_term_id); }
    if (updates.sort_order !== undefined)     { sets.push(`sort_order = $${idx++}`);     params.push(updates.sort_order); }
    if (updates.is_active !== undefined)      { sets.push(`is_active = $${idx++}`);      params.push(updates.is_active); }

    if (sets.length === 0) return this.findTermById(id);

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `
      UPDATE metadata.taxonomy_terms
      SET ${sets.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const result = await db.query<TaxonomyTerm>(sql, params);
    return result.rows[0] ?? null;
  },

  // -------------------------------------------------------------------------
  // Delete a taxonomy term (hard delete — use deactivate for soft)
  // -------------------------------------------------------------------------
  async deleteTerm(id: string): Promise<boolean> {
    const sql = `DELETE FROM metadata.taxonomy_terms WHERE id = $1`;
    const result = await db.query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
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

  // -------------------------------------------------------------------------
  // List concept_schemes (full registry)
  // -------------------------------------------------------------------------
  async findConceptSchemes(): Promise<ConceptScheme[]> {
    const sql = `
      SELECT cs.*
      FROM metadata.concept_schemes cs
      ORDER BY cs.sort_order ASC, cs.label ASC
    `;
    const result = await db.query<ConceptScheme>(sql);
    return result.rows;
  },

  // -------------------------------------------------------------------------
  // Get a single concept scheme by code
  // -------------------------------------------------------------------------
  async findConceptSchemeByCode(code: string): Promise<ConceptScheme | null> {
    const sql = `SELECT cs.* FROM metadata.concept_schemes cs WHERE cs.code = $1`;
    const result = await db.query<ConceptScheme>(sql, [code]);
    return result.rows[0] ?? null;
  },

  // -------------------------------------------------------------------------
  // Create a concept scheme
  // -------------------------------------------------------------------------
  async createConceptScheme(scheme: {
    code: string;
    label: string;
    description?: string;
    is_hierarchical?: boolean;
    is_locked?: boolean;
    sort_order?: number;
  }): Promise<ConceptScheme> {
    const sql = `
      INSERT INTO metadata.concept_schemes
        (code, label, description, is_hierarchical, is_locked, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await db.query<ConceptScheme>(sql, [
      scheme.code,
      scheme.label,
      scheme.description ?? null,
      scheme.is_hierarchical ?? false,
      scheme.is_locked ?? false,
      scheme.sort_order ?? 0,
    ]);
    return result.rows[0];
  },

  // -------------------------------------------------------------------------
  // Update a concept scheme
  // -------------------------------------------------------------------------
  async updateConceptScheme(
    code: string,
    updates: Partial<{
      label: string;
      description: string | null;
      is_hierarchical: boolean;
      is_locked: boolean;
      sort_order: number;
    }>,
  ): Promise<ConceptScheme | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (updates.label !== undefined)          { sets.push(`label = $${idx++}`);          params.push(updates.label); }
    if (updates.description !== undefined)    { sets.push(`description = $${idx++}`);    params.push(updates.description); }
    if (updates.is_hierarchical !== undefined) { sets.push(`is_hierarchical = $${idx++}`); params.push(updates.is_hierarchical); }
    if (updates.is_locked !== undefined)      { sets.push(`is_locked = $${idx++}`);      params.push(updates.is_locked); }
    if (updates.sort_order !== undefined)     { sets.push(`sort_order = $${idx++}`);     params.push(updates.sort_order); }

    if (sets.length === 0) return this.findConceptSchemeByCode(code);

    params.push(code);

    const sql = `
      UPDATE metadata.concept_schemes
      SET ${sets.join(', ')}
      WHERE code = $${idx}
      RETURNING *
    `;
    const result = await db.query<ConceptScheme>(sql, params);
    return result.rows[0] ?? null;
  },

  // -------------------------------------------------------------------------
  // Insert an audit log entry
  // -------------------------------------------------------------------------
  async insertAuditLog(entry: {
    entity_type: 'concept_scheme' | 'taxonomy_term';
    entity_id: string;
    action: string;
    changed_by?: string;
    changes?: Record<string, unknown>;
  }): Promise<void> {
    const sql = `
      INSERT INTO metadata.taxonomy_audit_log
        (entity_type, entity_id, action, changed_by, changes)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(sql, [
      entry.entity_type,
      entry.entity_id,
      entry.action,
      entry.changed_by ?? null,
      entry.changes ? JSON.stringify(entry.changes) : null,
    ]);
  },
};
