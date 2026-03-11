// ---------------------------------------------------------------------------
// Brand Validation (server-side) — automatic normalization for generated HTML.
//
// Mirrors the frontend utility at src/lib/brand-validation.ts.
// Pure functions, no DOM or browser dependency.
//
// Rules:
//   1. Detect off-palette hex colors → replace with nearest brand color
//   2. Enforce brand font-family on all font-family declarations
//   3. Enforce button border-radius based on buttonStyle
// ---------------------------------------------------------------------------

export interface BrandPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
}

export interface BrandValidationConfig {
  colors: BrandPalette;
  fontFamily: string;
  buttonBorderRadius: string;
}

export interface BrandViolation {
  rule: string;
  found: string;
  replacedWith: string;
}

export interface BrandValidationResult {
  html: string;
  violations: BrandViolation[];
  wasModified: boolean;
}

// ── Color utilities ──────────────────────────────────────────────────────────

function normalizeHex(color: string): string | null {
  const trimmed = color.trim().toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(trimmed);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  return null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function findNearest(color: string, palette: string[]): string | null {
  const rgb = hexToRgb(color);
  if (!rgb || palette.length === 0) return null;
  let nearest: string = palette[0]!;
  let min = Infinity;
  for (const c of palette) {
    const cRgb = hexToRgb(c);
    if (!cRgb) continue;
    const d = colorDistance(rgb, cRgb);
    if (d < min) { min = d; nearest = c; }
  }
  return nearest;
}

const SAFE = new Set(['#ffffff', '#fff', '#000000', '#000', 'transparent', 'inherit', 'currentcolor', 'none']);

// ── Rule: palette colors ─────────────────────────────────────────────────────

function enforceColors(html: string, palette: BrandPalette, v: BrandViolation[]): string {
  const allowed = Object.values(palette).map((c) => normalizeHex(c) ?? c.toLowerCase());
  const allowedSet = new Set(allowed);

  return html.replace(/#(?:[0-9a-fA-F]{3}){1,2}\b/g, (match) => {
    const norm = normalizeHex(match);
    if (!norm) return match;
    if (allowedSet.has(norm) || SAFE.has(match.toLowerCase())) return match;
    const nearest = findNearest(match, allowed);
    if (nearest && nearest !== norm) {
      v.push({ rule: 'color-palette', found: match, replacedWith: nearest });
      return nearest;
    }
    return match;
  });
}

// ── Rule: font-family ────────────────────────────────────────────────────────

function enforceFontFamily(html: string, brandFont: string, v: BrandViolation[]): string {
  const brandPrefix = (brandFont.toLowerCase().split(',')[0] ?? '').replace(/"/g, '').trim();
  return html.replace(/font-family\s*:\s*([^;}"]+)/gi, (full, cur: string) => {
    const trimmed = cur.trim();
    if (trimmed.toLowerCase().replace(/"/g, '').trim().startsWith(brandPrefix)) return full;
    v.push({ rule: 'font-family', found: trimmed, replacedWith: brandFont });
    return `font-family: ${brandFont}`;
  });
}

// ── Rule: button border-radius ───────────────────────────────────────────────

function enforceButtonRadius(html: string, radius: string, v: BrandViolation[]): string {
  return html.replace(
    /<button\b([^>]*?)style\s*=\s*"([^"]*)"([^>]*?)>/gi,
    (full, before: string, style: string, after: string) => {
      const m = /border-radius\s*:\s*([^;]+)/i.exec(style);
      if (!m) {
        return `<button${before}style="${style}; border-radius: ${radius}"${after}>`;
      }
      const cur = m[1]!.trim();
      if (cur === radius) return full;
      v.push({ rule: 'button-border-radius', found: cur, replacedWith: radius });
      return `<button${before}style="${style.replace(/border-radius\s*:\s*[^;]+/i, `border-radius: ${radius}`)}"${after}>`;
    },
  );
}

// ── Public API ───────────────────────────────────────────────────────────────

export function toBrandValidationConfig(brand: {
  colors: BrandPalette;
  typography: { fontFamily: string };
  buttonStyle: 'pill' | 'rounded' | 'square';
}): BrandValidationConfig {
  const btnRadius = brand.buttonStyle === 'pill' ? '9999px' : brand.buttonStyle === 'rounded' ? '8px' : '2px';
  return { colors: brand.colors, fontFamily: brand.typography.fontFamily, buttonBorderRadius: btnRadius };
}

export function validateBrandHtml(html: string, config: BrandValidationConfig): BrandValidationResult {
  const violations: BrandViolation[] = [];
  let result = html;
  result = enforceColors(result, config.colors, violations);
  result = enforceFontFamily(result, config.fontFamily, violations);
  result = enforceButtonRadius(result, config.buttonBorderRadius, violations);
  return { html: result, violations, wasModified: violations.length > 0 };
}
