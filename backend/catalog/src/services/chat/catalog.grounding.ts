// ---------------------------------------------------------------------------
// Catalog Grounding Provider — retrieves context from catalog assets
//
// Consumes a QueryInterpretation search plan produced by the query
// interpreter. The plan determines scope, intent, retrievalMode, filters,
// and keywords — this provider simply executes the right retrieval strategy.
//
// Retrieval modes:
//   1. detail     — entityId present → fetch asset by ID + similar assets
//   2. semantic   — NL / exploratory query → keyword-extracted full-text search
//   3. structured — filter-like / exact query → direct DB filter query
//   4. hybrid     — filters + text → column-filtered full-text search
//   5. fallback   — primary search returned nothing → latest GA assets
// ---------------------------------------------------------------------------

import type { GroundingProvider } from './grounding.provider.js';
import type {
  ChatContext,
  GroundingResult,
  GroundingPayload,
  RetrievalMode,
  RetrievalMetadata,
  QueryInterpretation,
} from '../../models/chat.types.js';
import { extractKeywords } from './query-interpreter.js';
import { discoveryRepository } from '../../repositories/discovery.repository.js';
import { assetRepository } from '../../repositories/asset.repository.js';
import type { CatalogAsset } from '../../models/catalog.types.js';

// ── Asset → GroundingResult converter ───────────────────────────────────

function assetToGrounding(asset: CatalogAsset, score = 0.8): GroundingResult {
  return {
    sourceId: asset.id,
    title: asset.name,
    snippet: [
      asset.short_summary ?? '',
      `Kind: ${asset.asset_kind}`,
      `Domain: ${asset.domain ?? 'n/a'}`,
      `Status: ${asset.publication_status}`,
      asset.data_classification ? `Classification: ${asset.data_classification}` : '',
      asset.hosting_type ? `Hosting: ${asset.hosting_type}` : '',
      asset.data_residency ? `Residency: ${asset.data_residency}` : '',
      asset.compliance_tags?.length
        ? `Compliance: ${asset.compliance_tags.join(', ')}`
        : '',
      asset.contains_pii ? 'Contains PII' : '',
    ]
      .filter(Boolean)
      .join(' · '),
    score,
    link: `/catalog/assets/${asset.id}`,
  };
}

// ---------------------------------------------------------------------------
// Retrieval implementations
// ---------------------------------------------------------------------------

/** Strategy: detail — fetch asset by ID + similar assets. */
async function retrieveByDetail(
  entityId: string,
  maxResults: number,
): Promise<GroundingResult[]> {
  const [asset, similar] = await Promise.all([
    assetRepository.findById(entityId),
    discoveryRepository.findSimilar(entityId, maxResults - 1),
  ]);

  const results: GroundingResult[] = [];
  if (asset) results.push(assetToGrounding(asset, 1.0));
  for (const sim of similar) {
    results.push(assetToGrounding(sim, sim.similarity_score / 10));
  }
  return results.slice(0, maxResults);
}

/** Strategy: semantic — keyword-extracted full-text search. */
async function retrieveSemantic(
  query: string,
  planKeywords: string,
  context: ChatContext,
  maxResults: number,
): Promise<GroundingResult[]> {
  // Prefer keywords from the interpreter; fall back to raw extraction
  const keywords = planKeywords || extractKeywords(query);

  const searchParams: Record<string, unknown> = {
    q: keywords,
    pageSize: maxResults,
  };

  // Forward any active page-level filters
  if (context.filters) {
    for (const [key, value] of Object.entries(context.filters)) {
      if (value !== undefined && value !== '' && key !== 'q') {
        searchParams[key] = value;
      }
    }
  }

  const searchResults = await discoveryRepository.search(
    searchParams as Parameters<typeof discoveryRepository.search>[0],
  );

  return searchResults.assets.map((a) => assetToGrounding(a));
}

/**
 * Strategy: hybrid — full-text search constrained by column-level filters.
 * Combines the best of semantic (keyword relevance) and structured (filter
 * precision) when the user provides both NL text and filterable entities.
 */
async function retrieveHybrid(
  query: string,
  filters: Record<string, string>,
  planKeywords: string,
  context: ChatContext,
  maxResults: number,
): Promise<GroundingResult[]> {
  const keywords = planKeywords || extractKeywords(query);

  const searchParams: Record<string, unknown> = {
    q: keywords,
    pageSize: maxResults,
  };

  // Apply structured filters from the plan
  const knownKeys = ['asset_kind', 'domain', 'publication_status', 'compliance_tag', 'data_residency', 'contains_pii'];
  for (const key of knownKeys) {
    if (filters[key]) searchParams[key] = filters[key];
  }

  // Layer in page-level ambient filters
  if (context.filters) {
    for (const [key, value] of Object.entries(context.filters)) {
      if (value !== undefined && value !== '' && key !== 'q') {
        searchParams[key] ??= value;
      }
    }
  }

  const searchResults = await discoveryRepository.search(
    searchParams as Parameters<typeof discoveryRepository.search>[0],
  );

  return searchResults.assets.map((a) => assetToGrounding(a, 0.85));
}

