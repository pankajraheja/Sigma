// ---------------------------------------------------------------------------
// Sigma Chat types — shared type definitions for the reusable chat capability.
//
// API contract:
//   POST /api/chat/query
//   Request  → ChatQueryRequest  { skillKey, moduleKey, message, context }
//   Response → ChatQueryResponse { answer, references[], suggestions[], _meta? }
// ---------------------------------------------------------------------------

import type { ModuleId } from './modules'

// ── Chat skill config ────────────────────────────────────────────────────────

/** Grounding strategies — determines what data source(s) the LLM can query. */
export type GroundingStrategy =
  | 'catalog'       // AI Navigator — search catalog assets
  | 'requests'      // Request Hub — search intake requests
  | 'agents'        // Agent Forge — search agents, skills, connectors
  | 'governance'    // Vizier — governance policies, evaluations
  | 'custom'        // Module-supplied custom grounding

/**
 * SigmaChatSkill — configuration that a module registers to enable
 * Sigma Chat on its pages. The skill controls the system prompt,
 * grounding scope, allowed actions, and suggested prompts.
 */
export interface SigmaChatSkill {
  /** Unique key for this skill — e.g. 'catalog-discovery-skill' */
  key: string
  /** Human-readable name shown in the chat header */
  displayName: string
  /** Short description shown as subtitle or tooltip */
  description: string
  /** Module that owns this skill */
  moduleKey: ModuleId
  /** System prompt sent to the LLM to set behaviour boundaries */
  systemPrompt: string
  /** Which grounding strategy to use for context retrieval */
  groundingStrategy: GroundingStrategy
  /** Data sources the skill is allowed to query */
  allowedDataSources: string[]
  /** Actions the skill is permitted to invoke (e.g. 'search', 'compare') */
  allowedActions: string[]
  /** Optional starter prompts shown to the user in an empty chat */
  suggestedPrompts?: string[]
}

// ── Page / query context ─────────────────────────────────────────────────────

/**
 * ChatContext — ambient context the hosting page passes to Sigma Chat.
 * Includes the active page, entity being viewed, and any active filters
 * so the backend can narrow grounding queries.
 */
export interface ChatContext {
  /** Current route / page path */
  page: string
  /** Active entity id (e.g. asset id on a detail page) */
  entityId?: string
  /** Active filters or search term — forwarded to the grounding provider */
  filters?: Record<string, string | string[] | boolean | number>
}

// ── API request / response ──────────────────────────────────────────────────

export interface ChatQueryRequest {
  /** Which skill to use */
  skillKey: string
  /** Module key (e.g. 'catalog') */
  moduleKey: string
  /** The user's message — single turn */
  message: string
  /** Ambient page context */
  context: ChatContext
}

export interface ChatReference {
  /** Asset / entity id */
  id: string
  /** Human-readable name */
  name: string
  /** Asset kind or entity type */
  kind: string
  /** Deep-link inside the UI */
  href: string
}

/**
 * Internal retrieval metadata — returned by the backend for
 * debugging / logging. Not intended for end-user display.
 */
export interface RetrievalMetadata {
  retrievalModeUsed: string
  resultCount: number
  fallbackUsed: boolean
  initialModeAttempted?: string
  retrievalTimeMs?: number
  groundingProvider?: string
}

export interface ChatQueryResponse {
  /** The LLM-generated answer in markdown */
  answer: string
  /** Structured references to catalog assets cited in the answer */
  references: ChatReference[]
  /** Follow-up prompts the user can click */
  suggestions: string[]
  /** Internal debug / logging metadata — not for end-user display */
  _meta?: RetrievalMetadata
}

// ── Display-level message (internal to the chat UI, not sent to the API) ────

export type ChatRole = 'user' | 'assistant'

export interface ChatDisplayMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: number
  /** References attached by the backend for this assistant turn */
  references?: ChatReference[]
  /** Follow-up suggestions attached to this assistant turn */
  suggestions?: string[]
  /** Retrieval metadata for this assistant turn (debug only) */
  _meta?: RetrievalMetadata
}
