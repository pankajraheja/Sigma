// ---------------------------------------------------------------------------
// Sigma Chat — shared types for the backend chat capability.
//
// API contract:
//   POST /api/chat/query
//   Request  → ChatQueryRequest  { skillKey, moduleKey, message, context }
//   Response → ChatQueryResponse { answer, references[], suggestions[], _meta? }
// ---------------------------------------------------------------------------

// ── Grounding strategy ─────────────────────────────────────────────────────

export type GroundingStrategy =
  | 'catalog'
  | 'requests'
  | 'agents'
  | 'governance'
  | 'custom';

// ── Retrieval mode — how the grounding provider sourced its results ─────────

export type RetrievalMode =
  | 'semantic'       // NL / exploratory → keyword-extracted full-text search
  | 'structured'     // Exact / filter-like → direct DB filter query
  | 'hybrid'         // Combined semantic + structured (filters + text)
  | 'detail'         // Entity detail page → fetch by ID + similar
  | 'fallback'       // Primary search returned nothing → latest GA assets
  | 'none';          // No retrieval performed (e.g. grounding provider missing)

// ── Query interpretation — structured search plan produced BEFORE retrieval ─

/** What the user wants to accomplish. */
export type QueryIntent =
  | 'search'         // General discovery / listing
  | 'compare'        // Side-by-side comparison of two or more assets
  | 'summarize'      // High-level summary of one or more assets
  | 'explain'        // Detailed explanation of a concept or asset
  | 'recommend'      // Suggestion / best-fit recommendation
  | 'detail'         // Drill into a specific asset
  | 'filter';        // Pure filter / faceted narrowing

/** Whether the user is asking about a specific asset or the catalog at large. */
export type QueryScope = 'detail' | 'discovery';

/**
 * The output of the query interpreter — a structured "search plan" that
 * the grounding provider consumes instead of doing its own classification.
 */
export interface QueryInterpretation {
  /** Detected user intent */
  intent: QueryIntent;
  /** Are we on an asset detail page or doing general discovery? */
  scope: QueryScope;
  /** Which retrieval strategy the grounding provider should use */
  retrievalMode: RetrievalMode;
  /** Extracted column-level filters (asset_kind, domain, publication_status, …) */
  filters: Record<string, string>;
  /** Cleaned keywords for semantic / full-text search */
  keywords: string;
  /** Specific asset kind mentioned in the query, if any */
  assetKind?: string;
  /** Entity id when scope is 'detail' */
  targetEntityId?: string;
  /** 0-1 confidence score for the classification */
  confidence: number;
}

/**
 * Internal metadata about how retrieval was performed.
 * Attached to the response as `_meta` for debugging / logging.
 * Not intended for end-user display.
 */
export interface RetrievalMetadata {
  /** Which retrieval strategy was ultimately used */
  retrievalModeUsed: RetrievalMode;
  /** Number of grounding results returned to the LLM */
  resultCount: number;
  /** Whether the provider fell back from a higher-priority strategy */
  fallbackUsed: boolean;
  /** Optional: the initial mode attempted before fallback */
  initialModeAttempted?: RetrievalMode;
  /** Elapsed time (ms) for the retrieval step */
  retrievalTimeMs?: number;
  /** The provider that performed the retrieval */
  groundingProvider?: string;
}

// ── Chat skill config ──────────────────────────────────────────────────────

export interface ChatSkillConfig {
  key: string;
  displayName: string;
  description: string;
  moduleKey: string;
  systemPrompt: string;
  groundingStrategy: GroundingStrategy;
  allowedDataSources: string[];
  allowedActions: string[];
}

// ── Grounding (internal — never exposed to the client) ─────────────────────

export interface GroundingResult {
  sourceId: string;
  title: string;
  snippet: string;
  score: number;
  link?: string;
}

/**
 * The return value from a grounding provider's `retrieve()` method.
 * Bundles the ranked results with retrieval metadata for observability.
 */
export interface GroundingPayload {
  results: GroundingResult[];
  metadata: RetrievalMetadata;
}

// ── Page / query context ───────────────────────────────────────────────────

export interface ChatContext {
  /** Current page path — e.g. /catalog/discovery */
  page: string;
  /** Active entity id — e.g. asset id on a detail page */
  entityId?: string;
  /** Active search filters forwarded to the grounding provider */
  filters?: Record<string, string | string[] | boolean | number>;
}

// ── API request / response — the only shapes the client ever sees ──────────

export interface ChatQueryRequest {
  /** Which skill to use (e.g. 'catalog-discovery-skill') */
  skillKey: string;
  /** Module key (e.g. 'catalog') */
  moduleKey: string;
  /** The user's message — single turn, not the full history */
  message: string;
  /** Ambient page context */
  context: ChatContext;
}

export interface ChatReference {
  /** Asset / entity id */
  id: string;
  /** Human-readable name */
  name: string;
  /** Asset kind or entity type */
  kind: string;
  /** Deep-link inside the UI */
  href: string;
}

export interface ChatQueryResponse {
  /** The LLM-generated answer in markdown */
  answer: string;
  /** Structured references to catalog assets cited in the answer */
  references: ChatReference[];
  /** Follow-up prompts the user can click */
  suggestions: string[];
  /** Internal debug / logging metadata — not for end-user display */
  _meta?: RetrievalMetadata;
}
