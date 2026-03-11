// ---------------------------------------------------------------------------
// Intent Interpreter — classifies chat prompts into workspace actions.
//
// Pure functions. No React, no side effects, no provider awareness.
// Runs on the client before and after generation to decide:
//   1. What to send to the API (which page's code, what prompt)
//   2. How to mutate workspace state with the result
//
// Action types:
//   update_page    — edit the target page in place (default)
//   create_page    — add a single new page to the workspace
//   create_multi   — add multiple new pages
// ---------------------------------------------------------------------------

import type { PrototypePage } from '../types'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type IntentAction =
  | { type: 'update_page'; targetPageId: string; sendCurrentCode: boolean }
  | { type: 'create_page'; title: string; route: string }
  | { type: 'create_multi'; pages: Array<{ title: string; route: string }> }

export interface IntentContext {
  prompt: string
  selectedPageId: string
  pages: PrototypePage[]
}

// ---------------------------------------------------------------------------
// Page keyword map — shared between create detection and page targeting
// ---------------------------------------------------------------------------

const PAGE_KEYWORDS: Array<{ kw: string; title: string; route: string }> = [
  { kw: 'home', title: 'Home', route: '/' },
  { kw: 'landing', title: 'Landing', route: '/' },
  { kw: 'login', title: 'Login', route: '/login' },
  { kw: 'sign in', title: 'Login', route: '/login' },
  { kw: 'signin', title: 'Login', route: '/login' },
  { kw: 'signup', title: 'Sign Up', route: '/signup' },
  { kw: 'sign up', title: 'Sign Up', route: '/signup' },
  { kw: 'register', title: 'Register', route: '/register' },
  { kw: 'dashboard', title: 'Dashboard', route: '/dashboard' },
  { kw: 'analytics', title: 'Analytics', route: '/analytics' },
  { kw: 'overview', title: 'Overview', route: '/overview' },
  { kw: 'pricing', title: 'Pricing', route: '/pricing' },
  { kw: 'contact', title: 'Contact', route: '/contact' },
  { kw: 'support', title: 'Support', route: '/support' },
  { kw: 'help', title: 'Help', route: '/help' },
  { kw: 'profile', title: 'Profile', route: '/profile' },
  { kw: 'settings', title: 'Settings', route: '/settings' },
  { kw: 'account', title: 'Account', route: '/account' },
  { kw: 'about', title: 'About', route: '/about' },
  { kw: 'table', title: 'Data Table', route: '/data' },
]

// ---------------------------------------------------------------------------
// Update-intent verbs — signal the user wants to modify, not create
// ---------------------------------------------------------------------------

const UPDATE_VERBS = [
  'update', 'change', 'modify', 'edit', 'fix', 'adjust', 'tweak',
  'improve', 'refine', 'revise', 'rework', 'redesign', 'redo',
  'make it', 'make the', 'make this',
  'replace the', 'swap the', 'move the', 'remove the', 'delete the',
  'add a section', 'add a button', 'add a header', 'add a footer',
  'add more', 'add an', 'add the',
]

// ---------------------------------------------------------------------------
// Create-intent verbs — signal the user wants a new page
// ---------------------------------------------------------------------------

const CREATE_VERBS = [
  'create', 'generate', 'build', 'make a', 'make me a',
  'add a page', 'add page', 'new page',
  'add a new', 'create a new',
]

// ---------------------------------------------------------------------------
// Multi-page patterns
// ---------------------------------------------------------------------------

const MULTI_PAGE_PATTERNS = [
  /(\d+)[\s-]*page/i,
  /multi[\s-]*page/i,
  /pages?\s*:\s*/i,
]

// ---------------------------------------------------------------------------
// Ordinal page references — "first page", "second page", "page 2", etc.
// ---------------------------------------------------------------------------

