import clsx from 'clsx'
import type { PublicationStatus } from '../types'

interface Config {
  label:     string
  dot:       string
  container: string
  text:      string
}

const STATUS_CONFIG: Record<PublicationStatus, Config> = {
  draft: {
    label:     'Draft',
    dot:       'bg-ink-faint',
    container: 'bg-surface-subtle border-border',
    text:      'text-ink-muted',
  },
  submitted: {
    label:     'Submitted',
    dot:       'bg-warning',
    container: 'bg-warning-bg border-warning/20',
    text:      'text-warning',
  },
  'in-review': {
    label:     'In Review',
    dot:       'bg-info',
    container: 'bg-info-bg border-info/20',
    text:      'text-info',
  },
  approved: {
    label:     'Approved',
    dot:       'bg-success',
    container: 'bg-success-bg border-success/20',
    text:      'text-success',
  },
  deprecated: {
    label:     'Deprecated',
    dot:       'bg-ink-faint',
    container: 'bg-surface-subtle border-border',
    text:      'text-ink-muted',
  },
  archived: {
    label:     'Archived',
    dot:       'bg-ink-faint',
    container: 'bg-surface-subtle border-border',
    text:      'text-ink-faint',
  },
}

interface PublicationStatusBadgeProps {
  status: PublicationStatus
  size?:  'sm' | 'md'
}

export default function PublicationStatusBadge({
  status,
  size = 'md',
}: PublicationStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-sm border font-semibold tracking-wide',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        cfg.container,
        cfg.text,
      )}
      aria-label={`Publication status: ${cfg.label}`}
    >
      <span
        className={clsx('rounded-full shrink-0', cfg.dot,
          size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'
        )}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  )
}
