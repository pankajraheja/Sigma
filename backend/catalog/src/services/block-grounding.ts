// ---------------------------------------------------------------------------
// Block Grounding — injects approved block catalog into generation prompts.
//
// This is the bridge between the block registry and the LLM system prompt.
// The block catalog is defined as data here (mirrored from the shared
// frontend registry) to keep the backend self-contained.
//
// Phase 1: static block catalog, no admin filtering.
// Future: load allowed blocks from workspace policy config.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Block catalog data (mirrors src/features/prototype-builder/lib/block-registry.ts)
// ---------------------------------------------------------------------------

interface BlockDefinition {
  id: string;
  name: string;
  description: string;
  wrapperTag: string;
  marker: string;
  slots: string;
  singleton: boolean;
}

const BLOCK_CATALOG: BlockDefinition[] = [
  {
    id: 'header-nav',
    name: 'Header Navigation',
    description: 'Top nav bar with logo, links, and CTA button.',
    wrapperTag: 'nav',
    marker: 'data-block="header-nav"',
    slots: 'brand (text), links (items), cta (text)',
    singleton: true,
  },
  {
    id: 'hero-section',
    name: 'Hero Section',
    description: 'Full-width hero with headline, subtitle, and CTA buttons.',
    wrapperTag: 'section',
    marker: 'data-block="hero-section"',
    slots: 'headline (text), subtitle (text), primaryCta (text), secondaryCta (text)',
    singleton: true,
  },
  {
    id: 'two-col-content',
    name: 'Two-Column Content',
    description: 'Side-by-side layout with text and image/visual.',
    wrapperTag: 'section',
    marker: 'data-block="two-col-content"',
    slots: 'heading (text), body (richtext), imageUrl (image-url), cta (text)',
    singleton: false,
  },
  {
    id: 'card-grid',
    name: 'Card Grid',
    description: 'Grid of 3-4 cards with icon, title, and description.',
    wrapperTag: 'section',
    marker: 'data-block="card-grid"',
    slots: 'sectionTitle (text), sectionSubtitle (text), cards (items)',
    singleton: false,
  },
  {
    id: 'cta-section',
    name: 'CTA Section',
    description: 'Prominent call-to-action banner with headline and button.',
    wrapperTag: 'section',
    marker: 'data-block="cta-section"',
    slots: 'headline (text), subtitle (text), buttonLabel (text)',
    singleton: false,
  },
  {
    id: 'form-section',
    name: 'Form Section',
    description: 'Contact or input form with fields and submit button.',
    wrapperTag: 'section',
    marker: 'data-block="form-section"',
    slots: 'heading (text), subtitle (text), fields (items), submitLabel (text)',
    singleton: false,
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Page footer with copyright and links.',
    wrapperTag: 'footer',
    marker: 'data-block="footer"',
    slots: 'copyright (text), links (items)',
    singleton: true,
  },
];

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the approved blocks section for the LLM system prompt.
 *
 * @param allowedBlockIds — optional filter. If provided, only these blocks
 *   are included. Pass null/undefined to include all blocks.
 */
export function buildBlockGroundingPrompt(allowedBlockIds?: string[] | null): string {
  const blocks = allowedBlockIds
    ? BLOCK_CATALOG.filter((b) => allowedBlockIds.includes(b.id))
    : BLOCK_CATALOG;

  const lines: string[] = [
    '',
    '## Approved Page Blocks',
    'Build pages using ONLY these approved section blocks.',
    'Each block MUST include the data-block attribute on its outermost wrapper element.',
    '',
  ];

  for (const block of blocks) {
    lines.push(`### ${block.id}`);
    lines.push(`Name: ${block.name}`);
    lines.push(`${block.description}`);
    lines.push(`Wrapper: <${block.wrapperTag} ${block.marker}>`);
    lines.push(`Slots: ${block.slots}`);
    if (block.singleton) lines.push('Singleton: max 1 per page.');
    lines.push('');
  }

  lines.push('## Block composition rules');
  lines.push('- Every visible section on the page must use one of the approved blocks.');
  lines.push('- Always include the data-block="..." attribute on each section wrapper element.');
  lines.push('- Singleton blocks (header-nav, hero-section, footer) may appear at most once.');
  lines.push('- Non-singleton blocks can appear multiple times.');
  lines.push('- Content within slots must use brand tokens only.');
  lines.push('- Do not invent new section types outside the approved blocks.');

  return lines.join('\n');
}

/**
 * Get the list of all approved block ids.
 */
export function getApprovedBlockIds(): string[] {
  return BLOCK_CATALOG.map((b) => b.id);
}
