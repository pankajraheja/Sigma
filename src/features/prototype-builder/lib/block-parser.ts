// ---------------------------------------------------------------------------
// Block Parser — detect approved blocks in generated HTML.
//
// Pure functions. No React, no DOM APIs (regex-based, same as html-editor).
//
// Scans raw HTML for data-block="..." markers and extracts:
//   1. Which approved blocks are present and in what order
//   2. Character offsets for each block (for position-aware editing)
//   3. Detected slot values within each block (best-effort extraction)
//
// This bridges the block registry to the visual editor: once we know which
// blocks are on the page, we can offer block-level editing, reordering,
// and insertion.
// ---------------------------------------------------------------------------

import { APPROVED_BLOCKS, type ApprovedBlock } from './block-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedBlock {
  /** The approved block definition */
  block: ApprovedBlock
  /** Character offset where this block's wrapper starts in the HTML */
  startOffset: number
  /** Character offset where this block's wrapper ends */
  endOffset: number
  /** The full HTML of this block section */
  html: string
  /** Best-effort extracted slot values */
  slotValues: Record<string, string>
  /** Ordinal index (0-based) among all detected blocks on the page */
  index: number
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Scan HTML for approved blocks and return detected instances in order.
 *
 * Uses the data-block="..." marker from the registry to find blocks.
 * Also attempts a fallback detection using semantic patterns when
 * data-block attributes are absent (for HTML generated before the
 * block system was introduced).
 */
export function detectBlocks(html: string): DetectedBlock[] {
  const results: DetectedBlock[] = []
  let index = 0

  // ── Primary: data-block attribute detection ─────────────────────────
  const markerRe = /data-block="([^"]+)"/g
  let match: RegExpExecArray | null

  while ((match = markerRe.exec(html)) !== null) {
    const blockId = match[1]
    const blockDef = APPROVED_BLOCKS.find((b) => b.id === blockId)
    if (!blockDef) continue

    // Find the opening tag that contains this data-block attribute
    const tagStart = html.lastIndexOf('<', match.index)
    if (tagStart === -1) continue

    // Find the matching closing tag
    const closingTag = `</${blockDef.wrapperTag}>`
    const closingIdx = html.indexOf(closingTag, match.index)
    if (closingIdx === -1) continue

    const endOffset = closingIdx + closingTag.length
    const blockHtml = html.slice(tagStart, endOffset)

    results.push({
      block: blockDef,
      startOffset: tagStart,
      endOffset,
      html: blockHtml,
      slotValues: extractSlotValues(blockDef, blockHtml),
      index: index++,
    })
  }

  // ── Fallback: semantic detection for legacy/non-marked HTML ─────────
  if (results.length === 0) {
    return detectBlocksFallback(html)
  }

  return results
}

/**
 * Fallback detection for HTML without data-block markers.
 * Uses heuristic tag patterns to map sections to approved blocks.
 */
function detectBlocksFallback(html: string): DetectedBlock[] {
  const results: DetectedBlock[] = []
  let index = 0

  // Nav detection
  const navRe = /<nav\b[^>]*>([\s\S]*?)<\/nav>/gi
  let m: RegExpExecArray | null
  while ((m = navRe.exec(html)) !== null) {
    const block = APPROVED_BLOCKS.find((b) => b.id === 'header-nav')!
    results.push({
      block,
      startOffset: m.index,
      endOffset: m.index + m[0].length,
      html: m[0],
      slotValues: extractSlotValues(block, m[0]),
      index: index++,
    })
  }

  // Footer detection
  const footerRe = /<footer\b[^>]*>([\s\S]*?)<\/footer>/gi
  while ((m = footerRe.exec(html)) !== null) {
    const block = APPROVED_BLOCKS.find((b) => b.id === 'footer')!
    results.push({
      block,
      startOffset: m.index,
      endOffset: m.index + m[0].length,
      html: m[0],
      slotValues: extractSlotValues(block, m[0]),
      index: index++,
    })
  }

  // Section detection — classify by content heuristics
  const sectionRe = /<section\b[^>]*>([\s\S]*?)<\/section>/gi
  while ((m = sectionRe.exec(html)) !== null) {
    const content = m[0].toLowerCase()
    let blockId: string

    if (content.includes('grid-template-columns') && content.includes('<h3')) {
      blockId = 'card-grid'
    } else if (content.includes('<form') || content.includes('<input')) {
      blockId = 'form-section'
    } else if (content.includes('grid-template-columns: 1fr 1fr') || content.includes('two-col')) {
      blockId = 'two-col-content'
    } else if (/<h1\b/i.test(content) && content.includes('linear-gradient')) {
      blockId = 'hero-section'
    } else if (content.includes('text-align: center') && /<h2\b/i.test(content) && content.includes('btn') || content.includes('button')) {
      blockId = 'cta-section'
    } else {
      blockId = 'two-col-content' // default section type
    }

    const block = APPROVED_BLOCKS.find((b) => b.id === blockId)!
    results.push({
      block,
      startOffset: m.index,
      endOffset: m.index + m[0].length,
      html: m[0],
      slotValues: extractSlotValues(block, m[0]),
      index: index++,
    })
  }

  return results.sort((a, b) => a.startOffset - b.startOffset)
}

