// ---------------------------------------------------------------------------
// AI Service — orchestrates provider calls with in-memory TTL cache
//
// Fallback chain (per call):
//   1. Primary  — Azure OpenAI (when AZURE_OPENAI_ENDPOINT is set)
//                 or standard OpenAI (when OPENAI_API_KEY is set without endpoint)
//   2. Fallback — Standard OpenAI via OPENAI_FALLBACK_KEY (when primary fails)
//   3. Stub     — Deterministic data-driven mock (always works)
//
// Caches results keyed by `${assetId}:${asset.updated_at}` so the cache
// auto-invalidates whenever the asset metadata is updated.
// TTLs: summaries 30 min, recommendations + enrichment 15 min.
// ---------------------------------------------------------------------------

import { createAiProvider } from './ai/ai.provider.js';
import { OpenAiProvider } from './ai/openai.provider.js';
import { StubAiProvider } from './ai/stub.provider.js';
import { assetRepository } from '../repositories/asset.repository.js';
import { discoveryRepository } from '../repositories/discovery.repository.js';
import { config } from '../config/index.js';
import { isUuid, NotFoundError } from './asset.service.js';
import type {
  AssetAiSummaryResponse,
  AssetRecommendationsResponse,
  AssetEnrichmentSuggestionsResponse,
} from '../models/api.types.js';
import type { AiProvider } from './ai/ai.provider.js';

// ---------------------------------------------------------------------------
// Singleton providers — created once at module load
// ---------------------------------------------------------------------------

const provider = createAiProvider({
  apiKey:          config.ai.openaiApiKey,
  model:           config.ai.model,
  azureEndpoint:   config.ai.azureEndpoint,
  azureDeployment: config.ai.azureDeployment,
  azureApiVersion: config.ai.azureApiVersion,
});

// Standard OpenAI fallback — only created when a separate fallback key is set
const fallbackProvider: AiProvider | null =
  config.ai.openaiFallbackKey && config.ai.openaiFallbackKey.length > 10
    ? (() => {
        console.info('[AI] Fallback provider: openai (%s)', config.ai.model);
        return new OpenAiProvider({ apiKey: config.ai.openaiFallbackKey, model: config.ai.model });
      })()
    : null;

const stubProvider = new StubAiProvider();

// ---------------------------------------------------------------------------
// TTL cache types
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  exp: number;
}

const summaryCache = new Map<string, CacheEntry<AssetAiSummaryResponse>>();
const recCache = new Map<string, CacheEntry<AssetRecommendationsResponse>>();
const enrichCache = new Map<string, CacheEntry<AssetEnrichmentSuggestionsResponse>>();

function cacheKey(assetId: string, updatedAt: string | Date | null): string {
  return `${assetId}:${updatedAt ?? 'null'}`;
}

// ---------------------------------------------------------------------------
// 3-level fallback helper
// ---------------------------------------------------------------------------

