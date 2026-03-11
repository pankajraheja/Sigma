// ---------------------------------------------------------------------------
// PageShell — shared page container for content-mode module pages.
//
// Provides consistent background, max-width constraint, and vertical spacing.
// Used by Delivery Hub, Admin pages, Vizier, and other non-workspace modules.
//
// Workspace modules (Prototype Lab, Solutions Studio) use full-height panel
// layouts and do NOT use this shell.
// ---------------------------------------------------------------------------

interface PageShellProps {
  children: React.ReactNode
  /** Max content width. Defaults to '5xl'. Use '7xl' for data-heavy pages. */
  maxWidth?: '5xl' | '6xl' | '7xl'
}

const MAX_WIDTH_MAP = {
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
} as const

export default function PageShell({ children, maxWidth = '5xl' }: PageShellProps) {
  return (
    <div className="min-h-full bg-surface-raised">
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PageShell.Content — constrained-width content area with standard padding
// ---------------------------------------------------------------------------

export function PageContent({
  children,
  maxWidth = '5xl',
  className = '',
}: {
  children: React.ReactNode
  maxWidth?: '5xl' | '6xl' | '7xl'
  className?: string
}) {
  return (
    <div className={`mx-auto ${MAX_WIDTH_MAP[maxWidth]} px-6 py-6 ${className}`}>
      {children}
    </div>
  )
}
