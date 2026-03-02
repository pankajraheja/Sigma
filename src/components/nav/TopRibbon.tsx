import clsx from 'clsx'
import type { UtilityLink, EnvironmentVariant } from '../../data/types'
import { ENVIRONMENT, UTILITY_LINKS } from '../../config/app.config'

// ── Sub-components ─────────────────────────────────────────────────────────

const ENV_DOT_CLASS: Record<EnvironmentVariant, string> = {
  production:  'bg-success',
  staging:     'bg-warning',
  development: 'bg-ribbon',
}

interface EnvironmentBadgeProps {
  label: string
  variant: EnvironmentVariant
}

function EnvironmentBadge({ label, variant }: EnvironmentBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx('w-1.5 h-1.5 rounded-full shrink-0', ENV_DOT_CLASS[variant])}
        aria-hidden="true"
      />
      <span className="text-[11px] font-semibold tracking-widest uppercase text-ink-inverse/75">
        {label}
      </span>
    </div>
  )
}

function UtilityLinkItem({ label, href }: UtilityLink) {
  return (
    <a
      href={href}
      className="text-[11px] text-ink-inverse/55 hover:text-ink-inverse/90 transition-colors"
    >
      {label}
    </a>
  )
}

// ── TopRibbon ──────────────────────────────────────────────────────────────

interface TopRibbonProps {
  environment?: string
  environmentVariant?: EnvironmentVariant
  utilityLinks?: UtilityLink[]
}

export default function TopRibbon({
  environment       = ENVIRONMENT.label,
  environmentVariant = ENVIRONMENT.variant,
  utilityLinks      = UTILITY_LINKS,
}: TopRibbonProps) {
  return (
    <div
      className="h-7 bg-primary-950 flex items-center px-6 shrink-0"
      role="banner"
      aria-label="Environment and utility bar"
    >
      <EnvironmentBadge label={environment} variant={environmentVariant} />

      <div
        className="ml-auto flex items-center gap-1"
        role="navigation"
        aria-label="Utility links"
      >
        {utilityLinks.map((link, i) => (
          <span key={link.label} className="flex items-center">
            {i > 0 && (
              <span className="mx-2.5 text-ink-inverse/20 select-none" aria-hidden="true">
                |
              </span>
            )}
            <UtilityLinkItem {...link} />
          </span>
        ))}
      </div>
    </div>
  )
}
