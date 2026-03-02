import clsx from 'clsx'
import type { ModuleStatus } from '../../data/types'

interface StatusConfig {
  label: string
  dot: string
  container: string
  text: string
}

const STATUS_CONFIG: Record<ModuleStatus, StatusConfig> = {
  'live': {
    label:     'Live',
    dot:       'bg-success',
    container: 'bg-success-bg border-success/20',
    text:      'text-success',
  },
  'beta': {
    label:     'Beta',
    dot:       'bg-info',
    container: 'bg-info-bg border-info/20',
    text:      'text-info',
  },
  'preview': {
    label:     'Preview',
    dot:       'bg-warning',
    container: 'bg-warning-bg border-warning/20',
    text:      'text-warning',
  },
  'coming-soon': {
    label:     'Coming Soon',
    dot:       'bg-ink-faint',
    container: 'bg-surface-subtle border-border',
    text:      'text-ink-muted',
  },
}

interface StatusBadgeProps {
  status: ModuleStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5',
        'text-[11px] font-semibold tracking-wide rounded-sm border',
        cfg.container,
        cfg.text,
      )}
      aria-label={`Status: ${cfg.label}`}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
