// ---------------------------------------------------------------------------
// Brand Validation — Phase 1 automatic normalization for generated HTML.
//
// Pure functions, no DOM dependency. Works server-side and client-side.
//
// Responsibilities:
//   1. Detect off-palette colors and replace with nearest brand color
//   2. Enforce brand font-family on all font-family declarations
//   3. Enforce button border-radius based on buttonStyle
//   4. Report violations found (for UI feedback)
//
// Extensible: future phases can register additional rule functions via the
// BrandRule interface without modifying existing rules.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandPalette {
  primary: string
  secondary: string
  background: string
  text: string
  border: string
}

export interface BrandValidationConfig {
  colors: BrandPalette
  fontFamily: string
  buttonBorderRadius: string
  inputBorderRadius: string
  cardBorderRadius: string
}

export interface BrandViolation {
  rule: string
  found: string
  replacedWith: string
}

export interface BrandValidationResult {
  html: string
  violations: BrandViolation[]
  wasModified: boolean
}

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

function normalizeHex(color: string): string | null {
  const trimmed = color.trim().toLowerCase()

  // #RGB → #RRGGBB
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(trimmed)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`

  // #RRGGBB
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed

  return null
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return [r, g, b]
}

/** Simple Euclidean distance in RGB space — sufficient for palette matching. */
function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

function findNearestPaletteColor(color: string, palette: string[]): string | null {
  const rgb = hexToRgb(color)
  if (!rgb) return null

  let nearest = palette[0]
  let minDist = Infinity

  for (const candidate of palette) {
    const candidateRgb = hexToRgb(candidate)
    if (!candidateRgb) continue
    const dist = colorDistance(rgb, candidateRgb)
    if (dist < minDist) {
      minDist = dist
      nearest = candidate
    }
  }

  return nearest
}

// Common safe colors that should never be flagged (pure white, pure black,
// transparent, inherit, currentColor).
const SAFE_COLORS = new Set([
  '#ffffff', '#fff', '#000000', '#000',
  'transparent', 'inherit', 'currentcolor', 'none',
])

function isSafeColor(value: string): boolean {
  return SAFE_COLORS.has(value.trim().toLowerCase())
}

// ---------------------------------------------------------------------------
// Rule: enforce palette colors
// ---------------------------------------------------------------------------

function enforceColors(
  html: string,
  palette: BrandPalette,
  violations: BrandViolation[],
): string {
  const allowed = Object.values(palette).map((c) => normalizeHex(c) ?? c.toLowerCase())
  const allowedSet = new Set(allowed)

  // Match hex colors in style attributes and <style> blocks
  // Captures #RGB and #RRGGBB
  return html.replace(/#(?:[0-9a-fA-F]{3}){1,2}\b/g, (match) => {
    const normalized = normalizeHex(match)
    if (!normalized) return match
    if (allowedSet.has(normalized)) return match
    if (isSafeColor(match)) return match

    const nearest = findNearestPaletteColor(match, allowed)
    if (nearest && nearest !== normalized) {
      violations.push({
        rule: 'color-palette',
        found: match,
        replacedWith: nearest,
      })
      return nearest
    }
    return match
  })
}

// ---------------------------------------------------------------------------
// Rule: enforce font-family
// ---------------------------------------------------------------------------

function enforceFontFamily(
  html: string,
  brandFont: string,
  violations: BrandViolation[],
): string {
  // Match font-family declarations in inline styles and <style> blocks
  return html.replace(
    /font-family\s*:\s*([^;}"]+)/gi,
    (fullMatch, currentValue: string) => {
      const trimmed = currentValue.trim()
      // Already using the brand font (case-insensitive prefix check)
      if (trimmed.toLowerCase().startsWith(brandFont.toLowerCase().split(',')[0].replace(/"/g, '').trim().toLowerCase())) {
        return fullMatch
      }
      violations.push({
        rule: 'font-family',
        found: trimmed,
        replacedWith: brandFont,
      })
      return `font-family: ${brandFont}`
    },
  )
}

// ---------------------------------------------------------------------------
// Rule: enforce button border-radius
// ---------------------------------------------------------------------------

function enforceButtonRadius(
  html: string,
  brandRadius: string,
  violations: BrandViolation[],
): string {
  // Match <button ...style="...border-radius: XXX..."...>
  // Strategy: find style attributes on button elements and fix border-radius within them.
  return html.replace(
    /<button\b([^>]*?)style\s*=\s*"([^"]*)"([^>]*?)>/gi,
    (fullMatch, before: string, styleContent: string, after: string) => {
      const radiusMatch = /border-radius\s*:\s*([^;]+)/i.exec(styleContent)
      if (!radiusMatch) {
        // No border-radius set — inject the brand one
        const newStyle = `${styleContent}; border-radius: ${brandRadius}`
        return `<button${before}style="${newStyle}"${after}>`
      }

      const current = radiusMatch[1].trim()
      if (current === brandRadius) return fullMatch

      violations.push({
        rule: 'button-border-radius',
        found: current,
        replacedWith: brandRadius,
      })
      const fixedStyle = styleContent.replace(
        /border-radius\s*:\s*[^;]+/i,
        `border-radius: ${brandRadius}`,
      )
      return `<button${before}style="${fixedStyle}"${after}>`
    },
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a BrandValidationConfig from the same shape used by BrandConfig.
 * Convenience helper so callers don't have to destructure manually.
 */
export function toBrandValidationConfig(brand: {
  colors: BrandPalette
  typography: { fontFamily: string }
  borderRadius: { button: string; card: string; input: string }
  buttonStyle: 'pill' | 'rounded' | 'square'
}): BrandValidationConfig {
  const btnRadius =
    brand.buttonStyle === 'pill' ? '9999px' :
    brand.buttonStyle === 'rounded' ? '8px' : '2px'

  return {
    colors: brand.colors,
    fontFamily: brand.typography.fontFamily,
    buttonBorderRadius: btnRadius,
    inputBorderRadius: brand.borderRadius.input,
    cardBorderRadius: brand.borderRadius.card,
  }
}

/**
 * Validate and normalize generated HTML against brand tokens.
 *
 * Returns the (potentially modified) HTML and a list of violations found.
 * Safe to call multiple times — idempotent once all violations are fixed.
 */
export function validateBrandHtml(
  html: string,
  config: BrandValidationConfig,
): BrandValidationResult {
  const violations: BrandViolation[] = []

  let result = html
  result = enforceColors(result, config.colors, violations)
  result = enforceFontFamily(result, config.fontFamily, violations)
  result = enforceButtonRadius(result, config.buttonBorderRadius, violations)

  return {
    html: result,
    violations,
    wasModified: violations.length > 0,
  }
}
