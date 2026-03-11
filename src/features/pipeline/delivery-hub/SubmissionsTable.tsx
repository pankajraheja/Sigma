// ---------------------------------------------------------------------------
// SubmissionsTable — sortable table of submission records (source-aware).
//
// Renders prototype-lab and solutions-studio rows with different columns.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { ArrowUpDown, Download, Loader2, Beaker, Cpu } from 'lucide-react'
import clsx from 'clsx'
import type { SubmissionListItem } from './types'

type SortKey = 'timestamp' | 'name'
type SortDir = 'asc' | 'desc'

interface SubmissionsTableProps {
  submissions: SubmissionListItem[]
  onRedownload: (id: string) => void
  downloading: string | null
}

/** Get the display name for a submission (brand name or project name) */
function getDisplayName(s: SubmissionListItem): string {
  return s.source === 'solutions-studio' ? s.projectName : s.brandName
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
    if (sortKey === 'name') return dir * getDisplayName(a).localeCompare(getDisplayName(b))
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
          active ? 'text-ink' : 'text-ink-faint hover:text-ink-muted',
        )}
      >
        {label}
        <ArrowUpDown size={11} className={active ? 'text-ink-muted' : 'text-border-strong'} />
      </button>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 text-[13px] text-ink-faint">
        No submissions yet. Export a prototype or hand off a Solutions Studio run to see it here.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Source</span>
            </th>
            <th className="text-left py-2.5 px-3"><SortHeader label="Timestamp" k="timestamp" /></th>
            <th className="text-left py-2.5 px-3"><SortHeader label="Name" k="name" /></th>
            <th className="text-left py-2.5 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Details</span>
            </th>
            <th className="text-left py-2.5 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Summary</span>
            </th>
            <th className="text-right py-2.5 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id} className="border-b border-border-muted hover:bg-surface-subtle transition-colors">
              {/* Source badge */}
              <td className="py-2.5 px-3">
                <SourceBadge source={s.source} />
              </td>

              {/* Timestamp */}
              <td className="py-2.5 px-3 font-mono text-ink-muted whitespace-nowrap">
                {formatDate(s.timestamp)}
              </td>

              {/* Name */}
              <td className="py-2.5 px-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-subtle text-ink font-medium text-[12px]">
                  {getDisplayName(s)}
                </span>
              </td>

              {/* Source-specific details */}
              <td className="py-2.5 px-3">
                {s.source === 'prototype-lab' ? (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-ink font-medium">{s.pageCount} page{s.pageCount !== 1 ? 's' : ''}</span>
                    {s.routeList.length > 0 && (
                      <span className="text-ink-faint ml-1">
                        ({s.routeList.slice(0, 3).join(', ')}{s.routeList.length > 3 ? '…' : ''})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-ink-muted">
                    <span className="font-medium">{s.artifactCount} artifact{s.artifactCount !== 1 ? 's' : ''}</span>
                    {s.provider && (
                      <span className="text-[10px] text-ink-faint">
                        {s.provider.provider} · {s.provider.model}
                      </span>
                    )}
                  </div>
                )}
              </td>

              {/* Summary */}
              <td className="py-2.5 px-3 text-ink-faint max-w-[250px] truncate">{s.readmeSummary}</td>

              {/* Action */}
              <td className="py-2.5 px-3 text-right">
                {s.source === 'prototype-lab' ? (
                  <button
                    type="button"
                    disabled={downloading === s.id || !s.hasPages}
                    onClick={() => onRedownload(s.id)}
                    className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium transition-colors',
                      s.hasPages
                        ? 'bg-primary-900 text-ink-inverse hover:bg-primary-800 disabled:opacity-50'
                        : 'bg-surface-subtle text-ink-faint cursor-not-allowed',
                    )}
                    title={s.hasPages ? 'Re-download ZIP' : 'Page data not available for older submissions'}
                  >
                    {downloading === s.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {downloading === s.id ? 'Zipping…' : 'Download'}
                  </button>
                ) : (
                  <span className="text-[11px] text-ink-faint italic">View only</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SourceBadge({ source }: { source: SubmissionListItem['source'] }) {
  if (source === 'solutions-studio') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
        <Cpu size={9} />
        Studio
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600">
      <Beaker size={9} />
      Prototype
    </span>
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
