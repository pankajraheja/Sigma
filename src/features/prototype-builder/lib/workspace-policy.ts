// ---------------------------------------------------------------------------
// Workspace Policy — taxonomy-aware block filtering configuration.
//
// Defines which approved blocks are available in a given workspace context.
// Phase 1: static presets keyed by workspace type and optional page type.
// Future: admin-managed policies loaded from the backend, RBAC integration.
//
// This is a pure data/utility layer — no React, no side effects.
// ---------------------------------------------------------------------------

import type { ApprovedBlock, BlockCategory } from './block-registry'
import { filterBlocksByPolicy } from './block-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Workspace type determines the default block palette */
export type WorkspaceType =
  | 'marketing'    // landing pages, campaigns
  | 'product'      // SaaS dashboards, app screens
  | 'internal'     // internal tools, admin panels
  | 'unrestricted' // all blocks allowed (default)

/** Page type can further narrow available blocks */
export type PageType =
  | 'landing'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'settings'
  | 'form'
  | 'content'
  | 'general'

/** A workspace policy defines which blocks are allowed */
export interface WorkspacePolicy {
  /** Human-readable policy name */
  name: string
  /** Workspace type this policy targets */
  workspaceType: WorkspaceType
  /** Allowed block IDs — null means all blocks allowed */
  allowedBlockIds: string[] | null
  /** Allowed categories — null means all categories allowed */
  allowedCategories: BlockCategory[] | null
  /** Per-page-type overrides (optional, narrows further) */
  pageOverrides: Partial<Record<PageType, string[]>>
}

// ---------------------------------------------------------------------------
// Phase 1 presets — static policies keyed by workspace type
// ---------------------------------------------------------------------------

const ALL_BLOCK_IDS = [
  'header-nav',
  'hero-section',
  'two-col-content',
  'card-grid',
  'cta-section',
  'form-section',
  'footer',
]

export const WORKSPACE_POLICIES: Record<WorkspaceType, WorkspacePolicy> = {
  unrestricted: {
    name: 'Unrestricted',
    workspaceType: 'unrestricted',
    allowedBlockIds: null,
    allowedCategories: null,
    pageOverrides: {},
  },

  marketing: {
    name: 'Marketing Site',
    workspaceType: 'marketing',
    allowedBlockIds: [
      'header-nav',
      'hero-section',
      'two-col-content',
      'card-grid',
      'cta-section',
      'footer',
    ],
    allowedCategories: ['navigation', 'hero', 'content', 'conversion', 'footer'],
    pageOverrides: {
      landing: ['header-nav', 'hero-section', 'two-col-content', 'card-grid', 'cta-section', 'footer'],
      form: ['header-nav', 'form-section', 'cta-section', 'footer'],
    },
  },

  product: {
    name: 'Product / App',
    workspaceType: 'product',
    allowedBlockIds: [
      'header-nav',
      'card-grid',
      'two-col-content',
      'form-section',
      'footer',
    ],
    allowedCategories: ['navigation', 'content', 'form', 'footer'],
    pageOverrides: {
      login: ['form-section'],
      signup: ['form-section'],
      dashboard: ['header-nav', 'card-grid', 'two-col-content', 'footer'],
      settings: ['header-nav', 'form-section', 'footer'],
    },
  },

  internal: {
    name: 'Internal Tool',
    workspaceType: 'internal',
    allowedBlockIds: [
      'header-nav',
      'card-grid',
      'two-col-content',
      'form-section',
      'footer',
    ],
    allowedCategories: ['navigation', 'content', 'form', 'footer'],
    pageOverrides: {
      form: ['header-nav', 'form-section', 'footer'],
      dashboard: ['header-nav', 'card-grid', 'two-col-content', 'footer'],
    },
  },
}

// ---------------------------------------------------------------------------
// Resolution — determine allowed blocks for a workspace + page context
// ---------------------------------------------------------------------------

export interface BlockPolicyContext {
  workspaceType: WorkspaceType
  pageType?: PageType
  /** Future: admin-provided override from backend config */
  adminAllowedBlockIds?: string[] | null
}

/**
 * Resolve the allowed block IDs for a given context.
 *
 * Priority (most restrictive wins):
 * 1. adminAllowedBlockIds (if provided, intersect with policy)
 * 2. pageOverrides (if matching page type exists)
 * 3. policy.allowedBlockIds (workspace-level default)
 * 4. null (all blocks allowed)
 */
export function resolveAllowedBlockIds(ctx: BlockPolicyContext): string[] | null {
  const policy = WORKSPACE_POLICIES[ctx.workspaceType]

  // Start with workspace-level allowed blocks
  let allowed: string[] | null = policy.allowedBlockIds

  // Narrow by page type override if available
  if (ctx.pageType && policy.pageOverrides[ctx.pageType]) {
    const pageAllowed = policy.pageOverrides[ctx.pageType]!
    allowed = allowed
      ? allowed.filter((id) => pageAllowed.includes(id))
      : pageAllowed
  }

  // Intersect with admin override if provided
  if (ctx.adminAllowedBlockIds !== undefined && ctx.adminAllowedBlockIds !== null) {
    const adminSet = new Set(ctx.adminAllowedBlockIds)
    allowed = allowed
      ? allowed.filter((id) => adminSet.has(id))
      : ALL_BLOCK_IDS.filter((id) => adminSet.has(id))
  }

  return allowed
}

/**
 * Get the filtered approved blocks for a given context.
 * Convenience wrapper that resolves IDs then filters the registry.
 */
export function getBlocksForContext(ctx: BlockPolicyContext): ApprovedBlock[] {
  const allowedIds = resolveAllowedBlockIds(ctx)
  return filterBlocksByPolicy(allowedIds)
}

// ---------------------------------------------------------------------------
// Page type detection — infer page type from route/title
// ---------------------------------------------------------------------------

const PAGE_TYPE_PATTERNS: Array<{ pattern: RegExp; type: PageType }> = [
  { pattern: /^\/?(login|sign-?in)$/i, type: 'login' },
  { pattern: /^\/?(signup|sign-?up|register)$/i, type: 'signup' },
  { pattern: /^\/?(dashboard|overview|analytics)$/i, type: 'dashboard' },
  { pattern: /^\/?(settings|preferences|config)$/i, type: 'settings' },
  { pattern: /^\/?(contact|support|feedback)$/i, type: 'form' },
  { pattern: /^\/?$/i, type: 'landing' },
  { pattern: /^\/?(home|landing)$/i, type: 'landing' },
  { pattern: /^\/?(about|team|story|blog|docs|faq|help)$/i, type: 'content' },
]

/**
 * Infer page type from route path or page title.
 * Falls back to 'general' if no pattern matches.
 */
export function inferPageType(route: string, title?: string): PageType {
  const normalized = route.replace(/^\/+/, '/').toLowerCase()

  for (const { pattern, type } of PAGE_TYPE_PATTERNS) {
    if (pattern.test(normalized)) return type
  }

  // Try matching against title as fallback
  if (title) {
    const lowerTitle = title.toLowerCase()
    for (const { pattern, type } of PAGE_TYPE_PATTERNS) {
      if (pattern.test(lowerTitle)) return type
    }
  }

  return 'general'
}
