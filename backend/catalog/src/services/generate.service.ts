// ---------------------------------------------------------------------------
// Generate Service — model-agnostic HTML generation for the workspace.
//
// Builds a strict system prompt from BrandConfig, then delegates to the
// existing AiProvider.chatCompletion(). The route never knows which model
// or provider is active — only this service touches the AI layer.
// ---------------------------------------------------------------------------

import { getAiProvider } from './ai.service.js';
import {
  validateBrandHtml,
  toBrandValidationConfig,
  type BrandViolation,
} from './brand-validation.js';
import { buildBlockGroundingPrompt } from './block-grounding.js';

// ---------------------------------------------------------------------------
// Request / response types
//
// GenerateBrandConfig mirrors the frontend BrandConfig shape. It is defined
// here rather than imported because frontend and backend are separate packages.
// If the shape drifts, the route-level validation in generate.routes.ts will
// catch mismatches at runtime.
// ---------------------------------------------------------------------------

export interface GenerateBrandConfig {
  colors: { primary: string; secondary: string; background: string; text: string; border: string };
  typography: { fontFamily: string; fontWeightRegular: number; fontWeightBold: number; baseSizePx: number };
  borderRadius: { button: string; card: string; input: string };
  spacing: { unit: number; scale: number[] };
  logoUrl: string;
  companyName: string;
  buttonStyle: 'pill' | 'rounded' | 'square';
}

export interface GenerateRequest {
  prompt: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  brandConfig: GenerateBrandConfig;
  currentPageCode?: string;
  /** Allowed block IDs from workspace policy — null/undefined means all blocks */
  allowedBlockIds?: string[] | null;
}

export interface GeneratedPage {
  title: string;
  route: string;
  html: string;
  brandValidation: {
    wasModified: boolean;
    violations: BrandViolation[];
  };
}

export interface GenerateResult {
  /** Single-page mode (backwards-compatible) */
  html: string;
  brandValidation: {
    wasModified: boolean;
    violations: BrandViolation[];
  };
  /** Multi-page mode — present when prompt requested multiple pages */
  pages?: GeneratedPage[];
}

// ---------------------------------------------------------------------------
// Prompt builder — isolated from the provider call
// ---------------------------------------------------------------------------

