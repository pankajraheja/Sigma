// ---------------------------------------------------------------------------
// Block Registry — approved building blocks for brand-locked prototypes.
//
// Pure data definitions. No React, no rendering logic.
//
// Each ApprovedBlock describes a structural section that can appear in a
// generated prototype page. Blocks have stable identifiers, content slots,
// and category metadata. The registry is the single source of truth for
// what sections the workspace can generate and edit.
//
// Phase 1: 7 curated blocks covering common page patterns.
// Future: admin taxonomy can filter APPROVED_BLOCKS by workspace context.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Category for grouping blocks in UI and filtering by admin policy */
export type BlockCategory = 'navigation' | 'hero' | 'content' | 'conversion' | 'form' | 'footer'

/** A named slot within a block that holds editable content */
export interface ContentSlot {
  /** Stable key for this slot (e.g. "headline", "subtitle") */
  key: string
  /** Human-readable label shown in editors */
  label: string
  /** What kind of content this slot holds */
  type: 'text' | 'richtext' | 'image-url' | 'link-url' | 'items'
  /** Placeholder or default value */
  defaultValue: string
  /** Maximum character count (advisory, not enforced in Phase 1) */
  maxLength?: number
}

/** Approved block definition */
export interface ApprovedBlock {
  /** Stable identifier — never changes after creation (e.g. "header-nav") */
  id: string
  /** Human-readable block name */
  name: string
  /** Short description for tooltips and prompt grounding */
  description: string
  /** Grouping category */
  category: BlockCategory
  /** Semantic HTML tag that wraps this block (for detection in generated HTML) */
  wrapperTag: string
  /** CSS class or data attribute used to identify this block in output HTML */
  marker: string
  /** Content slots available for editing */
  slots: ContentSlot[]
  /** Tags for filtering and search (future admin taxonomy integration) */
  tags: string[]
  /** Whether this block should appear at most once per page */
  singleton: boolean
  /** Sort weight — lower numbers appear first in block picker UI */
  sortOrder: number
}

// ---------------------------------------------------------------------------
// Registry — Phase 1 approved blocks
// ---------------------------------------------------------------------------

