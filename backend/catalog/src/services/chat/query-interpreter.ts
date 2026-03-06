// ---------------------------------------------------------------------------
// Query Interpreter — produces a structured "search plan" BEFORE retrieval.
//
// Sits between the raw user message and the grounding provider. Detects:
//   • Intent   — search, compare, summarize, explain, recommend, detail, filter
//   • Scope    — detail (current asset page) vs discovery (catalog-wide)
//   • Filters  — asset_kind, domain, publication_status, compliance_tag, etc.
//   • Keywords — cleaned terms for semantic / full-text search
//   • Retrieval mode — semantic, structured, hybrid, detail, fallback
//
// The grounding provider receives the `QueryInterpretation` plan and uses it
// directly, instead of re-classifying the query internally.
// ---------------------------------------------------------------------------

import type {
  ChatContext,
  QueryIntent,
  QueryScope,
  QueryInterpretation,
  RetrievalMode,
} from '../../models/chat.types.js';

// ── Stop words for keyword extraction ──────────────────────────────────────

const STOP_WORDS = new Set([
  // Common English stop words
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'them', 'his', 'her', 'its', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
  'show', 'find', 'list', 'get', 'give', 'tell', 'search', 'look',
  'for', 'of', 'in', 'on', 'at', 'to', 'from', 'with', 'by', 'about',
  'all', 'any', 'some', 'each', 'every', 'both', 'no', 'not',
  'and', 'or', 'but', 'if', 'so', 'than', 'too', 'very',
  'how', 'why', 'when', 'where', 'please', 'help', 'want', 'like',
  // System meta-terms (refer to Sigma itself, not to asset data)
  'catalog', 'navigator', 'sigma', 'asset', 'assets', 'workspace',
  'enterprise', 'platform', 'system', 'module', 'chat', 'ai',
]);

// ── Known filter values ────────────────────────────────────────────────────

const ASSET_KINDS = new Set([
  'pipeline', 'dataset', 'model', 'dashboard', 'template', 'api', 'report',
]);

const DOMAINS = new Set([
  'risk_compliance', 'legal_tax', 'banking_finance', 'operations',
  'ai_data_services', 'advisory', 'audit', 'tax',
]);

const STATUSES = new Set(['ga', 'preview', 'draft', 'deprecated', 'retired']);

const COMPLIANCE_TAGS = new Set([
  'sox', 'gdpr', 'ccpa', 'iso-27001', 'aml', 'csrd', 'gri', 'hipaa',
]);

// Countries / data residency regions
const COUNTRIES = new Set([
  'us', 'usa', 'united states', 'uk', 'united kingdom', 'eu', 'europe',
  'india', 'germany', 'france', 'canada', 'australia', 'japan',
  'brazil', 'singapore', 'ireland', 'netherlands', 'switzerland',
]);

// Operating companies / OpCos
const OPCOS = new Set([
  'kpmg us', 'kpmg uk', 'kpmg india', 'kpmg germany', 'kpmg australia',
  'kpmg canada', 'kpmg japan', 'kpmg global',
]);

// Function groups
const FUNCTION_GROUPS = new Set([
  'audit', 'tax', 'advisory', 'deal advisory', 'consulting',
  'risk consulting', 'management consulting', 'technology consulting',
]);

// Industry sectors
const INDUSTRY_SECTORS = new Set([
  'financial services', 'banking', 'insurance', 'healthcare', 'life sciences',
  'energy', 'utilities', 'manufacturing', 'retail', 'consumer',
  'technology', 'media', 'telecommunications', 'government', 'public sector',
  'real estate', 'infrastructure', 'automotive', 'transportation',
]);

// Service offerings
const SERVICE_OFFERINGS = new Set([
  'data analytics', 'cloud transformation', 'cyber security', 'esg',
  'regulatory compliance', 'digital transformation', 'ai ml',
  'process mining', 'rpa', 'managed services',
]);

// ── Regex patterns ─────────────────────────────────────────────────────────

/** Explicit filter syntax: key:value or key=value */
const FILTER_SYNTAX_REGEX =
  /\b(kind|type|asset_kind|domain|status|publication_status|compliance|tag|residency|data_residency|pii|contains_pii|country|opco|function_group|industry|sector|service_offering)\s*[:=]\s*(\S+)/gi;

