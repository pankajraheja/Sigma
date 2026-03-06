// ---------------------------------------------------------------------------
// Taxonomy Service — taxonomy terms, tags, and concept schemes
// ---------------------------------------------------------------------------

import { taxonomyRepository } from '../repositories/taxonomy.repository.js';
import type { TagListQuery, TaxonomyQuery } from '../models/api.types.js';
import { parsePagination, buildMeta } from '../models/api.types.js';
import type { TaxonomyTerm, Tag, ConceptScheme } from '../models/catalog.types.js';

export interface TagListResponse {
  data: Tag[];
  meta: ReturnType<typeof buildMeta>;
}

export const taxonomyService = {
  // -------------------------------------------------------------------------
  // List all taxonomy terms — supports ?scheme= and ?include_inactive=true
  // -------------------------------------------------------------------------
  async listTerms(query: TaxonomyQuery): Promise<{ data: TaxonomyTerm[] }> {
    const terms = await taxonomyRepository.findTerms(query);
    return { data: terms };
  },

  // -------------------------------------------------------------------------
  // Get a single taxonomy term by ID
  // -------------------------------------------------------------------------
  async getTerm(id: string): Promise<TaxonomyTerm | null> {
    return taxonomyRepository.findTermById(id);
  },

  // -------------------------------------------------------------------------
  // Create a taxonomy term
  // -------------------------------------------------------------------------
  async createTerm(input: {
    scheme_code: string;
    code: string;
    label: string;
    description?: string;
    parent_term_id?: string;
    sort_order?: number;
  }): Promise<TaxonomyTerm> {
    // Look up scheme_id from concept_schemes
    const scheme = await taxonomyRepository.findConceptSchemeByCode(input.scheme_code);
    const term = await taxonomyRepository.createTerm({
      ...input,
      scheme_id: scheme?.id,
    });

    await taxonomyRepository.insertAuditLog({
      entity_type: 'taxonomy_term',
      entity_id: term.id,
      action: 'create',
      changes: { after: term },
    });

    return term;
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
    const before = await taxonomyRepository.findTermById(id);
    const updated = await taxonomyRepository.updateTerm(id, updates);

    if (updated) {
      await taxonomyRepository.insertAuditLog({
        entity_type: 'taxonomy_term',
        entity_id: id,
        action: updates.is_active === false ? 'deactivate' : updates.is_active === true ? 'reactivate' : 'update',
        changes: { before, after: updated },
      });
    }

    return updated;
  },

  // -------------------------------------------------------------------------
  // Delete a taxonomy term
  // -------------------------------------------------------------------------
  async deleteTerm(id: string): Promise<boolean> {
    const term = await taxonomyRepository.findTermById(id);
    const deleted = await taxonomyRepository.deleteTerm(id);

    if (deleted && term) {
      await taxonomyRepository.insertAuditLog({
        entity_type: 'taxonomy_term',
        entity_id: id,
        action: 'delete',
        changes: { before: term },
      });
    }

    return deleted;
  },

  // -------------------------------------------------------------------------
  // List all distinct schemes (legacy — returns string[])
  // -------------------------------------------------------------------------
  async listSchemes(): Promise<{ data: string[] }> {
    const schemes = await taxonomyRepository.findSchemes();
    return { data: schemes };
  },

  // -------------------------------------------------------------------------
  // List concept schemes (full registry with metadata)
  // -------------------------------------------------------------------------
  async listConceptSchemes(): Promise<{ data: ConceptScheme[] }> {
    const schemes = await taxonomyRepository.findConceptSchemes();
    return { data: schemes };
  },

  // -------------------------------------------------------------------------
  // Get concept scheme by code
  // -------------------------------------------------------------------------
  async getConceptScheme(code: string): Promise<ConceptScheme | null> {
    return taxonomyRepository.findConceptSchemeByCode(code);
  },

  // -------------------------------------------------------------------------
  // Create concept scheme
  // -------------------------------------------------------------------------
  async createConceptScheme(input: {
    code: string;
    label: string;
    description?: string;
    is_hierarchical?: boolean;
    is_locked?: boolean;
    sort_order?: number;
  }): Promise<ConceptScheme> {
    const scheme = await taxonomyRepository.createConceptScheme(input);

    await taxonomyRepository.insertAuditLog({
      entity_type: 'concept_scheme',
      entity_id: scheme.id,
      action: 'create',
      changes: { after: scheme },
    });

    return scheme;
  },

  // -------------------------------------------------------------------------
  // Update concept scheme
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
    const before = await taxonomyRepository.findConceptSchemeByCode(code);
    const updated = await taxonomyRepository.updateConceptScheme(code, updates);

    if (updated) {
      await taxonomyRepository.insertAuditLog({
        entity_type: 'concept_scheme',
        entity_id: updated.id,
        action: 'update',
        changes: { before, after: updated },
      });
    }

    return updated;
  },

  // -------------------------------------------------------------------------
  // List tags with optional label search and pagination
  // -------------------------------------------------------------------------
  async listTags(rawQuery: Partial<TagListQuery>): Promise<TagListResponse> {
    const { page, pageSize } = parsePagination(rawQuery);
    const { tags, total } = await taxonomyRepository.findTags({
      q: typeof rawQuery.q === 'string' ? rawQuery.q : undefined,
      page,
      pageSize,
    });
    return { data: tags, meta: buildMeta(page, pageSize, total) };
  },
};
