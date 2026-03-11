// ---------------------------------------------------------------------------
// useVisualEditor — manages visual editing state for the selected page.
//
// Parses the page's HTML into editable regions on mount/change, tracks
// pending edits, and commits them with brand validation.
//
// Flow: parseEditableRegions → user edits inline → commitEdits → applyEdits
//       → validateBrandHtml → updatePage
// ---------------------------------------------------------------------------

import { useState, useCallback, useMemo } from 'react'
import { parseEditableRegions, applyEdits, type EditableRegion, type EditOperation } from '../lib/html-editor'
import { detectBlocks, type DetectedBlock } from '../lib/block-parser'
import { validateBrandHtml, type BrandValidationConfig } from '../../../lib/brand-validation'

interface UseVisualEditorOptions {
  html: string
  pageId: string
  brandValidationConfig: BrandValidationConfig | null
  updatePage: (id: string, html: string) => void
}

export interface VisualEditorState {
  /** All editable regions parsed from the current HTML */
  regions: EditableRegion[]
  /** Pending edits keyed by region id */
  pendingEdits: Record<string, string>
  /** Whether there are uncommitted edits */
  dirty: boolean
  /** Currently focused region id */
  activeRegionId: string | null
  /** Last commit's brand violations (reset on next commit) */
  lastViolationCount: number
}

export function useVisualEditor({ html, pageId, brandValidationConfig, updatePage }: UseVisualEditorOptions) {
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({})
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null)
  const [lastViolationCount, setLastViolationCount] = useState(0)

  // Parse regions from current HTML — re-computed when html changes
  const regions = useMemo(() => {
    if (!html) return []
    return parseEditableRegions(html)
  }, [html])

  // Detect approved blocks in the HTML
  const blocks = useMemo(() => {
    if (!html) return []
    return detectBlocks(html)
  }, [html])

  const dirty = Object.keys(pendingEdits).length > 0

  // Stage an edit for a region
  const editRegion = useCallback((regionId: string, newValue: string) => {
    setPendingEdits((prev) => {
      // If the value matches the current region value, remove the pending edit
      const region = regions.find((r) => r.id === regionId)
      if (region && newValue === region.value) {
        const next = { ...prev }
        delete next[regionId]
        return next
      }
      return { ...prev, [regionId]: newValue }
    })
  }, [regions])

  // Discard all pending edits
  const discardEdits = useCallback(() => {
    setPendingEdits({})
    setActiveRegionId(null)
    setLastViolationCount(0)
  }, [])

  // Commit all pending edits → apply to HTML → validate → update page
  const commitEdits = useCallback(() => {
    if (!dirty || regions.length === 0) return

    const ops: EditOperation[] = Object.entries(pendingEdits).map(([regionId, newValue]) => ({
      regionId,
      newValue,
    }))

    let updated = applyEdits(html, ops, regions)

    // Run brand validation as safety net
    let violationCount = 0
    if (brandValidationConfig) {
      const validation = validateBrandHtml(updated, brandValidationConfig)
      updated = validation.html
      violationCount = validation.violations.length
    }

    updatePage(pageId, updated)
    setPendingEdits({})
    setLastViolationCount(violationCount)
  }, [dirty, pendingEdits, html, regions, brandValidationConfig, updatePage, pageId])

  return {
    regions,
    blocks,
    pendingEdits,
    dirty,
    activeRegionId,
    lastViolationCount,
    setActiveRegionId,
    editRegion,
    discardEdits,
    commitEdits,
  }
}