async function withFallback<T>(
  label: string,
  primary: (p: AiProvider) => Promise<T>,
  stub: (p: AiProvider) => Promise<T>,
): Promise<{ result: T; usedProvider: AiProvider }> {
  // Level 1 — primary
  try {
    return { result: await primary(provider), usedProvider: provider };
  } catch (err) {
    console.warn(`[AI] ${label} — primary failed (${(err as Error).message})`);
  }

  // Level 2 — standard OpenAI fallback (only if configured)
  if (fallbackProvider) {
    try {
      console.info(`[AI] ${label} — trying fallback provider`);
      return { result: await primary(fallbackProvider), usedProvider: fallbackProvider };
    } catch (err) {
      console.warn(`[AI] ${label} — fallback failed (${(err as Error).message})`);
    }
  }

  // Level 3 — stub
  console.info(`[AI] ${label} — using stub`);
  return { result: await stub(stubProvider), usedProvider: stubProvider };
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const aiService = {
  // -------------------------------------------------------------------------
  // GET /api/catalog/assets/:id/summary
  // -------------------------------------------------------------------------
  async getSummary(assetId: string): Promise<AssetAiSummaryResponse> {
    if (!isUuid(assetId)) throw new NotFoundError(`Asset not found: ${assetId}`);

    const asset = await assetRepository.findById(assetId);
    if (!asset) throw new NotFoundError(`Asset not found: ${assetId}`);

    const key = cacheKey(assetId, asset.updated_at);
    const cached = summaryCache.get(key);
    if (cached && cached.exp > Date.now()) return cached.data;

    const [classifications, tags, versions] = await Promise.all([
      assetRepository.findClassifications(assetId),
      assetRepository.findAssetTags(assetId),
      assetRepository.findVersions(assetId),
    ]);

    const ctx = { classifications, tags, versions };
    const { result, usedProvider } = await withFallback(
      'generateSummary',
      (p) => p.generateSummary(asset, ctx),
      (p) => p.generateSummary(asset, ctx),
    );

    const response: AssetAiSummaryResponse = {
      assetId,
      ...result,
      generatedAt: new Date().toISOString(),
      provider: usedProvider.providerName,
      model: usedProvider.modelName,
    };

    summaryCache.set(key, { data: response, exp: Date.now() + config.ai.summaryTtlMs });
    return response;
  },

  // -------------------------------------------------------------------------
  // GET /api/catalog/assets/:id/recommendations
  // -------------------------------------------------------------------------
  async getRecommendations(
    assetId: string,
    limit = 5,
  ): Promise<AssetRecommendationsResponse> {
    if (!isUuid(assetId)) throw new NotFoundError(`Asset not found: ${assetId}`);

    const asset = await assetRepository.findById(assetId);
    if (!asset) throw new NotFoundError(`Asset not found: ${assetId}`);

    const key = cacheKey(assetId, asset.updated_at);
    const cached = recCache.get(key);
    if (cached && cached.exp > Date.now()) return cached.data;

    const candidates = await discoveryRepository.findSimilar(assetId, limit * 2);

    const { result: reasons, usedProvider } = await withFallback(
      'generateRecommendationReasons',
      (p) => p.generateRecommendationReasons(asset, candidates),
      (p) => p.generateRecommendationReasons(asset, candidates),
    );

    const reasonMap = new Map(reasons.map((r) => [r.assetId, r.reason]));

    const data = candidates.slice(0, limit).map((c) => ({
      asset: c,
      reason: reasonMap.get(c.id) ?? `Related ${c.asset_kind} in the AI Navigator catalog.`,
      similarityScore: c.similarity_score,
    }));

    const response: AssetRecommendationsResponse = {
      data,
      assetId,
      generatedAt: new Date().toISOString(),
      provider: usedProvider.providerName,
    };

    recCache.set(key, { data: response, exp: Date.now() + config.ai.recTtlMs });
    return response;
  },

  // -------------------------------------------------------------------------
  // GET /api/catalog/assets/:id/enrichment-suggestions
  // -------------------------------------------------------------------------
  async getEnrichmentSuggestions(
    assetId: string,
  ): Promise<AssetEnrichmentSuggestionsResponse> {
    if (!isUuid(assetId)) throw new NotFoundError(`Asset not found: ${assetId}`);

    const asset = await assetRepository.findById(assetId);
    if (!asset) throw new NotFoundError(`Asset not found: ${assetId}`);

    const key = cacheKey(assetId, asset.updated_at);
    const cached = enrichCache.get(key);
    if (cached && cached.exp > Date.now()) return cached.data;

    const [classifications, tags, versions] = await Promise.all([
      assetRepository.findClassifications(assetId),
      assetRepository.findAssetTags(assetId),
      assetRepository.findVersions(assetId),
    ]);

    const ctx = { classifications, tags, versions };
    const { result, usedProvider } = await withFallback(
      'generateEnrichmentSuggestions',
      (p) => p.generateEnrichmentSuggestions(asset, ctx),
      (p) => p.generateEnrichmentSuggestions(asset, ctx),
    );

    const response: AssetEnrichmentSuggestionsResponse = {
      assetId,
      suggestedTags: result.suggestedTags.map((t) => ({
        value: t.label,
        confidence: t.confidence,
        rationale: t.rationale,
      })),
      suggestedClassifications: result.suggestedClassifications.map((c) => ({
        value: { scheme_code: c.scheme_code, code: c.code, label: c.label },
        confidence: c.confidence,
        rationale: c.rationale,
      })),
      nfrClarifications: result.nfrClarifications.map((n) => ({
        value: {
          field: n.field,
          currentValue: n.currentValue,
          suggestedValue: n.suggestedValue,
        },
        confidence: 'medium' as const,
        rationale: n.rationale,
      })),
      generatedAt: new Date().toISOString(),
      provider: usedProvider.providerName,
    };

    enrichCache.set(key, { data: response, exp: Date.now() + config.ai.enrichTtlMs });
    return response;
  },
};
