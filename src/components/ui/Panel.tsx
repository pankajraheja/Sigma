import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type React from 'react'

/**
 * Panel — compact data surface for governance controls, previews, and dashboards.
 * Tighter spacing than Card; content is row-based rather than prose.
 *
 *   <Panel title="Taxonomy" Icon={Network} meta="3 levels">
 *     <PanelRow>…</PanelRow>
 *   </Panel>
 */

export interface PanelProps {
  title: string
  Icon: LucideIcon
  meta?: string
  children: React.ReactNode
}

export function Panel({ title, Icon, meta, children }: PanelProps) {
  return (
    <div className="flex flex-col bg-surface border border-border rounded-md shadow-card overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-subtle border-b border-border-muted shrink-0">
        <div className="flex items-center gap-2">
          <Icon
            size={12}
            strokeWidth={2}
            className="text-primary-600 shrink-0"
            aria-hidden="true"
          />
          <span className="text-[12px] font-semibold text-ink">{title}</span>
        </div>
        {meta && (
          <span className="text-[10px] text-ink-faint tabular-nums">{meta}</span>
        )}
      </div>

      {/* Panel body */}
      <div className="flex flex-col flex-1">{children}</div>
    </div>
  )
}

export interface PanelRowProps {
  children: React.ReactNode
  className?: string
}

export function PanelRow({ children, className }: PanelRowProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-4 py-1.5 text-[12px]',
        'border-b border-border-muted last:border-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
