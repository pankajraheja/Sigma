// ---------------------------------------------------------------------------
// GovernanceDashboard — Admin Control Center landing page.
//
// Shows all governance domains as navigable cards. Each domain links to its
// dedicated management page. This is the entry point for platform governance.
// ---------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Palette,
  Layers,
  PenTool,
  Code2,
  ChevronRight,
  Shield,
} from 'lucide-react'
import PageShell, { PageContent } from '../../components/shell/PageShell'
import PageHeader from '../../components/shell/PageHeader'
import {
  GOVERNANCE_DOMAINS,
  GOVERNANCE_DOMAIN_META,
  type GovernanceDomain,
  type GovernanceDomainMeta,
} from '../../shared/types/governance'

// ---------------------------------------------------------------------------
// Icon resolver — maps domain iconName to Lucide component
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, typeof Settings> = {
  Palette,
  Layers,
  PenTool,
  Code2,
}

function getIcon(iconName: string) {
  return ICON_MAP[iconName] ?? Settings
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GovernanceDashboard() {
  const navigate = useNavigate()

  return (
    <PageShell>
      <PageHeader
        icon={Shield}
        title="Platform Governance"
        subtitle="Configure shared standards, policies, and constraints across SigAI modules"
      />

      <PageContent className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOVERNANCE_DOMAINS.map((domainId) => {
            const meta = GOVERNANCE_DOMAIN_META[domainId]
            return (
              <DomainCard
                key={domainId}
                meta={meta}
                onNavigate={() => navigate(meta.route)}
              />
            )
          })}
        </div>

        {/* Future domains hint */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-ink-faint">
            Additional governance domains (RBAC, provider policies, deployment governance, audit history)
            will be available in future releases.
          </p>
        </div>
      </PageContent>
    </PageShell>
  )
}

// ---------------------------------------------------------------------------
// DomainCard
// ---------------------------------------------------------------------------

function DomainCard({
  meta,
  onNavigate,
}: {
  meta: GovernanceDomainMeta
  onNavigate: () => void
}) {
  const Icon = getIcon(meta.iconName)
  const isComingSoon = meta.status === 'coming-soon'

  return (
    <button
      type="button"
      onClick={onNavigate}
      disabled={meta.status === 'disabled'}
      className={`relative flex items-start gap-4 p-5 rounded-lg border text-left transition-all ${
        isComingSoon
          ? 'border-border bg-surface hover:border-border-strong hover:shadow-card cursor-pointer'
          : meta.status === 'disabled'
            ? 'border-border-muted bg-surface-subtle opacity-50 cursor-not-allowed'
            : 'border-border bg-surface hover:border-border-strong hover:shadow-card cursor-pointer'
      }`}
    >
      {/* Icon */}
      <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${
        isComingSoon ? 'bg-surface-subtle' : 'bg-surface-subtle'
      }`}>
        <Icon size={18} className={isComingSoon ? 'text-ink-faint' : 'text-ink-muted'} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[13px] font-semibold ${
            isComingSoon ? 'text-ink-muted' : 'text-ink'
          }`}>
            {meta.label}
          </span>
          <StatusBadge status={meta.status} />
        </div>

        <p className={`text-[11px] leading-relaxed mb-2.5 ${
          isComingSoon ? 'text-ink-faint' : 'text-ink-muted'
        }`}>
          {meta.description}
        </p>

        {/* Consumer modules */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-ink-faint uppercase tracking-wider font-medium">Used by:</span>
          {meta.consumers.map((c) => (
            <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-subtle text-ink-muted font-medium">
              {formatModuleName(c)}
            </span>
          ))}
        </div>
      </div>

      {/* Arrow */}
      {meta.status !== 'disabled' && (
        <ChevronRight size={14} className="shrink-0 mt-1 text-ink-faint" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: GovernanceDomainMeta['status'] }) {
  if (status === 'active') {
    return (
      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium border border-green-200">
        Active
      </span>
    )
  }
  if (status === 'coming-soon') {
    return (
      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200">
        Coming Soon
      </span>
    )
  }
  return null
}

function formatModuleName(id: string): string {
  const names: Record<string, string> = {
    'prototype-builder': 'Prototype Lab',
    'app-builder': 'Solutions Studio',
    catalog: 'AI Navigator',
  }
  return names[id] ?? id
}