function buildSystemPrompt(req: GenerateRequest): string {
  const { brandConfig: b } = req;
  const isEdit = !!req.currentPageCode;

  const btnRadius =
    b.buttonStyle === 'pill' ? '9999px' :
    b.buttonStyle === 'rounded' ? '8px' : '2px';

  return [
    'You are a UI prototype generator.',
    '',
    '## Output rules',
    '- Output raw HTML only.',
    '- NO markdown. NO code fences. NO explanations.',
    '- The response must start with <!DOCTYPE html> or <html> and contain nothing else.',
    '- Output a complete HTML page with a realistic, multi-section layout.',
    '',
    '## Brand tokens (STRICT — do not deviate)',
    `Company: ${b.companyName}`,
    `Logo URL: ${b.logoUrl}`,
    '',
    'Colors (use ONLY these):',
    `  Primary:    ${b.colors.primary}`,
    `  Secondary:  ${b.colors.secondary}`,
    `  Background: ${b.colors.background}`,
    `  Text:       ${b.colors.text}`,
    `  Border:     ${b.colors.border}`,
    '',
    'Typography:',
    `  font-family: ${b.typography.fontFamily}`,
    `  font-weight normal: ${b.typography.fontWeightRegular}`,
    `  font-weight bold: ${b.typography.fontWeightBold}`,
    `  base size: ${b.typography.baseSizePx}px`,
    '',
    'Border radius:',
    `  Buttons: ${btnRadius}`,
    `  Cards: ${b.borderRadius.card}`,
    `  Inputs: ${b.borderRadius.input}`,
    '',
    `Spacing unit: ${b.spacing.unit}px`,
    `Spacing scale: ${b.spacing.scale.join(', ')}`,
    '',
    '## Constraints',
    '- Every color must come from the palette above. No other colors.',
    '- Buttons must use the brand button border-radius and brand colors.',
    '- Fonts must use the brand font-family.',
    '- Include all CSS inline or in a <style> block. No external stylesheets.',
    '',
    // Approved block catalog — grounds generation against governed building blocks
    buildBlockGroundingPrompt(req.allowedBlockIds),
    '',
    isEdit
      ? [
          '## Edit mode',
          'The user already has a page. Apply the requested changes to the existing HTML.',
          'Preserve sections the user did not ask to change.',
          'Preserve all data-block="..." attributes on section wrappers.',
          'Return the full updated HTML page.',
        ].join('\n')
      : '',
  ].filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------
// Multi-page detection — checks whether the prompt asks for multiple pages
// ---------------------------------------------------------------------------

interface MultiPageIntent {
  isMultiPage: boolean;
  pageDescriptions: Array<{ title: string; route: string; description: string }>;
}

const MULTI_PAGE_PATTERNS = [
  /(\d+)[\s-]*page/i,
  /multi[\s-]*page/i,
  /create\s+(?:a\s+)?(?:full\s+)?(?:website|site|flow|app)/i,
  /pages?\s*:\s*/i,
  /including\s+(?:a\s+)?(?:home|login|dashboard|pricing|contact|signup|about)/i,
];

function detectMultiPageIntent(prompt: string): MultiPageIntent {
  const lower = prompt.toLowerCase();

  // Check if any multi-page pattern matches
  let pageCount = 0;
  for (const pat of MULTI_PAGE_PATTERNS) {
    const m = pat.exec(prompt);
    if (m) {
      pageCount = m[1] ? parseInt(m[1], 10) : 0;
      break;
    }
  }

  // Also detect lists of page names like "login, dashboard, and settings"
  const pageKeywords = [
    { kw: 'home', title: 'Home', route: '/' },
    { kw: 'landing', title: 'Landing', route: '/' },
    { kw: 'login', title: 'Login', route: '/login' },
    { kw: 'sign in', title: 'Login', route: '/login' },
    { kw: 'signup', title: 'Sign Up', route: '/signup' },
    { kw: 'sign up', title: 'Sign Up', route: '/signup' },
    { kw: 'register', title: 'Register', route: '/register' },
    { kw: 'dashboard', title: 'Dashboard', route: '/dashboard' },
    { kw: 'analytics', title: 'Analytics', route: '/analytics' },
    { kw: 'pricing', title: 'Pricing', route: '/pricing' },
    { kw: 'contact', title: 'Contact', route: '/contact' },
    { kw: 'support', title: 'Support', route: '/support' },
    { kw: 'profile', title: 'Profile', route: '/profile' },
    { kw: 'settings', title: 'Settings', route: '/settings' },
    { kw: 'account', title: 'Account', route: '/account' },
    { kw: 'about', title: 'About', route: '/about' },
    { kw: 'table', title: 'Data Table', route: '/data' },
  ];

  const matched = pageKeywords.filter((pk) => lower.includes(pk.kw));

  // Multi-page if explicit count > 1, or 2+ distinct page types mentioned
  if (pageCount > 1 || matched.length >= 2) {
    // Deduplicate by route
    const seen = new Set<string>();
    const descriptions: MultiPageIntent['pageDescriptions'] = [];
    for (const m of matched) {
      if (!seen.has(m.route)) {
        seen.add(m.route);
        descriptions.push({ title: m.title, route: m.route, description: `${m.title} page` });
      }
    }

    // If count specified but fewer keywords found, pad with generic pages
    const target = Math.max(pageCount, descriptions.length);
    while (descriptions.length < target && descriptions.length < 8) {
      const n = descriptions.length + 1;
      descriptions.push({
        title: `Page ${n}`,
        route: `/page-${n}`,
        description: `Page ${n}`,
      });
    }

    return { isMultiPage: true, pageDescriptions: descriptions.slice(0, 8) };
  }

  return { isMultiPage: false, pageDescriptions: [] };
}

// ---------------------------------------------------------------------------
// Generate single page — core logic extracted
// ---------------------------------------------------------------------------

function cleanHtml(raw: string): string {
  return raw
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

async function generateSinglePage(
  req: GenerateRequest,
  promptOverride?: string,
): Promise<{ html: string; brandValidation: { wasModified: boolean; violations: BrandViolation[] } }> {
  const systemPrompt = buildSystemPrompt(req);
  const provider = getAiProvider();

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (req.conversationHistory?.length) {
    for (const msg of req.conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  if (req.currentPageCode) {
    messages.push({
      role: 'user',
      content: `Here is the current page HTML:\n\n${req.currentPageCode}`,
    });
  }

  messages.push({ role: 'user', content: promptOverride ?? req.prompt });

  const html = await provider.chatCompletion({
    messages,
    temperature: 0.4,
    maxTokens: 4096,
  });

  const cleaned = cleanHtml(html);
  const validationConfig = toBrandValidationConfig(req.brandConfig);
  const validation = validateBrandHtml(cleaned, validationConfig);

  return {
    html: validation.html,
    brandValidation: {
      wasModified: validation.wasModified,
      violations: validation.violations,
    },
  };
}

// ---------------------------------------------------------------------------
// Generate — called by the route handler
// ---------------------------------------------------------------------------

export async function generateHtml(req: GenerateRequest): Promise<GenerateResult> {
  const intent = detectMultiPageIntent(req.prompt);

  // ── Single-page mode ────────────────────────────────────────────────────
  if (!intent.isMultiPage) {
    const result = await generateSinglePage(req);
    return {
      html: result.html,
      brandValidation: result.brandValidation,
    };
  }

  // ── Multi-page mode ─────────────────────────────────────────────────────
  // Generate each page in parallel. Each sub-page gets a focused prompt
  // with ONLY its own page type — the original multi-page prompt is not
  // appended, as it would confuse keyword-based template matching in the
  // stub provider (e.g. "Create a dashboard page. create login and dashboard"
  // would match "login" first and return the wrong template).
  const pagePromises = intent.pageDescriptions.map(async (desc) => {
    const pagePrompt = `Create a ${desc.title.toLowerCase()} page for the ${req.brandConfig.companyName} website.`;
    const result = await generateSinglePage(
      { ...req, conversationHistory: [], currentPageCode: undefined },
      pagePrompt,
    );
    return {
      title: desc.title,
      route: desc.route,
      html: result.html,
      brandValidation: result.brandValidation,
    } satisfies GeneratedPage;
  });

  const generatedPages = await Promise.all(pagePromises);

  // Use the first page as the primary html (backwards-compatible)
  const first = generatedPages[0]!;
  return {
    html: first.html,
    brandValidation: first.brandValidation,
    pages: generatedPages,
  };
}
