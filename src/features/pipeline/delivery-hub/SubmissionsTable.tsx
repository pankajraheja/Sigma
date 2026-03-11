// ---------------------------------------------------------------------------
// SubmissionsTable — sortable table of prototype submission records.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { ArrowUpDown, Download, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { SubmissionListItem } from './types'

type SortKey = 'timestamp' | 'brandName' | 'pageCount'
type SortDir = 'asc' | 'desc'

interface SubmissionsTableProps {
  submissions: SubmissionListItem[]
  onRedownload: (id: string) => void
  downloading: string | null
}

export default function SubmissionsTable({ submissions, onRedownload, downloading }: SubmissionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...submissions].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'timestamp') return dir * a.timestamp.localeCompare(b.timestamp)
    if (sortKey === 'brandName') return dir * a.brandName.localeCompare(b.brandName)
    if (sortKey === 'pageCount') return dir * (a.pageCount - b.pageCount)
    return 0
  })

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k
    return (
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={clsx(
          'inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide',
          active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
        )}
      >
        {label}
        <ArrowUpDown size={11} className={active ? 'text-gray-700' : 'text-gray-300'} />
      </button>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 text-[13px] text-gray-400">
        No submissions yet. Export a prototype from the Prototype Lab to see it here.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2.5 px-3"><SortHeader label="Timestamp" k="timestamp" /></th>
            <th className="text-left py-2.5 px-3"><SortHeader label="Brand" k="brandName" /></th>
            <th className="text-left py-2.5 px-3"><SortHeader label="Pages" k="pageCount" /></th>
            <th className="text-left py-2.5 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Routes</span>
            </th>
            <th className="text-left py-2.5 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Summary</span>
            </th>
            <th className="text-right py-2.5 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-2.5 px-3 font-mono text-gray-600 whitespace-nowrap">
                {formatDate(s.timestamp)}
              </td>
              <td className="py-2.5 px-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[12px] font-medium">
                  {s.brandName}
                </span>
              </td>
              <td className="py-2.5 px-3 text-gray-700 font-medium">{s.pageCount}</td>
              <td className="py-2.5 px-3">
                <div className="flex flex-wrap gap-1">
                  {s.routeList.map((route) => (
                    <code key={route} className="px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600">
                      {route}
                    </code>
                  ))}
                </div>
              </td>
              <td className="py-2.5 px-3 text-gray-500 max-w-[250px] truncate">{s.readmeSummary}</td>
              <td className="py-2.5 px-3 text-right">
                <button
                  type="button"
                  disabled={downloading === s.id || !s.hasPages}
                  onClick={() => onRedownload(s.id)}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium transition-colors',
                    s.hasPages
                      ? 'bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                  )}
                  title={s.hasPages ? 'Re-download ZIP' : 'Page data not available for older submissions'}
                >
                  {downloading === s.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  {downloading === s.id ? 'Zipping…' : 'Download'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
