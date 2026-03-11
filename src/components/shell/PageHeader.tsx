// ---------------------------------------------------------------------------
// PageHeader — shared header bar for content-mode module pages.
//
// Renders a consistent header strip with icon, title, subtitle, and optional
// actions/badges. Sits at the top of a PageShell, above PageContent.
//
// Design tokens used:
//   bg-surface, border-border, text-ink, text-ink-muted, bg-surface-subtle
// ---------------------------------------------------------------------------

interface PageHeaderProps {
  /** Lucide icon component */
  icon: React.ElementType
  /** Page title */
  title: string
  /** Short subtitle/description */
  subtitle?: string
  /** Max content width — should match the PageContent maxWidth */
  maxWidth?: '5xl' | '6xl' | '7xl'
  /** Right-side slot for actions, badges, or status indicators */
  actions?: React.ReactNode
  /** Optional back button handler (renders ← arrow before icon) */
  onBack?: () => void
}

const MAX_WIDTH_MAP = {
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
} as const

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  maxWidth = '5xl',
  actions,
  onBack,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-surface px-6 py-4">
      <div className={`mx-auto ${MAX_WIDTH_MAP[maxWidth]} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-md hover:bg-surface-subtle transition-colors text-ink-muted"
              aria-label="Go back"
            >
              <BackArrow />
            </button>
          )}
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-subtle">
            <Icon size={16} className="text-ink-muted" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-ink">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-ink-muted">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

function BackArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}
