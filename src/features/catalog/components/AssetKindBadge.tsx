import clsx from 'clsx'

interface Config {
  label:   string
  classes: string
}

const KIND_CONFIG: Record<string, Config> = {
  Dataset:   { label: 'Dataset',   classes: 'bg-primary-50 text-primary-600 border-primary-200' },
  API:       { label: 'API',       classes: 'bg-info-bg text-info border-info/20' },
  Report:    { label: 'Report',    classes: 'bg-surface-subtle text-primary-600 border-primary-100' },
  Model:     { label: 'Model',     classes: 'bg-warning-bg text-warning border-warning/20' },
  Dashboard: { label: 'Dashboard', classes: 'bg-success-bg text-success border-success/20' },
  Pipeline:  { label: 'Pipeline',  classes: 'bg-surface-subtle text-ink border-border-strong' },
  Template:  { label: 'Template',  classes: 'bg-surface-subtle text-ink-muted border-border' },
  Skill:     { label: 'Skill',     classes: 'bg-warning-bg text-warning border-warning/30' },
  Connector: { label: 'Connector', classes: 'bg-info-bg text-info border-info/30' },
}

const FALLBACK_CLASSES = 'bg-surface-subtle text-ink-muted border-border'

interface AssetKindBadgeProps {
  kind:  string
  size?: 'sm' | 'md'
}

export default function AssetKindBadge({ kind, size = 'md' }: AssetKindBadgeProps) {
  const cfg = KIND_CONFIG[kind] ?? { label: kind, classes: FALLBACK_CLASSES }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sm border font-semibold',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        cfg.classes,
      )}
    >
      {cfg.label}
    </span>
  )
}
