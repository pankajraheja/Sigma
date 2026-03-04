// ---------------------------------------------------------------------------
// Stub AI Provider — deterministic, data-driven mock (no LLM call)
//
// Active when OPENAI_API_KEY is not set. Reads actual asset fields to produce
// realistic, professional-sounding text. No randomness — same asset always
// returns the same response, making it safe for dev/test environments.
// ---------------------------------------------------------------------------

import type { CatalogAsset, SimilarAsset } from '../../models/catalog.types.js';
import type {
  AiProvider,
  AssetContext,
  AiSummaryResult,
  RecommendationReason,
  EnrichmentResult,
  ChatCompletionOptions,
} from './ai.provider.js';

export class StubAiProvider implements AiProvider {
  readonly providerName = 'stub' as const;
  readonly modelName = 'stub-v1';

  // -------------------------------------------------------------------------
  // generateSummary — builds text from actual asset metadata
  // -------------------------------------------------------------------------

  async generateSummary(asset: CatalogAsset, ctx: AssetContext): Promise<AiSummaryResult> {
    const domain = asset.domain?.replace(/_/g, ' ') ?? 'unspecified';
    const kind = asset.asset_kind;
    const currentVersion = ctx.versions.find((v) => v.is_current)?.version;

    const businessSummary = [
      `${asset.name} is a certified enterprise ${kind} in the ${domain} domain.`,
      asset.short_summary
        ? asset.short_summary
        : `It is published in AI Navigator as an approved asset available for enterprise reuse.`,
      currentVersion ? `Currently at version ${currentVersion}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const technicalSummary = [
      `Implemented as a ${kind} with ${asset.data_classification ?? 'internal'} data classification,`,
      `hosted on ${asset.hosting_type ?? 'cloud'} infrastructure.`,
      asset.contains_pii
        ? 'Processes personally identifiable information (PII) — subject to applicable data protection regulations.'
        : 'Does not process personally identifiable information.',
      asset.sla_description ? `SLA: ${asset.sla_description}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const compliance =
      asset.compliance_tags.length > 0 ? asset.compliance_tags.join(', ') : 'none listed';
    const reuseGuidance = `Available to ${asset.audience_type ?? 'internal'} consumers with appropriate entitlements. Review compliance requirements (${compliance}) before integrating into new solutions.`;

    const keyRisks: string[] = [];
    if (asset.contains_pii) {
      keyRisks.push('Contains PII — confirm data processing agreements are in place before use.');
    }
    if (asset.data_classification === 'restricted') {
      keyRisks.push('Restricted classification — verify access entitlements with the data owner.');
    }
    if (asset.business_criticality === 'critical') {
      keyRisks.push(
        'Business-critical asset — ensure high-availability architecture when integrating.',
      );
    }
    if (asset.compliance_tags.includes('gdpr')) {
      keyRisks.push('GDPR obligations apply — confirm lawful basis for any data processing.');
    }

    return { businessSummary, technicalSummary, reuseGuidance, keyRisks };
  }

  // -------------------------------------------------------------------------
  // generateRecommendationReasons — derives reason from shared signals
  // -------------------------------------------------------------------------

  async generateRecommendationReasons(
    asset: CatalogAsset,
    candidates: SimilarAsset[],
  ): Promise<RecommendationReason[]> {
    return candidates.map((c) => {
      const signals: string[] = [];

      if (c.domain && c.domain === asset.domain) {
        signals.push(`shares ${c.domain.replace(/_/g, ' ')} domain`);
      }
      if (c.asset_kind === asset.asset_kind) {
        signals.push(`same asset kind (${c.asset_kind})`);
      }
      if (c.opco_id && c.opco_id === asset.opco_id) {
        signals.push('same operating company');
      }
      if (c.function_group_id && c.function_group_id === asset.function_group_id) {
        signals.push('same functional area');
      }
      // High score implies shared taxonomy/tag overlap
      if (c.similarity_score >= 6) {
        signals.push('strong taxonomy and tag alignment');
      } else if (c.similarity_score >= 3) {
        signals.push('partial taxonomy overlap');
      }

      const reason =
        signals.length > 0
          ? capitalise(signals.join('; ')) + '.'
          : `Related ${c.asset_kind} in the AI Navigator catalog.`;

      return { assetId: c.id, reason };
    });
  }

  // -------------------------------------------------------------------------
  // generateEnrichmentSuggestions — rule-based from existing metadata
  // -------------------------------------------------------------------------

  async generateEnrichmentSuggestions(
    asset: CatalogAsset,
    ctx: AssetContext,
  ): Promise<EnrichmentResult> {
    const existingTagLabels = new Set(ctx.tags.map((t) => t.tag_label));
    const existingSchemes = new Set(ctx.classifications.map((c) => c.scheme_code));

    const suggestedTags: EnrichmentResult['suggestedTags'] = [];
    const suggestedClassifications: EnrichmentResult['suggestedClassifications'] = [];
    const nfrClarifications: EnrichmentResult['nfrClarifications'] = [];

    // Tag suggestions
    if (asset.contains_pii && !existingTagLabels.has('pii')) {
      suggestedTags.push({
        label: 'pii',
        confidence: 'high',
        rationale: 'Asset is flagged as containing PII — a pii tag improves discoverability.',
      });
    }
    if (asset.asset_kind === 'model' && !existingTagLabels.has('machine-learning')) {
      suggestedTags.push({
        label: 'machine-learning',
        confidence: 'medium',
        rationale: 'ML models are commonly tagged machine-learning for catalog search.',
      });
    }
    if (asset.asset_kind === 'api' && !existingTagLabels.has('real-time')) {
      suggestedTags.push({
        label: 'real-time',
        confidence: 'low',
        rationale: 'Many APIs process data in real time — verify before applying.',
      });
    }
    if (
      asset.compliance_tags.includes('gdpr') &&
      !existingTagLabels.has('gdpr') &&
      !existingTagLabels.has('gdpr-scoped')
    ) {
      suggestedTags.push({
        label: 'gdpr-scoped',
        confidence: 'high',
        rationale: 'Asset has GDPR compliance tag — a gdpr-scoped informal tag aids search.',
      });
    }

    // Classification suggestions
    if (!existingSchemes.has('asset_kind')) {
      suggestedClassifications.push({
        scheme_code: 'asset_kind',
        code: asset.asset_kind,
        label: capitalise(asset.asset_kind),
        confidence: 'high',
        rationale:
          'No asset_kind taxonomy classification — adding one enables structured browsing.',
      });
    }
    if (asset.domain === 'risk_compliance' && !existingSchemes.has('domain')) {
      suggestedClassifications.push({
        scheme_code: 'domain',
        code: 'risk_compliance',
        label: 'Risk & Compliance',
        confidence: 'high',
        rationale: 'Domain field is risk_compliance but no domain classification exists.',
      });
    }
    if (
      asset.compliance_tags.length > 0 &&
      !existingSchemes.has('compliance_tag')
    ) {
      for (const tag of asset.compliance_tags.slice(0, 2)) {
        suggestedClassifications.push({
          scheme_code: 'compliance_tag',
          code: tag,
          label: tag.toUpperCase(),
          confidence: 'high',
          rationale: `Compliance tag "${tag}" exists on asset but has no formal taxonomy classification.`,
        });
      }
    }

    // NFR clarifications
    if (asset.business_criticality === null) {
      nfrClarifications.push({
        field: 'business_criticality',
        currentValue: null,
        suggestedValue: asset.contains_pii || asset.compliance_tags.length > 0 ? 'high' : 'medium',
        rationale:
          'Business criticality is unset — setting it enables SLA-based filtering and governance.',
      });
    }
    if (asset.audience_type === null) {
      nfrClarifications.push({
        field: 'audience_type',
        currentValue: null,
        suggestedValue: 'internal',
        rationale: 'Audience type is unset — clarifying it enables access-scope filtering.',
      });
    }
    if (asset.retention_requirement === null && asset.contains_pii) {
      nfrClarifications.push({
        field: 'retention_requirement',
        currentValue: null,
        suggestedValue: 'Review regulatory requirement (e.g. GDPR Art. 5(1)(e))',
        rationale: 'PII-containing assets should specify a retention requirement for compliance.',
      });
    }

    return { suggestedTags, suggestedClassifications, nfrClarifications };
  }

  // -------------------------------------------------------------------------
  // chatCompletion — stub for Sigma Chat (returns grounding-aware mock)
  // -------------------------------------------------------------------------

  async chatCompletion(options: ChatCompletionOptions): Promise<string> {
    // Extract grounding context from the system message (if any)
    const system = options.messages.find((m) => m.role === 'system')?.content ?? '';
    const user = options.messages.filter((m) => m.role === 'user').pop()?.content ?? '';

    // If JSON mode, return a structured stub response
    if (options.jsonMode) {
      return JSON.stringify({
        answer: `Based on the catalog data, here is what I found for your question: "${user.slice(0, 80)}". ` +
          'The AI Navigator catalog contains approved enterprise assets across multiple domains. ' +
          'I can help you search, filter, and compare assets. Try asking about specific asset kinds, domains, or compliance requirements.',
        references: [],
        suggestions: [
          'Show all GA assets',
          'Find pipelines with EU data residency',
          'What assets contain PII?',
        ],
      });
    }

    return (
      `Based on the catalog data, here is what I found for your question: "${user.slice(0, 80)}". ` +
      'The AI Navigator catalog contains approved enterprise assets across multiple domains. ' +
      'I can help you search, filter, and compare assets.'
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
