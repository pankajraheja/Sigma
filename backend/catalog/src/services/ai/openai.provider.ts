// ---------------------------------------------------------------------------
// OpenAI Provider — real LLM calls via JSON mode
//
// Supports both:
//   Standard OpenAI  — set OPENAI_API_KEY
//   Azure OpenAI     — set OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_DEPLOYMENT
//
// Falls back gracefully on API errors (ai.service.ts catches and re-tries with stub).
// ---------------------------------------------------------------------------

import OpenAI, { AzureOpenAI } from 'openai';
import type { CatalogAsset, SimilarAsset } from '../../models/catalog.types.js';
import type {
  AiProvider,
  AssetContext,
  AiSummaryResult,
  RecommendationReason,
  EnrichmentResult,
} from './ai.provider.js';

export interface OpenAiProviderConfig {
  apiKey: string;
  model: string;
  /** Azure OpenAI endpoint URL, e.g. https://my-resource.openai.azure.com */
  azureEndpoint?: string;
  /** Azure deployment name (equals the model name you used when deploying) */
  azureDeployment?: string;
  /** Azure REST API version, e.g. 2024-12-01-preview */
  azureApiVersion?: string;
}

export class OpenAiProvider implements AiProvider {
  readonly providerName = 'openai' as const;
  readonly modelName: string;

  private readonly client: OpenAI;

  constructor(cfg: OpenAiProviderConfig) {
    const isAzure = !!(cfg.azureEndpoint && cfg.azureEndpoint.length > 0);

    if (isAzure) {
      this.client = new AzureOpenAI({
        endpoint:   cfg.azureEndpoint,
        apiKey:     cfg.apiKey,
        apiVersion: cfg.azureApiVersion ?? '2024-12-01-preview',
        deployment: cfg.azureDeployment ?? cfg.model,
      });
      this.modelName = cfg.azureDeployment ?? cfg.model;
      console.info('[AI] Azure OpenAI endpoint: %s  deployment: %s', cfg.azureEndpoint, this.modelName);
    } else {
      this.client = new OpenAI({ apiKey: cfg.apiKey });
      this.modelName = cfg.model;
    }
  }

  // -------------------------------------------------------------------------
  // generateSummary
  // -------------------------------------------------------------------------

  async generateSummary(asset: CatalogAsset, ctx: AssetContext): Promise<AiSummaryResult> {
    const tagLabels = ctx.tags.map((t) => t.tag_label).join(', ') || 'none';
    const classLabels = ctx.classifications
      .map((c) => `${c.term_label} (${c.scheme_code})`)
      .join(', ') || 'none';
    const currentVersion = ctx.versions.find((v) => v.is_current)?.version ?? 'none';
    const description = (asset.description ?? '').slice(0, 2000);

    const userPrompt = `Generate a structured summary for this certified enterprise asset.

Name: ${asset.name}
Kind: ${asset.asset_kind}
Domain: ${asset.domain ?? 'unspecified'}
Short summary: ${asset.short_summary ?? 'none'}
Description: ${description || 'none'}
Compliance tags: ${asset.compliance_tags.join(', ') || 'none'}
Contains PII: ${asset.contains_pii}
Data classification: ${asset.data_classification ?? 'unspecified'}
Business criticality: ${asset.business_criticality ?? 'unspecified'}
Hosting: ${asset.hosting_type ?? 'unspecified'}
Audience: ${asset.audience_type ?? 'unspecified'}
SLA: ${asset.sla_description ?? 'none'}
Informal tags: ${tagLabels}
Taxonomy classifications: ${classLabels}
Current version: ${currentVersion}

Return JSON with these exact fields:
{
  "businessSummary": "2-3 sentences explaining what this asset does in plain business language",
  "technicalSummary": "2-3 sentences explaining the technical approach, data, and interfaces",
  "reuseGuidance": "1-2 sentences on when and how teams should reuse this asset",
  "keyRisks": ["short risk note"]
}
keyRisks should have 0-3 items covering PII, compliance, SLA constraints, or access restrictions.`;

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an enterprise data catalog AI assistant. Return valid JSON only. Be concise and professional.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<AiSummaryResult>;

    return {
      businessSummary: parsed.businessSummary ?? '',
      technicalSummary: parsed.technicalSummary ?? '',
      reuseGuidance: parsed.reuseGuidance ?? '',
      keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : [],
    };
  }