export const APPROVED_BLOCKS: readonly ApprovedBlock[] = [
  // ── Header / Top Nav ──────────────────────────────────────────────────
  {
    id: 'header-nav',
    name: 'Header Navigation',
    description: 'Top navigation bar with logo, links, and optional CTA button.',
    category: 'navigation',
    wrapperTag: 'nav',
    marker: 'data-block="header-nav"',
    slots: [
      { key: 'brand', label: 'Brand Name', type: 'text', defaultValue: '{companyName}' },
      { key: 'links', label: 'Nav Links', type: 'items', defaultValue: 'Home, Features, Pricing, Contact' },
      { key: 'cta', label: 'CTA Label', type: 'text', defaultValue: 'Get Started', maxLength: 30 },
    ],
    tags: ['navigation', 'header', 'top-bar'],
    singleton: true,
    sortOrder: 0,
  },

  // ── Hero Section ──────────────────────────────────────────────────────
  {
    id: 'hero-section',
    name: 'Hero Section',
    description: 'Full-width hero with headline, subtitle, and primary/secondary CTAs.',
    category: 'hero',
    wrapperTag: 'section',
    marker: 'data-block="hero-section"',
    slots: [
      { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Transform Your Workflow', maxLength: 80 },
      { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'AI-powered tools that help your team move faster.', maxLength: 200 },
      { key: 'primaryCta', label: 'Primary CTA', type: 'text', defaultValue: 'Start Free Trial', maxLength: 30 },
      { key: 'secondaryCta', label: 'Secondary CTA', type: 'text', defaultValue: 'Learn More', maxLength: 30 },
    ],
    tags: ['hero', 'above-fold', 'banner'],
    singleton: true,
    sortOrder: 10,
  },

  // ── Two-Column Content ────────────────────────────────────────────────
  {
    id: 'two-col-content',
    name: 'Two-Column Content',
    description: 'Side-by-side layout with text on one side and image/visual on the other.',
    category: 'content',
    wrapperTag: 'section',
    marker: 'data-block="two-col-content"',
    slots: [
      { key: 'heading', label: 'Section Heading', type: 'text', defaultValue: 'Why Choose Us', maxLength: 60 },
      { key: 'body', label: 'Body Text', type: 'richtext', defaultValue: 'Our platform combines cutting-edge AI with enterprise-grade reliability.' },
      { key: 'imageUrl', label: 'Image URL', type: 'image-url', defaultValue: '' },
      { key: 'cta', label: 'CTA Label', type: 'text', defaultValue: 'Learn More', maxLength: 30 },
    ],
    tags: ['content', 'split', 'features', 'about'],
    singleton: false,
    sortOrder: 20,
  },

  // ── Card Grid ─────────────────────────────────────────────────────────
  {
    id: 'card-grid',
    name: 'Card Grid',
    description: 'Grid of 3–4 cards with icon, title, and short description. Use for features, services, or pricing tiers.',
    category: 'content',
    wrapperTag: 'section',
    marker: 'data-block="card-grid"',
    slots: [
      { key: 'sectionTitle', label: 'Section Title', type: 'text', defaultValue: 'Our Features', maxLength: 60 },
      { key: 'sectionSubtitle', label: 'Section Subtitle', type: 'text', defaultValue: 'Everything you need to succeed.' },
      { key: 'cards', label: 'Card Items', type: 'items', defaultValue: 'Analytics, Automation, Security, Integrations' },
    ],
    tags: ['cards', 'features', 'grid', 'services', 'pricing'],
    singleton: false,
    sortOrder: 30,
  },

  // ── CTA Section ───────────────────────────────────────────────────────
  {
    id: 'cta-section',
    name: 'CTA Section',
    description: 'Prominent call-to-action banner with headline and action button.',
    category: 'conversion',
    wrapperTag: 'section',
    marker: 'data-block="cta-section"',
    slots: [
      { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Ready to Get Started?', maxLength: 80 },
      { key: 'subtitle', label: 'Supporting Text', type: 'text', defaultValue: 'Join thousands of teams already using our platform.' },
      { key: 'buttonLabel', label: 'Button Label', type: 'text', defaultValue: 'Start Free Trial', maxLength: 30 },
    ],
    tags: ['cta', 'conversion', 'banner'],
    singleton: false,
    sortOrder: 40,
  },

  // ── Form Section ──────────────────────────────────────────────────────
  {
    id: 'form-section',
    name: 'Form Section',
    description: 'Contact or input form with fields, labels, and submit button.',
    category: 'form',
    wrapperTag: 'section',
    marker: 'data-block="form-section"',
    slots: [
      { key: 'heading', label: 'Form Heading', type: 'text', defaultValue: 'Get in Touch', maxLength: 60 },
      { key: 'subtitle', label: 'Form Subtitle', type: 'text', defaultValue: 'We\'d love to hear from you.' },
      { key: 'fields', label: 'Form Fields', type: 'items', defaultValue: 'Name, Email, Message' },
      { key: 'submitLabel', label: 'Submit Label', type: 'text', defaultValue: 'Send Message', maxLength: 30 },
    ],
    tags: ['form', 'contact', 'input', 'signup'],
    singleton: false,
    sortOrder: 50,
  },

  // ── Footer ────────────────────────────────────────────────────────────
  {
    id: 'footer',
    name: 'Footer',
    description: 'Page footer with copyright, links, and optional social icons.',
    category: 'footer',
    wrapperTag: 'footer',
    marker: 'data-block="footer"',
    slots: [
      { key: 'copyright', label: 'Copyright Text', type: 'text', defaultValue: '© {year} {companyName}. All rights reserved.' },
      { key: 'links', label: 'Footer Links', type: 'items', defaultValue: 'Privacy Policy, Terms of Service, Contact' },
    ],
    tags: ['footer', 'bottom', 'legal'],
    singleton: true,
    sortOrder: 100,
  },
] as const

// ---------------------------------------------------------------------------
// Lookup utilities
// ---------------------------------------------------------------------------

/** Get a block definition by id */
export function getBlock(id: string): ApprovedBlock | undefined {
  return APPROVED_BLOCKS.find((b) => b.id === id)
}

/** Get all blocks in a category */
export function getBlocksByCategory(category: BlockCategory): ApprovedBlock[] {
  return APPROVED_BLOCKS.filter((b) => b.category === category)
}

/** Get all block ids */
export function getBlockIds(): string[] {
  return APPROVED_BLOCKS.map((b) => b.id)
}

/**
 * Filter blocks by a policy allow-list. Returns only blocks whose id is
 * in the provided set. If allowedIds is null/undefined, returns all blocks
 * (no policy constraint).
 *
 * This is the hook for future admin taxonomy: the admin configures which
 * block ids are allowed for a workspace, and this function enforces it.
 */
export function filterBlocksByPolicy(allowedIds?: string[] | null): ApprovedBlock[] {
  if (!allowedIds) return [...APPROVED_BLOCKS]
  const allowed = new Set(allowedIds)
  return APPROVED_BLOCKS.filter((b) => allowed.has(b.id))
}

/**
 * Build a compact block summary for prompt grounding.
 * Returns a formatted string listing all (or filtered) blocks with their
 * slots, suitable for injection into an LLM system prompt.
 */
export function buildBlockCatalogForPrompt(allowedIds?: string[] | null): string {
  const blocks = filterBlocksByPolicy(allowedIds)
  const lines: string[] = [
    '## Approved Page Blocks',
    'Build pages using ONLY these approved section blocks.',
    'Each block must include the data-block attribute on its wrapper element.',
    '',
  ]

  for (const block of blocks) {
    const slotList = block.slots.map((s) => `${s.key} (${s.type})`).join(', ')
    lines.push(`### ${block.id}`)
    lines.push(`Name: ${block.name}`)
    lines.push(`Description: ${block.description}`)
    lines.push(`Wrapper: <${block.wrapperTag} ${block.marker}>`)
    lines.push(`Slots: ${slotList}`)
    lines.push(`Singleton: ${block.singleton ? 'yes (max 1 per page)' : 'no (can repeat)'}`)
    lines.push('')
  }

  lines.push('## Block rules')
  lines.push('- Every section must use one of the approved blocks above.')
  lines.push('- Include the data-block="..." attribute on each section wrapper.')
  lines.push('- You may use multiple instances of non-singleton blocks.')
  lines.push('- Content within slots should use brand tokens only.')

  return lines.join('\n')
}
