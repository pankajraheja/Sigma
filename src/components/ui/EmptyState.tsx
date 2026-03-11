// ---------------------------------------------------------------------------
// EmptyState — shared empty/zero-state component for content areas.
//
// Used across modules when a list, table, or panel has no data to show.
// Supports optional icon, title, description, and action slot.
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  /** Lucide icon component (optional) */
  icon?: React.ElementType
  /** Primary message */
  title: string
  /** Supporting description */
  description?: string
  /** Action slot — button, link, etc. */
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-subtle mb-3">
          <Icon size={18} className="text-ink-faint" />
        </div>
      )}
      <p className="text-[13px] font-medium text-ink-muted">{title}</p>
      {description && (
        <p className="text-[11px] text-ink-faint mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
