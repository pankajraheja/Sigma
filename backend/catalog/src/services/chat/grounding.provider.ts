// ---------------------------------------------------------------------------
// Grounding Provider — abstract interface for retrieving context per module.
//
// Each module (catalog, intake, forge, etc.) implements a GroundingProvider
// that knows how to search its domain data and return relevant snippets
// for LLM grounding. The chat service resolves the correct provider based
// on the skill's groundingStrategy.
//
// retrieve() returns a GroundingPayload — ranked results plus retrieval
// metadata (mode used, result count, fallback status) for observability.
// ---------------------------------------------------------------------------

import type { ChatContext, GroundingResult, GroundingPayload } from '../../models/chat.types.js';

/**
 * GroundingProvider — interface every module must implement to participate
 * in Sigma Chat grounding. The chat orchestrator calls `retrieve()` with
 * the latest user message and page context, and expects ranked results
 * bundled with retrieval metadata.
 */
export interface GroundingProvider {
  /** Unique key — matches GroundingStrategy (e.g. 'catalog', 'requests'). */
  readonly key: string;

  /**
   * Retrieve grounding context relevant to the user's query.
   *
   * @param query      - the latest user message text
   * @param context    - ambient page context (page, entityId, filters)
   * @param maxResults - maximum number of results to return
   * @returns GroundingPayload with ranked results and retrieval metadata
   */
  retrieve(
    query: string,
    context: ChatContext,
    maxResults?: number,
  ): Promise<GroundingPayload>;
}

// ---------------------------------------------------------------------------
// Provider registry — singleton map of strategy → provider
// ---------------------------------------------------------------------------

const providers = new Map<string, GroundingProvider>();

export function registerGroundingProvider(provider: GroundingProvider): void {
  if (providers.has(provider.key)) {
    console.warn(`[SigmaChat] Grounding provider "${provider.key}" already registered — skipping.`);
    return;
  }
  providers.set(provider.key, provider);
  console.info(`[SigmaChat] Grounding provider registered: ${provider.key}`);
}

export function getGroundingProvider(key: string): GroundingProvider | undefined {
  return providers.get(key);
}
