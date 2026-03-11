// ---------------------------------------------------------------------------
// SubmitButton — exports prototype as ZIP and saves a submission record.
//
// On click:
//   1. Collect all PrototypePage objects from context
//   2. Generate README.md from pages + brandConfig
//   3. Build ZIP: /prototype-export/README.md, /pages/*.html, /config/brand-config.json
//   4. Trigger browser download
//   5. POST submission record to /api/submissions
// ---------------------------------------------------------------------------

import { useState } from 'react'
import JSZip from 'jszip'
import { Download, Loader2, CheckCircle2 } from 'lucide-react'
import { usePrototype } from '../PrototypeContext'
import { useBrand } from '../../brand/BrandContext'
import { generateReadme } from '../../../lib/generateReadme'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert route to filename: "/" → "index.html", "/pricing" → "pricing.html" */
function routeToFilename(route: string): string {
  if (route === '/') return 'index.html'
  return `${route.replace(/^\//, '').replace(/\//g, '-')}.html`
}

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function postSubmission(record: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(body.message ?? `Submission failed (${res.status})`)
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ExportState = 'idle' | 'exporting' | 'done' | 'error'

export default function SubmitButton() {
  const { pages } = usePrototype()
  const { currentBrand, brandKey } = useBrand()
  const [state, setState] = useState<ExportState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(null)

  // Only export pages that have generated content
  const exportablePages = pages.filter((p) => p.html.length > 0)
  const disabled = exportablePages.length === 0 || !currentBrand || state === 'exporting'

  async function handleExport() {
    if (!currentBrand || exportablePages.length === 0) return

    setState('exporting')
    setError(null)
    setSubmissionWarning(null)

    try {
      // 1. Generate README (only exportable pages)
      const appName = `${currentBrand.companyName} Prototype`
      const readme = generateReadme(appName, exportablePages, currentBrand)

      // 2. Build ZIP (only exportable pages)
      const zip = new JSZip()
      const root = zip.folder('prototype-export')!

      root.file('README.md', readme)
      root.file('config/brand-config.json', JSON.stringify(currentBrand, null, 2))

      const pagesFolder = root.folder('pages')!
      for (const page of exportablePages) {
        pagesFolder.file(routeToFilename(page.route), page.html)
      }

      // 3. Trigger download
      const blob = await zip.generateAsync({ type: 'blob' })
      const timestamp = Date.now()
      const filename = `prototype-${timestamp}.zip`

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      // 4. POST submission record (exportable pages only)
      const record = {
        id: generateId(),
        source: 'prototype-lab' as const,
        timestamp: new Date().toISOString(),
        pageCount: exportablePages.length,
        brandName: brandKey,
        readmeSummary: `${exportablePages.length} page${exportablePages.length > 1 ? 's' : ''} exported using ${currentBrand.companyName} brand`,
        routeList: exportablePages.map((p) => p.route),
        pages: exportablePages.map((p) => ({ route: p.route, title: p.title, description: p.description, html: p.html })),
        brandConfig: currentBrand,
      }

      // Non-blocking submission — surface failure as warning since download succeeded
      postSubmission(record).catch((err) => {
        console.warn('[SubmitButton] Submission record save failed:', err)
        setSubmissionWarning('Download succeeded but submission record was not saved.')
      })

      setState('done')
      setTimeout(() => setState('idle'), 2500)
    } catch (err) {
      console.error('[SubmitButton] Export failed:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={handleExport}
        className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
          state === 'done'
            ? 'bg-green-600 text-white'
            : state === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-primary-900 text-ink-inverse hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {state === 'exporting' && <Loader2 size={14} className="animate-spin" />}
        {state === 'done' && <CheckCircle2 size={14} />}
        {state === 'idle' && <Download size={14} />}
        {state === 'error' && <Download size={14} />}

        {state === 'exporting' ? 'Exporting…' : state === 'done' ? 'Exported' : 'Export Prototype'}
      </button>

      {error && state === 'error' && (
        <span className="text-[11px] text-red-500">{error}</span>
      )}

      {submissionWarning && (
        <span className="text-[11px] text-amber-500">{submissionWarning}</span>
      )}

      {exportablePages.length === 0 && state === 'idle' && (
        <span className="text-[11px] text-ink-faint">No pages to export</span>
      )}
    </div>
  )
}
