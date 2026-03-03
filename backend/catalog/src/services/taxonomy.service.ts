// ---------------------------------------------------------------------------
// Taxonomy Service — taxonomy terms and tags
// ---------------------------------------------------------------------------

import { taxonomyRepository } from '../repositories/taxonomy.repository.js';
import type { TagListQuery, TaxonomyQuery } from '../models/api.types.js';
import { parsePagination, buildMeta } from '../models/api.types.js';
import type { TaxonomyTerm, Tag } from '../models/catalog.types.js';

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
  // List all distinct schemes
  // -------------------------------------------------------------------------
  async listSchemes(): Promise<{ data: string[] }> {
    const schemes = await taxonomyRepository.findSchemes();
    return { data: schemes };
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
