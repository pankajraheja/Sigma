// ---------------------------------------------------------------------------
// HTML Editor Utilities — parse generated HTML into editable regions and
// apply targeted text/attribute edits without breaking page structure.
//
// Pure functions. No React, no DOM APIs (uses regex-based parsing safe for
// server and client). Operates on raw HTML strings.
//
// Editable region types (Phase 1):
//   heading  — h1–h6 inner text
//   button   — button / .btn-primary / .btn-secondary label text
//   paragraph — p inner text
//   link     — anchor inner text
//   span     — span inner text (for labels, badges)
//   input    — placeholder attribute
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditableRegion {
  /** Unique id for this region within the page */
  id: string
  /** Human-readable label shown in the inspector */
  label: string
  /** Region type */
  type: 'heading' | 'button' | 'paragraph' | 'link' | 'span' | 'input'
  /** Current text content or placeholder */
  value: string
  /** Character offset in the source HTML where the value starts */
  offset: number
  /** Length of the value in the source HTML */
  length: number
  /** The full matched tag for context (e.g. "<h1 ...>Welcome</h1>") */
  preview: string
}

export interface EditOperation {
  regionId: string
  newValue: string
}

// ---------------------------------------------------------------------------
// Parse — extract editable regions from raw HTML
// ---------------------------------------------------------------------------

export function parseEditableRegions(html: string): EditableRegion[] {
  const regions: EditableRegion[] = []
  let counter = 0

  // ── Headings (h1-h6) ───────────────────────────────────────────────────
  const headingRe = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = headingRe.exec(html)) !== null) {
    const inner = stripTags(m[2])
    if (inner.trim().length === 0) continue
    const valueStart = m.index + m[0].indexOf(m[2])
    regions.push({
      id: `region_${counter++}`,
      label: `${m[1].toUpperCase()}: ${truncate(inner, 40)}`,
      type: 'heading',
      value: m[2],
      offset: valueStart,
      length: m[2].length,
      preview: truncate(m[0], 80),
    })
  }

  // ── Buttons ─────────────────────────────────────────────────────────────
  const buttonRe = /<button\b[^>]*>([\s\S]*?)<\/button>/gi
  while ((m = buttonRe.exec(html)) !== null) {
    const inner = stripTags(m[1])
    if (inner.trim().length === 0) continue
    const valueStart = m.index + m[0].indexOf(m[1])
    regions.push({
      id: `region_${counter++}`,
      label: `Button: ${truncate(inner, 40)}`,
      type: 'button',
      value: m[1],
      offset: valueStart,
      length: m[1].length,
      preview: truncate(m[0], 80),
    })
  }

  // ── Paragraphs ──────────────────────────────────────────────────────────
  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi
  while ((m = pRe.exec(html)) !== null) {
    const inner = stripTags(m[1])
    if (inner.trim().length < 3) continue
    const valueStart = m.index + m[0].indexOf(m[1])
    regions.push({
      id: `region_${counter++}`,
      label: `Text: ${truncate(inner, 40)}`,
      type: 'paragraph',
      value: m[1],
      offset: valueStart,
      length: m[1].length,
      preview: truncate(m[0], 80),
    })
  }

  // ── Anchor links (with visible text, not just icons) ────────────────────
  const aRe = /<a\b[^>]*>([\s\S]*?)<\/a>/gi
  while ((m = aRe.exec(html)) !== null) {
    const inner = stripTags(m[1])
    if (inner.trim().length < 2) continue
    // Skip class-based buttons (already captured above or variant)
    if (/class\s*=\s*"[^"]*btn/i.test(m[0])) {
      const valueStart = m.index + m[0].indexOf(m[1])
      regions.push({
        id: `region_${counter++}`,
        label: `CTA: ${truncate(inner, 40)}`,
        type: 'button',
        value: m[1],
        offset: valueStart,
        length: m[1].length,
        preview: truncate(m[0], 80),
      })
    } else {
      const valueStart = m.index + m[0].indexOf(m[1])
      regions.push({
        id: `region_${counter++}`,
        label: `Link: ${truncate(inner, 40)}`,
        type: 'link',
        value: m[1],
        offset: valueStart,
        length: m[1].length,
        preview: truncate(m[0], 80),
      })
    }
  }

  // ── Input placeholders ──────────────────────────────────────────────────
  const inputRe = /<input\b[^>]*placeholder\s*=\s*"([^"]*)"[^>]*\/?>/gi
  while ((m = inputRe.exec(html)) !== null) {
    if (m[1].trim().length === 0) continue
    const attrStart = m.index + m[0].indexOf(`"${m[1]}"`) + 1
    regions.push({
      id: `region_${counter++}`,
      label: `Placeholder: ${truncate(m[1], 40)}`,
      type: 'input',
      value: m[1],
      offset: attrStart,
      length: m[1].length,
      preview: truncate(m[0], 80),
    })
  }

  return regions
}

// ---------------------------------------------------------------------------
// Apply — apply a batch of edit operations to the HTML
// ---------------------------------------------------------------------------

export function applyEdits(html: string, edits: EditOperation[], regions: EditableRegion[]): string {
  // Build a map of regionId → new value
  const editMap = new Map(edits.map((e) => [e.regionId, e.newValue]))

  // Sort regions by offset descending so we can splice from the end
  // without invalidating earlier offsets
  const sorted = [...regions]
    .filter((r) => editMap.has(r.id))
    .sort((a, b) => b.offset - a.offset)

  let result = html
  for (const region of sorted) {
    const newValue = editMap.get(region.id)
    if (newValue === undefined || newValue === region.value) continue
    result =
      result.slice(0, region.offset) +
      newValue +
      result.slice(region.offset + region.length)
  }

  return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max) + '...' : clean
}
