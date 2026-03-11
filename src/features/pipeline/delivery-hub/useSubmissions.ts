// ---------------------------------------------------------------------------
// useSubmissions — fetches submission list and handles re-download.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react'
import JSZip from 'jszip'
import type { SubmissionListItem, SubmissionDetail } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function routeToFilename(route: string): string {
  if (route === '/') return 'index.html'
  return `${route.replace(/^\//, '').replace(/\//g, '-')}.html`
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/submissions')
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
      const body = (await res.json()) as { data: Array<Record<string, unknown>> }
      const items: SubmissionListItem[] = body.data.map((s) => ({
        id: s.id as string,
        timestamp: (s.createdAt ?? s.timestamp) as string,
        pageCount: s.pageCount as number,
        brandName: s.brandName as string,
        readmeSummary: (s.readmeSummary ?? '') as string,
        routeList: (s.routeList ?? []) as string[],
        hasPages: Array.isArray(s.pages) && (s.pages as unknown[]).length > 0,
      }))
      setSubmissions(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const redownload = useCallback(async (id: string) => {
    setDownloading(id)
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error(`Failed to fetch submission (${res.status})`)
      const body = (await res.json()) as { data: SubmissionDetail }
      const detail = body.data

      if (!detail.pages?.length) {
        throw new Error('Page data not available for this submission')
      }

      const zip = new JSZip()
      const root = zip.folder('prototype-export')!

      // README
      const readmeLines = [
        `# ${detail.brandName} Prototype (Re-download)`,
        '',
        `> Originally exported: ${detail.timestamp}`,
        `> Pages: ${detail.pageCount}`,
        `> Routes: ${detail.routeList.join(', ')}`,
        '',
        detail.readmeSummary,
        '',
        '---',
        '*Re-downloaded from SigAI Delivery Hub*',
      ]
      root.file('README.md', readmeLines.join('\n'))

      // Brand config
      if (detail.brandConfig) {
        root.file('config/brand-config.json', JSON.stringify(detail.brandConfig, null, 2))
      }

      // Pages
      const pagesFolder = root.folder('pages')!
      for (const page of detail.pages) {
        pagesFolder.file(routeToFilename(page.route), page.html)
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `prototype-${id}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('[DeliveryHub] Re-download failed:', err)
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Re-download failed')
    } finally {
      setDownloading(null)
    }
  }, [])

  return { submissions, loading, error, downloading, redownload, refresh: fetchSubmissions }
}
