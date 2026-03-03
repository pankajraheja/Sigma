// ---------------------------------------------------------------------------
// AI Provider — interface, shared types, and factory
//
// createAiProvider() returns:
//   - OpenAiProvider when OPENAI_API_KEY is set (real LLM calls)
//   - StubAiProvider otherwise (deterministic, data-driven mock — no API call)
//
// Both implement AiProvider identically; the rest of the system is unaware
// of which is active. Add providerName to responses for UI provenance display.
//
// TODO (Phase 3): add EmbeddingProvider interface for pgvector similarity.
// ---------------------------------------------------------------------------

import type {
  CatalogAsset,
  AssetClassification,
  AssetTag,
  AssetVersion,
  SimilarAsset,
} from '../../models/catalog.types.js';

// ---------------------------------------------------------------------------
// Shared context assembled before calling any provider method
// ---------------------------------------------------------------------------

export interface AssetContext {
  classifications: AssetClassification[];
  tags: AssetTag[];
  versions: AssetVersion[];
}

// ---------------------------------------------------------------------------
// Provider result types (internal — wrapped into response envelopes by ai.service.ts)
// ---------------------------------------------------------------------------

export interface AiSummaryResult {
  businessSummary: string;
  technicalSummary: string;
  reuseGuidance: string;
  keyRisks: string[];
}

export interface RecommendationReason {
  assetId: string;
  reason: string;
}

export interface EnrichmentResult {
  suggestedTags: Array<{
    label: string;
    confidence: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
  suggestedClassifications: Array<{
    scheme_code: string;
    code: string;
    label: string;
    confidence: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
  nfrClarifications: Array<{
    field: string;
    currentValue: string | null;
    suggestedValue: string;
    rationale: string;
  }>;
}

// ---------------------------------------------------------------------------
// AiProvider interface — implemented by OpenAiProvider and StubAiProvider
// ---------------------------------------------------------------------------

export interface AiProvider {
  readonly providerName: 'openai' | 'stub';
  readonly modelName: string;

  generateSummary(asset: CatalogAsset, ctx: AssetContext): Promise<AiSummaryResult>;

  generateRecommendationReasons(
    asset: CatalogAsset,
    candidates: SimilarAsset[],
  ): Promise<RecommendationReason[]>;

  generateEnrichmentSuggestions(
    asset: CatalogAsset,
    ctx: AssetContext,
  ): Promise<EnrichmentResult>;
}

// ---------------------------------------------------------------------------
// Factory — called once at service startup
// ---------------------------------------------------------------------------

import { OpenAiProvider } from './openai.provider.js';
import type { OpenAiProviderConfig } from './openai.provider.js';
import { StubAiProvider } from './stub.provider.js';

export interface AiProviderConfig {
  apiKey: string;
  model: string;
  azureEndpoint?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
}

export function createAiProvider(cfg: AiProviderConfig): AiProvider {
  if (cfg.apiKey && cfg.apiKey.length > 10) {
    const isAzure = !!(cfg.azureEndpoint && cfg.azureEndpoint.length > 0);
    const label = isAzure ? `azure/${cfg.azureDeployment ?? cfg.model}` : cfg.model;
    console.info('[AI] Provider: openai (%s)', label);
    const providerCfg: OpenAiProviderConfig = {
      apiKey:          cfg.apiKey,
      model:           cfg.model,
      azureEndpoint:   cfg.azureEndpoint,
      azureDeployment: cfg.azureDeployment,
      azureApiVersion: cfg.azureApiVersion,
    };
    return new OpenAiProvider(providerCfg);
  }
  console.info('[AI] Provider: stub (set OPENAI_API_KEY to enable real AI)');
  return new StubAiProvider();
}
