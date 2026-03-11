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
  // chatCompletion — stub for Sigma Chat and Prototype Lab generation
  // -------------------------------------------------------------------------

  async chatCompletion(options: ChatCompletionOptions): Promise<string> {
    const system = options.messages.find((m) => m.role === 'system')?.content ?? '';
    const user = options.messages.filter((m) => m.role === 'user').pop()?.content ?? '';

    // ── Prototype Lab generation (system prompt contains "UI prototype generator") ──
    if (system.includes('UI prototype generator')) {
      return this.generateStubHtml(system, user);
    }

    // ── Sigma Chat (JSON mode) ──
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

    // ── Sigma Chat (plain text) ──
    return (
      `Based on the catalog data, here is what I found for your question: "${user.slice(0, 80)}". ` +
      'The AI Navigator catalog contains approved enterprise assets across multiple domains. ' +
      'I can help you search, filter, and compare assets.'
    );
  }

  // -------------------------------------------------------------------------
  // Stub HTML generator — prompt-aware, returns page-type-specific HTML
  // -------------------------------------------------------------------------

  private generateStubHtml(system: string, userPrompt: string): string {
    const t = this.extractBrandTokens(system);
    const prompt = userPrompt.toLowerCase();

    if (prompt.includes('login') || prompt.includes('sign in') || prompt.includes('signin'))
      return this.stubLogin(t, userPrompt);
    if (prompt.includes('signup') || prompt.includes('sign up') || prompt.includes('register'))
      return this.stubSignup(t, userPrompt);
    if (prompt.includes('dashboard') || prompt.includes('overview') || prompt.includes('analytics'))
      return this.stubDashboard(t, userPrompt);
    if (prompt.includes('pricing') || prompt.includes('plan') || prompt.includes('subscription'))
      return this.stubPricing(t, userPrompt);
    if (prompt.includes('contact') || prompt.includes('support') || prompt.includes('help'))
      return this.stubContact(t, userPrompt);
    if (prompt.includes('profile') || prompt.includes('settings') || prompt.includes('account'))
      return this.stubProfile(t, userPrompt);
    if (prompt.includes('table') || prompt.includes('list') || prompt.includes('data'))
      return this.stubDataTable(t, userPrompt);
    return this.stubLanding(t, userPrompt);
  }

  private extractBrandTokens(system: string) {
    return {
      primary:    this.extractToken(system, 'Primary:', '#00338D'),
      secondary:  this.extractToken(system, 'Secondary:', '#0047BB'),
      background: this.extractToken(system, 'Background:', '#FFFFFF'),
      text:       this.extractToken(system, 'Text:', '#111827'),
      border:     this.extractToken(system, 'Border:', '#E5E7EB'),
      fontFamily: this.extractToken(system, 'font-family:', 'Arial, sans-serif'),
      company:    this.extractToken(system, 'Company:', 'SigAI'),
      btnRadius:  this.extractToken(system, 'Buttons:', '9999px'),
      cardRadius: this.extractToken(system, 'Cards:', '12px'),
      inputRadius: this.extractToken(system, 'Inputs:', '8px'),
    };
  }

  private extractToken(text: string, label: string, fallback: string): string {
    const pattern = new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(.+)`, 'i');
    const match = pattern.exec(text);
    return match?.[1] ? match[1].trim() : fallback;
  }

  private wrap(t: ReturnType<StubAiProvider['extractBrandTokens']>, title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.company} — ${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${t.fontFamily}; color: ${t.text}; background: ${t.background}; }
    .nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid ${t.border}; }
    .nav-brand { font-size: 18px; font-weight: 700; color: ${t.primary}; }
    .nav-links { display: flex; gap: 24px; align-items: center; }
    .nav-links a { font-size: 14px; color: ${t.text}; text-decoration: none; }
    .nav-links a:hover { color: ${t.primary}; }
    .btn-primary { display: inline-block; padding: 12px 32px; background: ${t.primary}; color: ${t.background}; font-size: 14px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; text-decoration: none; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary { display: inline-block; padding: 12px 32px; background: ${t.background}; color: ${t.primary}; font-size: 14px; font-weight: 700; border: 2px solid ${t.primary}; border-radius: ${t.btnRadius}; cursor: pointer; text-decoration: none; }
    .footer { padding: 24px 32px; text-align: center; border-top: 1px solid ${t.border}; font-size: 12px; color: ${t.text}; opacity: 0.6; }
  </style>
</head>
<body>
${body}
  <footer data-block="footer" class="footer">&copy; ${new Date().getFullYear()} ${t.company}. Prototype generated by SigAI Workspace.</footer>
</body>
</html>`;
  }

  // ── Login ──────────────────────────────────────────────────────────────

  private stubLogin(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Login');
    return this.wrap(t, title, `
  <section data-block="form-section" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${t.primary} 0%, ${t.secondary} 100%);">
    <div style="background: ${t.background}; border-radius: ${t.cardRadius}; padding: 48px 40px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 24px; font-weight: 700; color: ${t.primary}; margin-bottom: 8px;">${t.company}</div>
        <p style="font-size: 14px; color: ${t.text}; opacity: 0.6;">Sign in to your account</p>
      </div>
      <form onsubmit="return false">
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Email Address</label>
          <input type="email" placeholder="name@${t.company.toLowerCase()}.com" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
        </div>
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-size: 13px; font-weight: 600; color: ${t.text};">Password</label>
            <a href="#" style="font-size: 12px; color: ${t.primary}; text-decoration: none;">Forgot password?</a>
          </div>
          <input type="password" placeholder="Enter your password" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
        </div>
        <button type="submit" style="width: 100%; padding: 14px; background: ${t.primary}; color: ${t.background}; font-size: 15px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Sign In</button>
      </form>
      <div style="text-align: center; margin-top: 20px;">
        <span style="font-size: 13px; color: ${t.text}; opacity: 0.6;">Don't have an account? </span>
        <a href="#" style="font-size: 13px; color: ${t.primary}; text-decoration: none; font-weight: 600;">Sign up</a>
      </div>
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid ${t.border}; text-align: center;">
        <p style="font-size: 12px; color: ${t.text}; opacity: 0.5;">Or continue with</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 12px;">
          <button style="flex: 1; padding: 10px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; background: ${t.background}; font-size: 13px; cursor: pointer; font-family: ${t.fontFamily}; color: ${t.text};">SSO</button>
          <button style="flex: 1; padding: 10px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; background: ${t.background}; font-size: 13px; cursor: pointer; font-family: ${t.fontFamily}; color: ${t.text};">Microsoft</button>
        </div>
      </div>
    </div>
  </section>`);
  }

  // ── Sign Up ────────────────────────────────────────────────────────────

  private stubSignup(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Sign Up');
    return this.wrap(t, title, `
  <section data-block="form-section" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${t.primary} 0%, ${t.secondary} 100%);">
    <div style="background: ${t.background}; border-radius: ${t.cardRadius}; padding: 48px 40px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 24px; font-weight: 700; color: ${t.primary}; margin-bottom: 8px;">${t.company}</div>
        <p style="font-size: 14px; color: ${t.text}; opacity: 0.6;">Create your account</p>
      </div>
      <form onsubmit="return false">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">First Name</label>
            <input type="text" placeholder="John" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Last Name</label>
            <input type="text" placeholder="Doe" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Work Email</label>
          <input type="email" placeholder="john@company.com" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Password</label>
          <input type="password" placeholder="Min. 8 characters" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
        </div>
        <div style="margin-bottom: 24px;">
          <label style="display: flex; align-items: start; gap: 8px; font-size: 13px; color: ${t.text}; cursor: pointer;">
            <input type="checkbox" style="margin-top: 2px;" />
            I agree to the <a href="#" style="color: ${t.primary};">Terms of Service</a> and <a href="#" style="color: ${t.primary};">Privacy Policy</a>
          </label>
        </div>
        <button type="submit" style="width: 100%; padding: 14px; background: ${t.primary}; color: ${t.background}; font-size: 15px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Create Account</button>
      </form>
      <div style="text-align: center; margin-top: 20px;">
        <span style="font-size: 13px; color: ${t.text}; opacity: 0.6;">Already have an account? </span>
        <a href="#" style="font-size: 13px; color: ${t.primary}; text-decoration: none; font-weight: 600;">Sign in</a>
      </div>
    </div>
  </section>`);
  }

  // ── Dashboard ──────────────────────────────────────────────────────────

  private stubDashboard(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Dashboard');
    return this.wrap(t, title, `
  <nav data-block="header-nav" class="nav">
    <div class="nav-brand">${t.company}</div>
    <div class="nav-links">
      <a href="#" style="color: ${t.primary}; font-weight: 600;">Dashboard</a>
      <a href="#">Reports</a>
      <a href="#">Settings</a>
    </div>
  </nav>
  <section data-block="card-grid" style="max-width: 1200px; margin: 0 auto; padding: 32px;">
    <h1 style="font-size: 24px; font-weight: 700; color: ${t.text}; margin-bottom: 24px;">Dashboard</h1>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px;">
      <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 24px;">
        <p style="font-size: 12px; color: ${t.text}; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Total Users</p>
        <p style="font-size: 28px; font-weight: 700; color: ${t.primary};">12,847</p>
        <p style="font-size: 12px; color: #10B981; margin-top: 4px;">+12.5% from last month</p>
      </div>
      <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 24px;">
        <p style="font-size: 12px; color: ${t.text}; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Revenue</p>
        <p style="font-size: 28px; font-weight: 700; color: ${t.primary};">$48.2K</p>
        <p style="font-size: 12px; color: #10B981; margin-top: 4px;">+8.2% from last month</p>
      </div>
      <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 24px;">
        <p style="font-size: 12px; color: ${t.text}; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Active Projects</p>
        <p style="font-size: 28px; font-weight: 700; color: ${t.primary};">342</p>
        <p style="font-size: 12px; color: #10B981; margin-top: 4px;">+3.1% from last month</p>
      </div>
      <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 24px;">
        <p style="font-size: 12px; color: ${t.text}; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Completion Rate</p>
        <p style="font-size: 28px; font-weight: 700; color: ${t.primary};">94.2%</p>
        <p style="font-size: 12px; color: #10B981; margin-top: 4px;">+1.8% from last month</p>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
      <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 24px;">
        <h2 style="font-size: 16px; font-weight: 700; color: ${t.text}; margin-bottom: 16px;">Recent Activity</h2>
        <div style="space-y: 12px;">
          ${[
            { action: 'New model deployed', detail: 'Fraud Detection v2.1', time: '2 hours ago' },
            { action: 'API endpoint updated', detail: 'Customer Score API', time: '4 hours ago' },
            { action: 'Pipeline completed', detail: 'ETL — Risk Metrics', time: '6 hours ago' },
            { action: 'Review approved', detail: 'Compliance Template v3', time: '8 hours ago' },
            { action: 'New submission', detail: 'Churn Prediction Model', time: '12 hours ago' },
          ].map(r => `<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${t.border};">
              <div><p style="font-size: 14px; font-weight: 600; color: ${t.text};">${r.action}</p><p style="font-size: 12px; color: ${t.text}; opacity: 0.5;">${r.detail}</p></div>
              <span style="font-size: 12px; color: ${t.text}; opacity: 0.4;">${r.time}</span>
            </div>`).join('')}
        </div>
      </div>
      <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 24px;">
        <h2 style="font-size: 16px; font-weight: 700; color: ${t.text}; margin-bottom: 16px;">Quick Actions</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button style="width: 100%; padding: 12px; background: ${t.primary}; color: ${t.background}; font-size: 13px; font-weight: 600; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">New Project</button>
          <button style="width: 100%; padding: 12px; background: ${t.background}; color: ${t.primary}; font-size: 13px; font-weight: 600; border: 2px solid ${t.primary}; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Generate Report</button>
          <button style="width: 100%; padding: 12px; background: ${t.background}; color: ${t.primary}; font-size: 13px; font-weight: 600; border: 2px solid ${t.primary}; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Invite Team</button>
        </div>
      </div>
    </div>
  </section>`);
  }

  // ── Pricing ────────────────────────────────────────────────────────────

  private stubPricing(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Pricing');
    return this.wrap(t, title, `
  <nav data-block="header-nav" class="nav">
    <div class="nav-brand">${t.company}</div>
    <div class="nav-links"><a href="#">Home</a><a href="#">Features</a><a href="#" style="color: ${t.primary}; font-weight: 600;">Pricing</a><a href="#">Contact</a></div>
  </nav>
  <section data-block="card-grid" style="padding: 64px 32px; text-align: center;">
    <h1 style="font-size: 36px; font-weight: 700; color: ${t.text}; margin-bottom: 12px;">Choose Your Plan</h1>
    <p style="font-size: 16px; color: ${t.text}; opacity: 0.6; max-width: 500px; margin: 0 auto 48px;">Simple, transparent pricing. No hidden fees.</p>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto;">
      ${[
        { name: 'Starter', price: '$29', period: '/month', features: ['5 Projects', '10 GB Storage', 'Email Support', 'Basic Analytics'], cta: 'Get Started', featured: false },
        { name: 'Professional', price: '$79', period: '/month', features: ['25 Projects', '100 GB Storage', 'Priority Support', 'Advanced Analytics', 'API Access', 'Custom Branding'], cta: 'Start Free Trial', featured: true },
        { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited Projects', 'Unlimited Storage', 'Dedicated Support', 'Full Analytics Suite', 'SSO & SAML', 'SLA Guarantee'], cta: 'Contact Sales', featured: false },
      ].map(plan => `
        <div style="background: ${plan.featured ? t.primary : t.background}; border: ${plan.featured ? 'none' : `1px solid ${t.border}`}; border-radius: ${t.cardRadius}; padding: 36px 28px; ${plan.featured ? 'transform: scale(1.05); box-shadow: 0 20px 40px rgba(0,0,0,0.1);' : ''}">
          ${plan.featured ? `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${t.background}; opacity: 0.8; margin-bottom: 8px;">Most Popular</div>` : ''}
          <h3 style="font-size: 20px; font-weight: 700; color: ${plan.featured ? t.background : t.text}; margin-bottom: 16px;">${plan.name}</h3>
          <div style="margin-bottom: 24px;"><span style="font-size: 40px; font-weight: 700; color: ${plan.featured ? t.background : t.primary};">${plan.price}</span><span style="font-size: 14px; color: ${plan.featured ? t.background : t.text}; opacity: 0.6;">${plan.period}</span></div>
          <ul style="list-style: none; margin-bottom: 28px; text-align: left;">
            ${plan.features.map(f => `<li style="padding: 6px 0; font-size: 14px; color: ${plan.featured ? t.background : t.text}; opacity: ${plan.featured ? '0.9' : '0.7'};">✓ ${f}</li>`).join('')}
          </ul>
          <button style="width: 100%; padding: 14px; background: ${plan.featured ? t.background : t.primary}; color: ${plan.featured ? t.primary : t.background}; font-size: 14px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">${plan.cta}</button>
        </div>`).join('')}
    </div>
  </section>`);
  }

  // ── Contact ────────────────────────────────────────────────────────────

  private stubContact(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Contact');
    return this.wrap(t, title, `
  <nav data-block="header-nav" class="nav">
    <div class="nav-brand">${t.company}</div>
    <div class="nav-links"><a href="#">Home</a><a href="#">About</a><a href="#" style="color: ${t.primary}; font-weight: 600;">Contact</a></div>
  </nav>
  <section data-block="form-section" style="max-width: 960px; margin: 0 auto; padding: 64px 32px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 64px;">
      <div>
        <h1 style="font-size: 32px; font-weight: 700; color: ${t.text}; margin-bottom: 16px;">Get in Touch</h1>
        <p style="font-size: 15px; line-height: 1.6; color: ${t.text}; opacity: 0.7; margin-bottom: 32px;">Have a question or want to learn more? Fill out the form and our team will get back to you within 24 hours.</p>
        <div style="margin-bottom: 24px; padding: 20px; border: 1px solid ${t.border}; border-radius: ${t.cardRadius};">
          <p style="font-size: 14px; font-weight: 600; color: ${t.text}; margin-bottom: 4px;">Email</p>
          <p style="font-size: 14px; color: ${t.primary};">contact@${t.company.toLowerCase()}.com</p>
        </div>
        <div style="padding: 20px; border: 1px solid ${t.border}; border-radius: ${t.cardRadius};">
          <p style="font-size: 14px; font-weight: 600; color: ${t.text}; margin-bottom: 4px;">Office</p>
          <p style="font-size: 14px; color: ${t.text}; opacity: 0.7;">123 Enterprise Avenue, Suite 400</p>
        </div>
      </div>
      <div>
        <form onsubmit="return false" style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 32px;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Full Name</label>
            <input type="text" placeholder="Your name" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Email</label>
            <input type="email" placeholder="you@company.com" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none;" />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Message</label>
            <textarea rows="5" placeholder="How can we help?" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily}; outline: none; resize: vertical;"></textarea>
          </div>
          <button type="submit" style="width: 100%; padding: 14px; background: ${t.primary}; color: ${t.background}; font-size: 15px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Send Message</button>
        </form>
      </div>
    </div>
  </section>`);
  }

  // ── Profile / Settings ─────────────────────────────────────────────────

  private stubProfile(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Profile');
    return this.wrap(t, title, `
  <nav data-block="header-nav" class="nav">
    <div class="nav-brand">${t.company}</div>
    <div class="nav-links"><a href="#">Dashboard</a><a href="#" style="color: ${t.primary}; font-weight: 600;">Profile</a><a href="#">Settings</a></div>
  </nav>
  <section data-block="form-section" style="max-width: 800px; margin: 0 auto; padding: 40px 32px;">
    <h1 style="font-size: 24px; font-weight: 700; color: ${t.text}; margin-bottom: 32px;">Profile Settings</h1>
    <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; padding: 32px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid ${t.border};">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: ${t.primary}; display: flex; align-items: center; justify-content: center; color: ${t.background}; font-size: 24px; font-weight: 700;">JD</div>
        <div><p style="font-size: 18px; font-weight: 700; color: ${t.text};">John Doe</p><p style="font-size: 13px; color: ${t.text}; opacity: 0.6;">john.doe@${t.company.toLowerCase()}.com</p></div>
        <button style="margin-left: auto; padding: 8px 20px; background: ${t.background}; color: ${t.primary}; font-size: 13px; font-weight: 600; border: 1px solid ${t.primary}; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Edit Photo</button>
      </div>
      <form onsubmit="return false">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div><label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">First Name</label><input value="John" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily};" /></div>
          <div><label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Last Name</label><input value="Doe" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily};" /></div>
        </div>
        <div style="margin-bottom: 20px;"><label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Email</label><input value="john.doe@${t.company.toLowerCase()}.com" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily};" /></div>
        <div style="margin-bottom: 20px;"><label style="display: block; font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 6px;">Role</label><input value="Senior Analyst" style="width: 100%; padding: 12px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 14px; font-family: ${t.fontFamily};" /></div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" style="padding: 12px 28px; background: ${t.background}; color: ${t.text}; font-size: 14px; font-weight: 600; border: 1px solid ${t.border}; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Cancel</button>
          <button type="submit" style="padding: 12px 28px; background: ${t.primary}; color: ${t.background}; font-size: 14px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Save Changes</button>
        </div>
      </form>
    </div>
  </section>`);
  }

  // ── Data Table ─────────────────────────────────────────────────────────

  private stubDataTable(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Data');
    const rows = [
      { id: 'AST-001', name: 'Fraud Detection Model', kind: 'Model', status: 'GA', domain: 'Risk' },
      { id: 'AST-002', name: 'Customer Score API', kind: 'API', status: 'GA', domain: 'CRM' },
      { id: 'AST-003', name: 'ETL Pipeline — Finance', kind: 'Pipeline', status: 'Beta', domain: 'Finance' },
      { id: 'AST-004', name: 'Compliance Template', kind: 'Template', status: 'GA', domain: 'Legal' },
      { id: 'AST-005', name: 'Churn Prediction', kind: 'Model', status: 'Preview', domain: 'Marketing' },
      { id: 'AST-006', name: 'Real-time Payments', kind: 'API', status: 'GA', domain: 'Payments' },
    ];
    return this.wrap(t, title, `
  <nav data-block="header-nav" class="nav">
    <div class="nav-brand">${t.company}</div>
    <div class="nav-links"><a href="#">Dashboard</a><a href="#" style="color: ${t.primary}; font-weight: 600;">Assets</a><a href="#">Reports</a></div>
  </nav>
  <section data-block="card-grid" style="max-width: 1100px; margin: 0 auto; padding: 32px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 700; color: ${t.text};">${title}</h1>
      <div style="display: flex; gap: 12px;">
        <input placeholder="Search..." style="padding: 10px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; font-size: 13px; font-family: ${t.fontFamily}; width: 240px;" />
        <button style="padding: 10px 24px; background: ${t.primary}; color: ${t.background}; font-size: 13px; font-weight: 600; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">+ Add New</button>
      </div>
    </div>
    <div style="background: ${t.background}; border: 1px solid ${t.border}; border-radius: ${t.cardRadius}; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead><tr style="background: ${t.border}20;">
          <th style="text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: ${t.text}; text-transform: uppercase; letter-spacing: 0.05em;">ID</th>
          <th style="text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: ${t.text}; text-transform: uppercase; letter-spacing: 0.05em;">Name</th>
          <th style="text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: ${t.text}; text-transform: uppercase; letter-spacing: 0.05em;">Kind</th>
          <th style="text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: ${t.text}; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
          <th style="text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: ${t.text}; text-transform: uppercase; letter-spacing: 0.05em;">Domain</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `<tr style="border-top: 1px solid ${t.border};">
            <td style="padding: 14px 16px; font-family: monospace; color: ${t.text}; opacity: 0.6;">${r.id}</td>
            <td style="padding: 14px 16px; font-weight: 600; color: ${t.primary};">${r.name}</td>
            <td style="padding: 14px 16px; color: ${t.text};">${r.kind}</td>
            <td style="padding: 14px 16px;"><span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: ${r.status === 'GA' ? '#DEF7EC' : r.status === 'Beta' ? '#FEF3C7' : `${t.border}`}; color: ${r.status === 'GA' ? '#065F46' : r.status === 'Beta' ? '#92400E' : t.text};">${r.status}</span></td>
            <td style="padding: 14px 16px; color: ${t.text}; opacity: 0.7;">${r.domain}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
      <span style="font-size: 13px; color: ${t.text}; opacity: 0.5;">Showing ${rows.length} of ${rows.length} results</span>
      <div style="display: flex; gap: 8px;">
        <button style="padding: 8px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; background: ${t.background}; font-size: 13px; color: ${t.text}; cursor: pointer; font-family: ${t.fontFamily};">Previous</button>
        <button style="padding: 8px 16px; border: 1px solid ${t.border}; border-radius: ${t.inputRadius}; background: ${t.background}; font-size: 13px; color: ${t.text}; cursor: pointer; font-family: ${t.fontFamily};">Next</button>
      </div>
    </div>
  </section>`);
  }

  // ── Landing (default) ──────────────────────────────────────────────────

  private stubLanding(t: ReturnType<StubAiProvider['extractBrandTokens']>, prompt: string): string {
    const title = this.titleFromPrompt(prompt, 'Home');
    return this.wrap(t, title, `
  <nav data-block="header-nav" class="nav">
    <div class="nav-brand">${t.company}</div>
    <div class="nav-links"><a href="#">Home</a><a href="#">Features</a><a href="#">About</a><a href="#">Contact</a></div>
  </nav>
  <section data-block="hero-section" style="padding: 80px 32px; text-align: center; background: linear-gradient(135deg, ${t.primary} 0%, ${t.secondary} 100%); color: ${t.background};">
    <h1 style="font-size: 42px; font-weight: 700; margin-bottom: 16px;">${title}</h1>
    <p style="font-size: 18px; max-width: 600px; margin: 0 auto 32px; opacity: 0.9;">Enterprise-grade AI solutions built for ${t.company}. Discover, build, and deliver with confidence.</p>
    <div style="display: flex; gap: 16px; justify-content: center;">
      <a href="#" class="btn-primary">Get Started</a>
      <a href="#" class="btn-secondary" style="border-color: ${t.background}; color: ${t.background};">Learn More</a>
    </div>
  </section>
  <section data-block="card-grid" style="padding: 64px 32px; max-width: 960px; margin: 0 auto;">
    <h2 style="font-size: 28px; font-weight: 700; color: ${t.text}; text-align: center; margin-bottom: 48px;">Why ${t.company}?</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
      <div style="text-align: center; padding: 24px;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${t.primary}15; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">🔍</div>
        <h3 style="font-size: 16px; font-weight: 700; color: ${t.text}; margin-bottom: 8px;">Discover</h3>
        <p style="font-size: 14px; color: ${t.text}; opacity: 0.7; line-height: 1.5;">Find certified AI assets across the enterprise catalog with intelligent search.</p>
      </div>
      <div style="text-align: center; padding: 24px;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${t.primary}15; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">⚡</div>
        <h3 style="font-size: 16px; font-weight: 700; color: ${t.text}; margin-bottom: 8px;">Build</h3>
        <p style="font-size: 14px; color: ${t.text}; opacity: 0.7; line-height: 1.5;">Generate brand-compliant prototypes with AI assistance and automatic validation.</p>
      </div>
      <div style="text-align: center; padding: 24px;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${t.primary}15; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">🚀</div>
        <h3 style="font-size: 16px; font-weight: 700; color: ${t.text}; margin-bottom: 8px;">Deliver</h3>
        <p style="font-size: 14px; color: ${t.text}; opacity: 0.7; line-height: 1.5;">Export, review, and track prototype submissions through the delivery pipeline.</p>
      </div>
    </div>
  </section>
  <section data-block="cta-section" style="padding: 64px 32px; background: ${t.primary}08; text-align: center;">
    <h2 style="font-size: 28px; font-weight: 700; color: ${t.text}; margin-bottom: 12px;">Ready to get started?</h2>
    <p style="font-size: 16px; color: ${t.text}; opacity: 0.6; margin-bottom: 28px;">Join teams across the enterprise using ${t.company} AI workspace.</p>
    <button style="padding: 14px 36px; background: ${t.primary}; color: ${t.background}; font-size: 15px; font-weight: 700; border: none; border-radius: ${t.btnRadius}; cursor: pointer; font-family: ${t.fontFamily};">Start Now</button>
  </section>`);
  }

  private titleFromPrompt(prompt: string, fallback: string): string {
    return prompt.slice(0, 60).replace(/[<>"]/g, '') || fallback;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