/** Structured-intent signals */
const STRUCTURED_PATTERNS: RegExp[] = [
  /\b(?:kind|type|asset_kind)\s*[:=]\s*\w+/i,
  /\b(?:domain)\s*[:=]\s*\w+/i,
  /\b(?:status|publication_status)\s*[:=]\s*\w+/i,
  /\b(?:compliance|tag)\s*[:=]\s*\w+/i,
  /\b(?:residency|data_residency)\s*[:=]\s*\w+/i,
  /\b(?:pii|contains_pii)\s*[:=]\s*(?:true|false|yes|no)/i,
  /\b(?:country|opco|function_group|industry|sector|service_offering)\s*[:=]\s*\w+/i,
];

/** Intent-specific patterns — order matters for scoring */
const INTENT_PATTERNS: { intent: QueryIntent; patterns: RegExp[] }[] = [
  {
    intent: 'compare',
    patterns: [
      /\b(?:compare|versus|vs\.?|difference|between|differ|contrast)\b/i,
      /\bside[- ]by[- ]side\b/i,
      /\b(?:how does .+ compare|what.s the difference)\b/i,
    ],
  },
  {
    intent: 'recommend',
    patterns: [
      /\b(?:recommend|suggest|best|top|which (?:one|should)|ideal|suited)\b/i,
      /\b(?:what should i use|what.s the best)\b/i,
    ],
  },
  {
    intent: 'explain',
    patterns: [
      /\b(?:explain|what is|what are|define|describe|how does|how do|tell me about|walk me through)\b/i,
      /\b(?:what does .+ mean|meaning of)\b/i,
    ],
  },
  {
    intent: 'summarize',
    patterns: [
      /\b(?:summarize|summary|overview|brief|tl;?dr|high[- ]level|at a glance)\b/i,
      /\b(?:give me a summary|quick overview)\b/i,
    ],
  },
  {
    intent: 'filter',
    patterns: [
      /\b(?:filter|narrow|only|just|exclusively|with status|with kind)\b/i,
    ],
  },
  {
    intent: 'search',
    patterns: [
      /\b(?:show|find|list|get|search|look for|display|browse|discover)\b/i,
      /\?$/,
    ],
  },
];

/** Semantic/NL signals (used for retrieval mode scoring) */
const SEMANTIC_PATTERNS: RegExp[] = [
  /\b(?:show|find|list|get|search|look for|display)\b/i,
  /\b(?:compare|versus|vs|difference|between)\b/i,
  /\b(?:what|which|how|why|where|who|tell me|explain)\b/i,
  /\b(?:similar|related|relevant|best|top|most|latest|recent)\b/i,
  /\b(?:help|recommend|suggest|overview)\b/i,
  /\?$/,
];

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Interpret a user query and ambient context into a structured search plan.
 *
 * Decision cascade:
 *   1. Scope detection    — detail (entityId present) or discovery
 *   2. Intent detection   — compare, recommend, explain, summarize, filter, search
 *   3. Filter extraction  — explicit syntax (kind:pipeline) + inferred values
 *   4. Keyword extraction — cleaned terms for full-text search
 *   5. Retrieval mode     — detail, structured, semantic, or hybrid
 */
export function interpretQuery(
  query: string,
  context: ChatContext,
): QueryInterpretation {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // ── 1. Scope detection ─────────────────────────────────────────────────
  const scope = detectScope(lower, context);
  const targetEntityId = scope === 'detail' ? context.entityId : undefined;

  // ── 2. Intent detection ────────────────────────────────────────────────
  const { intent, confidence: intentConf } = detectIntent(lower, scope);

  // ── 3. Filter extraction ───────────────────────────────────────────────
  const explicitFilters = parseExplicitFilters(lower);
  const inferredFilters = inferFiltersFromQuery(lower);
  const filters = { ...inferredFilters, ...explicitFilters }; // explicit wins

  const assetKind = filters['asset_kind'] ?? undefined;

  // ── 4. Keyword extraction ──────────────────────────────────────────────
  const keywords = extractKeywords(trimmed);

  // ── 5. Retrieval mode ──────────────────────────────────────────────────
  const retrievalMode = chooseRetrievalMode(scope, intent, filters, keywords, lower);

  // ── 6. Confidence ──────────────────────────────────────────────────────
  const hasFilters = Object.keys(filters).length > 0;
  const confidence = computeConfidence(intentConf, hasFilters, keywords.length > 0);

  const plan: QueryInterpretation = {
    intent,
    scope,
    retrievalMode,
    filters,
    keywords,
    assetKind,
    targetEntityId,
    confidence,
  };

  console.info(
    `[QueryInterpreter] Plan: intent=${plan.intent} scope=${plan.scope} ` +
    `mode=${plan.retrievalMode} filters=${JSON.stringify(plan.filters)} ` +
    `keywords="${plan.keywords}" confidence=${plan.confidence.toFixed(2)}`,
  );

  return plan;
}