  // -------------------------------------------------------------------------
  // generateRecommendationReasons
  // -------------------------------------------------------------------------

  async generateRecommendationReasons(
    asset: CatalogAsset,
    candidates: SimilarAsset[],
  ): Promise<RecommendationReason[]> {
    if (candidates.length === 0) return [];

    const candidateList = candidates
      .map(
        (c) =>
          `- id: ${c.id} | name: "${c.name}" | kind: ${c.asset_kind} | domain: ${c.domain ?? 'none'} | score: ${c.similarity_score}`,
      )
      .join('\n');

    const userPrompt = `For each candidate asset below, write a single concise sentence (max 12 words) explaining why it is recommended relative to the source asset.

Source asset: "${asset.name}" (${asset.asset_kind}, domain: ${asset.domain ?? 'none'}, compliance: ${asset.compliance_tags.join(', ') || 'none'})

Candidates:
${candidateList}

Return JSON array:
[{ "assetId": "...", "reason": "one sentence reason" }]`;

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an enterprise data catalog AI assistant. Return valid JSON only. Be concise.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    // Model may wrap array in an object key
    const parsed = JSON.parse(raw) as
      | RecommendationReason[]
      | { reasons?: RecommendationReason[]; data?: RecommendationReason[] };

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray((parsed as { reasons?: RecommendationReason[] }).reasons))
      return (parsed as { reasons: RecommendationReason[] }).reasons;
    if (Array.isArray((parsed as { data?: RecommendationReason[] }).data))
      return (parsed as { data: RecommendationReason[] }).data;
    return [];
  }

  // -------------------------------------------------------------------------
  // generateEnrichmentSuggestions
  // -------------------------------------------------------------------------

  async generateEnrichmentSuggestions(
    asset: CatalogAsset,
    ctx: AssetContext,
  ): Promise<EnrichmentResult> {
    const existingTags = ctx.tags.map((t) => t.tag_label).join(', ') || 'none';
    const existingClassifications = ctx.classifications
      .map((c) => `${c.term_label} (scheme: ${c.scheme_code})`)
      .join(', ') || 'none';

    const userPrompt = `Analyse this enterprise catalog asset and suggest metadata enrichments.

Asset: "${asset.name}"
Kind: ${asset.asset_kind}
Domain: ${asset.domain ?? 'unspecified'}
Compliance tags: ${asset.compliance_tags.join(', ') || 'none'}
Contains PII: ${asset.contains_pii}
Data classification: ${asset.data_classification ?? 'null'}
Business criticality: ${asset.business_criticality ?? 'null'}
Audience type: ${asset.audience_type ?? 'null'}
Existing informal tags: ${existingTags}
Existing taxonomy classifications: ${existingClassifications}

Return JSON:
{
  "suggestedTags": [{ "label": "tag-name", "confidence": "high|medium|low", "rationale": "short reason" }],
  "suggestedClassifications": [{ "scheme_code": "...", "code": "...", "label": "...", "confidence": "high|medium|low", "rationale": "short reason" }],
  "nfrClarifications": [{ "field": "field_name", "currentValue": "current or null", "suggestedValue": "suggestion", "rationale": "short reason" }]
}
Suggest only additions that are clearly justified. Return empty arrays if nothing meaningful to suggest.`;

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an enterprise data catalog AI assistant. Return valid JSON only. Only suggest well-justified enrichments.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<EnrichmentResult>;

    return {
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
      suggestedClassifications: Array.isArray(parsed.suggestedClassifications)
        ? parsed.suggestedClassifications
        : [],
      nfrClarifications: Array.isArray(parsed.nfrClarifications)
        ? parsed.nfrClarifications
        : [],
    };
  }
}