/** Strategy: structured — direct DB column filters parsed from the query. */
async function retrieveStructured(
  filters: Record<string, string>,
  context: ChatContext,
  maxResults: number,
): Promise<GroundingResult[]> {
  // Use findFiltered() — pure column-level filtering, no text search needed.
  const filterParams: Record<string, string> = { pageSize: String(maxResults) };

  // Apply parsed structured filters
  const knownKeys = ['asset_kind', 'domain', 'publication_status', 'compliance_tag', 'data_residency', 'contains_pii'];
  for (const key of knownKeys) {
    if (filters[key]) filterParams[key] = filters[key];
  }

  // Also layer in page-level ambient filters
  if (context.filters) {
    for (const [key, value] of Object.entries(context.filters)) {
      if (value !== undefined && value !== '' && key !== 'q') {
        filterParams[key] ??= String(value);
      }
    }
  }

  const searchResults = await discoveryRepository.findFiltered({
    ...filterParams,
    pageSize: maxResults,
  });

  return searchResults.assets.map((a) => assetToGrounding(a, 0.9));
}

/** Fallback: latest GA assets when all other strategies return nothing. */
async function retrieveFallback(maxResults: number): Promise<GroundingResult[]> {
  // Use findFiltered() with no filters — returns latest GA/preview assets.
  const fallback = await discoveryRepository.findFiltered({ pageSize: maxResults });
  if (fallback.assets.length === 0) return [];
  return fallback.assets.map((a) => assetToGrounding(a, 0.5));
}

// ---------------------------------------------------------------------------
// CatalogGroundingProvider — main class
// ---------------------------------------------------------------------------

export class CatalogGroundingProvider implements GroundingProvider {
  readonly key = 'catalog';

  async retrieve(
    query: string,
    context: ChatContext,
    plan: QueryInterpretation,
    maxResults = 6,
  ): Promise<GroundingPayload> {
    const startTime = Date.now();

    try {
      console.info(
        `[CatalogGrounding] Executing plan: mode=${plan.retrievalMode} ` +
        `intent=${plan.intent} scope=${plan.scope}`,
      );

      // ── 1. Detail mode — fetch asset by ID + similar ───────────────
      if (plan.retrievalMode === 'detail' && plan.targetEntityId) {
        const results = await retrieveByDetail(plan.targetEntityId, maxResults);
        return this.buildPayload(results, 'detail', 'detail', false, startTime);
      }

      // ── 2. Primary retrieval based on plan ─────────────────────────
      let results: GroundingResult[];
      const initialMode: RetrievalMode = plan.retrievalMode;

      switch (plan.retrievalMode) {
        case 'structured':
          results = await retrieveStructured(plan.filters, context, maxResults);
          break;

        case 'hybrid':
          results = await retrieveHybrid(query, plan.filters, plan.keywords, context, maxResults);
          break;

        case 'semantic':
        default:
          results = await retrieveSemantic(query, plan.keywords, context, maxResults);
          break;
      }

      // ── 3. Fallback chain ──────────────────────────────────────────
      if (results.length === 0) {
        console.info(
          `[CatalogGrounding] ${initialMode} search returned 0 results — trying fallback.`,
        );

        // If we tried semantic first, try structured as a fallback
        if (initialMode === 'semantic' && Object.keys(plan.filters).length > 0) {
          results = await retrieveStructured(plan.filters, context, maxResults);
          if (results.length > 0) {
            return this.buildPayload(results, 'structured', initialMode, true, startTime);
          }
        }

        // If we tried structured first, try semantic as a fallback
        if (initialMode === 'structured') {
          results = await retrieveSemantic(query, plan.keywords, context, maxResults);
          if (results.length > 0) {
            return this.buildPayload(results, 'semantic', initialMode, true, startTime);
          }
        }

        // If hybrid failed, try pure semantic then pure structured
        if (initialMode === 'hybrid') {
          results = await retrieveSemantic(query, plan.keywords, context, maxResults);
          if (results.length > 0) {
            return this.buildPayload(results, 'semantic', initialMode, true, startTime);
          }
          results = await retrieveStructured(plan.filters, context, maxResults);
          if (results.length > 0) {
            return this.buildPayload(results, 'structured', initialMode, true, startTime);
          }
        }

        // Last resort: latest GA assets
        results = await retrieveFallback(maxResults);
        return this.buildPayload(results, 'fallback', initialMode, true, startTime);
      }

      return this.buildPayload(results, initialMode, initialMode, false, startTime);
    } catch (err) {
      console.error('[CatalogGrounding] Retrieval failed:', err);
      return this.buildPayload([], 'none', 'none', false, Date.now());
    }
  }

  private buildPayload(
    results: GroundingResult[],
    modeUsed: RetrievalMode,
    initialMode: RetrievalMode,
    fallbackUsed: boolean,
    startTime: number,
  ): GroundingPayload {
    return {
      results,
      metadata: {
        retrievalModeUsed: modeUsed,
        resultCount: results.length,
        fallbackUsed,
        initialModeAttempted: fallbackUsed ? initialMode : undefined,
        retrievalTimeMs: Date.now() - startTime,
        groundingProvider: 'catalog',
      },
    };
  }
}