// ---------------------------------------------------------------------------
// Slot value extraction — best-effort from HTML content
// ---------------------------------------------------------------------------

function extractSlotValues(block: ApprovedBlock, html: string): Record<string, string> {
  const values: Record<string, string> = {}

  for (const slot of block.slots) {
    switch (slot.type) {
      case 'text': {
        const extracted = extractTextSlot(slot.key, block.id, html)
        if (extracted !== null) values[slot.key] = extracted
        break
      }
      case 'items': {
        const items = extractItemsSlot(slot.key, block.id, html)
        if (items !== null) values[slot.key] = items
        break
      }
      default:
        break
    }
  }

  return values
}

/** Extract a text slot value by key + block context */
function extractTextSlot(key: string, blockId: string, html: string): string | null {
  // Map known slot keys to HTML patterns
  const patterns: Record<string, RegExp> = {
    headline: /<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i,
    heading: /<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/i,
    sectionTitle: /<h2\b[^>]*>([\s\S]*?)<\/h2>/i,
    subtitle: /<p\b[^>]*>([\s\S]*?)<\/p>/i,
    sectionSubtitle: /<h2\b[^>]*>[\s\S]*?<\/h2>\s*<p\b[^>]*>([\s\S]*?)<\/p>/i,
    brand: /font-weight:\s*700[^>]*>([^<]+)/i,
    cta: /btn-primary[^>]*>([^<]+)|class="[^"]*btn[^>]*>([^<]+)/i,
    primaryCta: /btn-primary[^>]*>([^<]+)|border-radius[^>]*>([^<]+)/i,
    buttonLabel: /<(?:a|button)\b[^>]*>([^<]+)<\/(?:a|button)>/i,
    submitLabel: /<button[^>]*type="submit"[^>]*>([\s\S]*?)<\/button>/i,
    copyright: /<p\b[^>]*>([^<]*©[^<]*)<\/p>/i,
  }

  const pattern = patterns[key]
  if (!pattern) return null

  const m = pattern.exec(html)
  if (!m) return null

  // Return first captured group that has content
  for (let i = 1; i < m.length; i++) {
    if (m[i]?.trim()) return stripTags(m[i]).trim()
  }
  return null
}

/** Extract items-type slot (nav links, card titles, form fields, etc.) */
function extractItemsSlot(key: string, blockId: string, html: string): string | null {
  if (key === 'links' || key === 'cards') {
    // Extract text from <a> tags or <h3> tags
    const tag = key === 'cards' ? 'h3' : 'a'
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
    const items: string[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      const text = stripTags(m[1]).trim()
      if (text.length > 0 && text.length < 60) items.push(text)
    }
    if (items.length > 0) return items.join(', ')
  }

  if (key === 'fields') {
    // Extract form field labels
    const labelRe = /<label\b[^>]*>([\s\S]*?)<\/label>/gi
    const items: string[] = []
    let m: RegExpExecArray | null
    while ((m = labelRe.exec(html)) !== null) {
      const text = stripTags(m[1]).trim()
      if (text.length > 0) items.push(text)
    }
    if (items.length > 0) return items.join(', ')
  }

  return null
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

// ---------------------------------------------------------------------------
// Utility: get block composition summary
// ---------------------------------------------------------------------------

/**
 * Returns a compact summary of which blocks are on the page and their order.
 * Useful for the intent layer and edit mode prompts.
 */
export function getPageBlockSummary(html: string): string {
  const blocks = detectBlocks(html)
  if (blocks.length === 0) return 'No approved blocks detected.'
  return blocks.map((b, i) => `${i + 1}. ${b.block.name} (${b.block.id})`).join('\n')
}
