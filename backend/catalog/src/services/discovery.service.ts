// ---------------------------------------------------------------------------
// Discovery Service — search and similarity for catalog assets
//
// Delegates data access to discoveryRepository.
//
// TODO (Phase 2 — Embedding Provider):
// When vector embeddings are added, configure the embedding model here:
//   const embeddingProvider = config.ai?.embeddingProvider ?? 'openai'
//   const embeddingModel    = config.ai?.embeddingModel    ?? 'text-embedding-3-small'
// Expose a generateEmbedding(text: string): Promise<number[]> helper that:
//   - calls the chosen provider API
//   - caches results for repeated queries within a request lifecycle
//   - passes the vector to discoveryRepository.search / findSimilar
// ---------------------------------------------------------------------------

import { discoveryRepository } from '../repositories/discovery.repository.js';
import type {
  SearchQuery,
  SearchResponse,
  SimilarAssetsResponse,
} from '../models/api.types.js';
import { parsePagination, buildMeta } from '../models/api.types.js';
import { NotFoundError } from './asset.service.js';

export const discoveryService = {
  // -------------------------------------------------------------------------
  // Full-text search across catalog assets.
  // Delegates to discoveryRepository.search() which uses the tsvector
  // GENERATED ALWAYS column (weighted name > short_summary > description).
  // Defaults to discoverable assets (ga/preview) unless publication_status
  // is explicitly provided.
  // -------------------------------------------------------------------------
  async search(rawQuery: Partial<SearchQuery> & { q?: string }): Promise<SearchResponse> {
    const { page, pageSize } = parsePagination(rawQuery);

    if (!rawQuery.q || rawQuery.q.trim().length === 0) {
      return { data: [], meta: buildMeta(page, pageSize, 0) };
    }

    const { assets, total } = await discoveryRepository.search({ ...rawQuery, page, pageSize });
    return {
      data: assets,
      meta: buildMeta(page, pageSize, total),
    };
  },

  // -------------------------------------------------------------------------
  // Get similar assets ranked by heuristic signal scoring.
  // Signals: same domain, same asset_kind, shared taxonomy classifications,
  // same org dimensions, shared tags.
  //
  // Only discoverable assets (ga/preview) are returned. The source asset
  // itself is excluded.
  //
  // TODO (Phase 2): replace heuristic scoring with pgvector cosine similarity.
  // -------------------------------------------------------------------------
  async getSimilar(assetId: string, limit = 5): Promise<SimilarAssetsResponse> {
    if (!isUuid(assetId)) {
      throw new NotFoundError(`Asset not found: ${assetId}`);
    }

    const clampedLimit = Math.min(20, Math.max(1, limit));
    const data = await discoveryRepository.findSimilar(assetId, clampedLimit);

    return { data, assetId };
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