const ORDINALS: Array<{ pattern: RegExp; index: number }> = [
  { pattern: /\b(?:first|1st)\s+page\b/i, index: 0 },
  { pattern: /\b(?:second|2nd)\s+page\b/i, index: 1 },
  { pattern: /\b(?:third|3rd)\s+page\b/i, index: 2 },
  { pattern: /\b(?:fourth|4th)\s+page\b/i, index: 3 },
  { pattern: /\b(?:fifth|5th)\s+page\b/i, index: 4 },
  { pattern: /\bpage\s+(\d+)\b/i, index: -1 }, // dynamic — parsed at match time
]

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function interpretIntent(ctx: IntentContext): IntentAction {
  const { prompt, selectedPageId, pages } = ctx
  const lower = prompt.toLowerCase().trim()

  // ── 1. Multi-page detection ─────────────────────────────────────────────
  const multiResult = detectMultiPage(lower)
  if (multiResult) {
    return { type: 'create_multi', pages: multiResult }
  }

  // ── 2. Explicit update signals ──────────────────────────────────────────
  const isUpdate = UPDATE_VERBS.some((v) => lower.startsWith(v) || lower.includes(v))
  if (isUpdate) {
    const target = resolveTargetPage(lower, selectedPageId, pages)
    return { type: 'update_page', targetPageId: target, sendCurrentCode: true }
  }

  // ── 3. Explicit create signals ──────────────────────────────────────────
  const isCreate = CREATE_VERBS.some((v) => lower.startsWith(v))
  if (isCreate) {
    // Does the prompt name a page type that already exists?
    const namedPage = matchNamedPage(lower, pages)
    if (namedPage) {
      // "Create a login page" but login already exists → update it
      return { type: 'update_page', targetPageId: namedPage.id, sendCurrentCode: true }
    }

    // New page creation
    const pageInfo = inferNewPageInfo(lower)
    return { type: 'create_page', title: pageInfo.title, route: pageInfo.route }
  }

  // ── 4. Named page reference without explicit verb ───────────────────────
  // e.g. "the pricing page should have 3 tiers"
  const referencedPage = resolveNamedReference(lower, pages)
  if (referencedPage && referencedPage !== selectedPageId) {
    return { type: 'update_page', targetPageId: referencedPage, sendCurrentCode: true }
  }

  // ── 5. Default: update selected page ────────────────────────────────────
  // Selected page has content → edit mode. No content → create mode.
  const selectedPage = pages.find((p) => p.id === selectedPageId)
  const hasContent = (selectedPage?.html.length ?? 0) > 0
  return {
    type: 'update_page',
    targetPageId: selectedPageId,
    sendCurrentCode: hasContent,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect multi-page intent: "3-page flow", or 2+ distinct page types named */
function detectMultiPage(lower: string): Array<{ title: string; route: string }> | null {
  let explicitCount = 0
  for (const pat of MULTI_PAGE_PATTERNS) {
    const m = pat.exec(lower)
    if (m) {
      explicitCount = m[1] ? parseInt(m[1], 10) : 0
      break
    }
  }

  const matched = matchPageKeywords(lower)

  if (explicitCount > 1 || matched.length >= 2) {
    // Deduplicate by route
    const seen = new Set<string>()
    const result: Array<{ title: string; route: string }> = []
    for (const m of matched) {
      if (!seen.has(m.route)) {
        seen.add(m.route)
        result.push({ title: m.title, route: m.route })
      }
    }

    const target = Math.max(explicitCount, result.length)
    while (result.length < target && result.length < 8) {
      const n = result.length + 1
      result.push({ title: `Page ${n}`, route: `/page-${n}` })
    }

    return result.slice(0, 8)
  }

  return null
}

/** Match page keywords present in the prompt */
function matchPageKeywords(lower: string): Array<{ title: string; route: string }> {
  return PAGE_KEYWORDS.filter((pk) => lower.includes(pk.kw))
}

/** Resolve which existing page the prompt is targeting */
function resolveTargetPage(lower: string, selectedPageId: string, pages: PrototypePage[]): string {
  // Check ordinal references first ("update the second page")
  const ordinalId = resolveOrdinalReference(lower, pages)
  if (ordinalId) return ordinalId

  // Check named references ("update the pricing page")
  const namedId = resolveNamedReference(lower, pages)
  if (namedId) return namedId

  // Default to selected page
  return selectedPageId
}

/** Match a page name in the prompt to an existing page */
function matchNamedPage(lower: string, pages: PrototypePage[]): PrototypePage | null {
  // Check if prompt references an existing page by title
  for (const page of pages) {
    const pageTitle = page.title.toLowerCase()
    if (pageTitle.length > 1 && lower.includes(pageTitle)) {
      return page
    }
  }

  // Check page keywords against existing routes
  for (const pk of PAGE_KEYWORDS) {
    if (lower.includes(pk.kw)) {
      const existing = pages.find((p) => p.route === pk.route)
      if (existing) return existing
    }
  }

  return null
}

/** Resolve "the pricing page", "home page", etc. to an existing page id */
function resolveNamedReference(lower: string, pages: PrototypePage[]): string | null {
  // Direct title match (longer titles first to avoid partial matches)
  const sortedPages = [...pages].sort((a, b) => b.title.length - a.title.length)
  for (const page of sortedPages) {
    const title = page.title.toLowerCase()
    // Match "the {title} page" or "the {title}" or just "{title} page"
    if (
      title.length > 1 &&
      (lower.includes(`the ${title} page`) ||
        lower.includes(`the ${title}`) ||
        lower.includes(`${title} page`))
    ) {
      return page.id
    }
  }

  // Match via page keywords → route → existing page
  for (const pk of PAGE_KEYWORDS) {
    if (lower.includes(`the ${pk.kw} page`) || lower.includes(`${pk.kw} page`)) {
      const existing = pages.find((p) => p.route === pk.route)
      if (existing) return existing.id
    }
  }

  return null
}

/** Resolve "first page", "second page", "page 2" to an existing page id */
function resolveOrdinalReference(lower: string, pages: PrototypePage[]): string | null {
  for (const ord of ORDINALS) {
    const m = ord.pattern.exec(lower)
    if (m) {
      const idx = ord.index >= 0 ? ord.index : parseInt(m[1]!, 10) - 1
      if (idx >= 0 && idx < pages.length) {
        return pages[idx]!.id
      }
    }
  }
  return null
}

/** Infer title and route for a new page from the prompt */
function inferNewPageInfo(lower: string): { title: string; route: string } {
  // Try to match a known page type
  for (const pk of PAGE_KEYWORDS) {
    if (lower.includes(pk.kw)) {
      return { title: pk.title, route: pk.route }
    }
  }

  // Extract a title from "create a ___ page" pattern
  const titleMatch = /(?:create|generate|build|add)\s+(?:a\s+)?(?:new\s+)?(.+?)\s+page/i.exec(lower)
  if (titleMatch?.[1]) {
    const raw = titleMatch[1].trim()
    const title = raw.charAt(0).toUpperCase() + raw.slice(1)
    const route = '/' + raw.replace(/\s+/g, '-').toLowerCase()
    return { title, route }
  }

  // Fallback
  return { title: 'New Page', route: `/page-${Date.now().toString(36).slice(-4)}` }
}
