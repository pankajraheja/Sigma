// ---------------------------------------------------------------------------
// LoadingState — shared loading indicator for content areas.
//
// Two variants:
//   - 'spinner': centered spinner with optional message (default)
//   - 'skeleton': pulsing skeleton lines for structural loading
// ---------------------------------------------------------------------------

import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  /** Loading message. Defaults to 'Loading…' */
  message?: string
  /** Visual variant */
  variant?: 'spinner' | 'skeleton'
  /** Number of skeleton rows (only for skeleton variant) */
  rows?: number
}

export default function LoadingState({
  message = 'Loading…',
  variant = 'spinner',
  rows = 3,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-3 py-6 px-4 animate-pulse">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 bg-surface-subtle rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-surface-subtle rounded" style={{ width: `${70 - i * 10}%` }} />
              <div className="h-3 bg-surface-subtle rounded" style={{ width: `${50 - i * 5}%` }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={20} className="animate-spin text-ink-faint" />
      <span className="ml-2 text-[13px] text-ink-muted">{message}</span>
    </div>
  )
}