// ---------------------------------------------------------------------------
// Scope detection
// ---------------------------------------------------------------------------

function detectScope(query: string, context: ChatContext): QueryScope {
  // Explicit entity → detail scope
  if (context.entityId) return 'detail';

  // Detail-page language without entityId → still discovery
  const detailPatterns = [
    /\bthis asset\b/i,
    /\bcurrent asset\b/i,
    /\babout this\b/i,
    /\bthis one\b/i,
  ];
  // If user says "this asset" but we don't have an entityId, treat as discovery
  // (possibly the user is on a listing page)
  for (const p of detailPatterns) {
    if (p.test(query) && context.entityId) return 'detail';
  }

  return 'discovery';
}

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------

function detectIntent(
  query: string,
  scope: QueryScope,
): { intent: QueryIntent; confidence: number } {
  // Detail scope defaults to 'detail' intent unless query overrides
  if (scope === 'detail') {
    // Check if the user is asking something specific even on a detail page
    for (const { intent, patterns } of INTENT_PATTERNS) {
      for (const p of patterns) {
        if (p.test(query)) return { intent, confidence: 0.85 };
      }
    }
    return { intent: 'detail', confidence: 0.9 };
  }

  // Score each intent
  const scores = new Map<QueryIntent, number>();
  for (const { intent, patterns } of INTENT_PATTERNS) {
    let score = 0;
    for (const p of patterns) {
      if (p.test(query)) score += 1;
    }
    if (score > 0) scores.set(intent, score);
  }

  if (scores.size === 0) {
    // No patterns matched — default to search
    return { intent: 'search', confidence: 0.5 };
  }

  // Pick the highest-scoring intent
  let bestIntent: QueryIntent = 'search';
  let bestScore = 0;
  for (const [intent, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  const confidence = Math.min(0.95, 0.6 + bestScore * 0.15);
  return { intent: bestIntent, confidence };
}

// ---------------------------------------------------------------------------
// Filter extraction
// ---------------------------------------------------------------------------

/**
 * Parse explicit filter syntax: "kind:pipeline domain:tax status:ga"
 */
function parseExplicitFilters(query: string): Record<string, string> {
  const filters: Record<string, string> = {};
  // Reset lastIndex since we're using global flag
  FILTER_SYNTAX_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FILTER_SYNTAX_REGEX.exec(query)) !== null) {
    const key = normalizeFilterKey(match[1]!);
    const value = match[2]!.replace(/[,;'"]/g, '');
    if (key) filters[key] = value;
  }
  return filters;
}

/**
 * Infer filter fields from free text that mentions known values.
 * E.g. "pipelines" → asset_kind=pipeline, "banking" → domain=banking_finance
 */
function inferFiltersFromQuery(query: string): Record<string, string> {
  const filters: Record<string, string> = {};
  const words = query.split(/\s+/);

  // ── Asset kind ─────────────────────────────────────────────────────────
  for (const word of words) {
    const cleaned = word.replace(/s$/, ''); // depluralize
    if (ASSET_KINDS.has(cleaned) && !filters['asset_kind']) {
      filters['asset_kind'] = cleaned;
    }
    if (STATUSES.has(cleaned) && !filters['publication_status']) {
      filters['publication_status'] = cleaned;
    }
    if (COMPLIANCE_TAGS.has(cleaned.toLowerCase()) && !filters['compliance_tag']) {
      filters['compliance_tag'] = cleaned.toLowerCase();
    }
  }

  // ── Domain (including compound names) ──────────────────────────────────
  if (!filters['domain']) {
    for (const d of DOMAINS) {
      if (query.includes(d)) {
        filters['domain'] = d;
        break;
      }
    }
    // Partial matches for compound domain names
    if (!filters['domain']) {
      if (query.includes('risk') || query.includes('compliance')) {
        filters['domain'] = 'risk_compliance';
      } else if (query.includes('banking') || query.includes('finance')) {
        filters['domain'] = 'banking_finance';
      } else if (query.includes('legal') || query.includes('tax')) {
        filters['domain'] = 'legal_tax';
      } else if (/\bai\b/.test(query) || query.includes('data service')) {
        filters['domain'] = 'ai_data_services';
      }
    }
  }

  // ── Country / data residency ───────────────────────────────────────────
  if (!filters['country']) {
    for (const c of COUNTRIES) {
      if (query.includes(c)) {
        filters['country'] = c;
        break;
      }
    }
  }

  // ── OpCo ───────────────────────────────────────────────────────────────
  if (!filters['opco']) {
    for (const o of OPCOS) {
      if (query.includes(o)) {
        filters['opco'] = o;
        break;
      }
    }
  }

  // ── Function group ─────────────────────────────────────────────────────
  if (!filters['function_group']) {
    for (const fg of FUNCTION_GROUPS) {
      if (query.includes(fg)) {
        filters['function_group'] = fg;
        break;
      }
    }
  }

  // ── Industry sector ────────────────────────────────────────────────────
  if (!filters['industry_sector']) {
    for (const sector of INDUSTRY_SECTORS) {
      if (query.includes(sector)) {
        filters['industry_sector'] = sector;
        break;
      }
    }
  }

  // ── Service offering ───────────────────────────────────────────────────
  if (!filters['service_offering']) {
    for (const svc of SERVICE_OFFERINGS) {
      if (query.includes(svc)) {
        filters['service_offering'] = svc;
        break;
      }
    }
  }

  // ── PII flag ───────────────────────────────────────────────────────────
  if (/\bpii\b/.test(query)) {
    filters['contains_pii'] = 'true';
  }

  return filters;
}

function normalizeFilterKey(raw: string): string | null {
  const r = raw.toLowerCase();
  if (r === 'kind' || r === 'type' || r === 'asset_kind') return 'asset_kind';
  if (r === 'domain') return 'domain';
  if (r === 'status' || r === 'publication_status') return 'publication_status';
  if (r === 'compliance' || r === 'tag') return 'compliance_tag';
  if (r === 'residency' || r === 'data_residency') return 'data_residency';
  if (r === 'pii' || r === 'contains_pii') return 'contains_pii';
  if (r === 'country') return 'country';
  if (r === 'opco') return 'opco';
  if (r === 'function_group') return 'function_group';
  if (r === 'industry' || r === 'sector') return 'industry_sector';
  if (r === 'service_offering') return 'service_offering';
  return null;
}

// ---------------------------------------------------------------------------
// Keyword extraction
// ---------------------------------------------------------------------------

/**
 * Extract meaningful keywords after removing stop words, filter syntax,
 * and system meta-terms.
 */
export function extractKeywords(query: string): string {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')         // strip punctuation
    .replace(/\b\w+\s*[:=]\s*\S+/g, '') // strip key:value pairs
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return words.length > 0 ? words.join(' ') : query.trim();
}

// ---------------------------------------------------------------------------
// Retrieval mode selection
// ---------------------------------------------------------------------------

function chooseRetrievalMode(
  scope: QueryScope,
  intent: QueryIntent,
  filters: Record<string, string>,
  keywords: string,
  query: string,
): RetrievalMode {
  // Detail scope always uses detail mode
  if (scope === 'detail') return 'detail';

  // Filter intent with explicit filters → structured
  if (intent === 'filter') return 'structured';

  const hasFilters = Object.keys(filters).length > 0;
  const hasKeywords = keywords.length > 0;

  // Pure filter queries (short, only known values, no NL glue)
  if (hasFilters && !hasNLSignals(query)) return 'structured';

  // Filters + NL text → hybrid (text search within filtered subset)
  if (hasFilters && hasKeywords && hasNLSignals(query)) return 'hybrid';

  // Structured filter syntax detected
  let structuredScore = 0;
  for (const p of STRUCTURED_PATTERNS) {
    if (p.test(query)) structuredScore += 1;
  }
  if (structuredScore >= 2) return 'structured';

  // Default: semantic for NL queries
  return 'semantic';
}

function hasNLSignals(query: string): boolean {
  for (const p of SEMANTIC_PATTERNS) {
    if (p.test(query)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Confidence computation
// ---------------------------------------------------------------------------

function computeConfidence(
  intentConfidence: number,
  hasFilters: boolean,
  hasKeywords: boolean,
): number {
  let conf = intentConfidence;
  // Boost if we extracted meaningful signals
  if (hasFilters) conf = Math.min(1.0, conf + 0.1);
  if (hasKeywords) conf = Math.min(1.0, conf + 0.05);
  return Math.round(conf * 100) / 100;
}
