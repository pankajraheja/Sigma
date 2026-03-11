// ---------------------------------------------------------------------------
// SolutionsGovernancePage — Admin governance for Solutions Studio.
//
// Phase 1: read-only display of governance contracts and defaults.
// Shows the config shape and default values so admins can see what
// governance will be available when Solutions Studio governance goes live.
// ---------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom'
import {
  Code2,
  Shield,
  Layers,
  Rocket,
  GitBranch,
  Clock,
} from 'lucide-react'
import PageShell, { PageContent } from '../../../components/shell/PageShell'
import PageHeader from '../../../components/shell/PageHeader'
import {
  DEFAULT_SOLUTIONS_GOVERNANCE,
  type SolutionsGovernanceConfig,
} from '../../../shared/types/governance'

export default function SolutionsGovernancePage() {
  const navigate = useNavigate()
  const config = DEFAULT_SOLUTIONS_GOVERNANCE

  return (
    <PageShell>
      <PageHeader
        icon={Code2}
        title="Solutions Governance"
        subtitle="Configure templates, stacks, workflow constraints, and deployment targets for Solutions Studio"
        onBack={() => navigate('/admin')}
        actions={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200">
            Coming Soon
          </span>
        }
      />

      <PageContent className="space-y-6">
        {/* Coming soon banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-medium text-amber-800">
              Solutions governance is in preview
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              The configuration contracts below show what governance controls will be available.
              Solutions Studio currently runs with permissive defaults. Full admin-managed governance
              will be enabled in a future release.
            </p>
          </div>
        </div>

        {/* Pipeline constraints */}
        <Section icon={Shield} title="Pipeline Constraints">
          <div className="grid grid-cols-2 gap-4">
            <ConfigRow
              label="Max Concurrent Runs"
              value={String(config.maxConcurrentRuns)}
            />
            <ConfigRow
              label="Review Stage"
              value={config.requireReview ? 'Required' : 'Optional'}
            />
            <ConfigRow
              label="Packaging Stage"
              value={config.requirePackaging ? 'Required' : 'Optional'}
            />
            <ConfigRow
              label="Allowed Stacks"
              value={config.allowedStacks ? `${config.allowedStacks.length} stacks` : 'Unrestricted'}
            />
          </div>
        </Section>

        {/* Solution templates */}
        <Section icon={Layers} title="Solution Templates">
          {config.allowedTemplates.length > 0 ? (
            <div className="space-y-2">
              {config.allowedTemplates.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-md border border-border">
                  <div>
                    <span className="text-[12px] font-medium text-ink">{t.label}</span>
                    <p className="text-[10px] text-ink-faint mt-0.5">{t.description}</p>
                  </div>
                  <span className={`text-[10px] font-medium ${t.enabled ? 'text-success' : 'text-ink-faint'}`}>
                    {t.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPlaceholder
              title="No templates configured"
              description="Solution templates will allow admins to pre-define approved project scaffolds with technology stack, architecture patterns, and compliance requirements."
            />
          )}
        </Section>

        {/* Deployment targets */}
        <Section icon={Rocket} title="Deployment Targets">
          {config.deploymentTargets.length > 0 ? (
            <div className="space-y-2">
              {config.deploymentTargets.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-md border border-border">
                  <div>
                    <span className="text-[12px] font-medium text-ink">{t.label}</span>
                    <p className="text-[10px] text-ink-faint mt-0.5">{t.environment} — {t.description}</p>
                  </div>
                  <span className={`text-[10px] font-medium ${t.enabled ? 'text-success' : 'text-ink-faint'}`}>
                    {t.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPlaceholder
              title="No deployment targets configured"
              description="Deployment targets will define where Solutions Studio outputs can be deployed — development, staging, or production environments with specific infrastructure constraints."
            />
          )}
        </Section>

        {/* Future governance areas */}
        <Section icon={GitBranch} title="Future Governance Areas">
          <div className="space-y-2">
            <FutureItem label="Provider Governance" description="Control which AI providers and models are allowed for pipeline runs" />
            <FutureItem label="Workflow Constraints" description="Define mandatory stages, approval gates, and SLA requirements" />
            <FutureItem label="Cost Controls" description="Set budget limits and cost allocation policies for pipeline runs" />
            <FutureItem label="Compliance Policies" description="Enforce data classification, PII handling, and regulatory requirements" />
          </div>
        </Section>
      </PageContent>
    </PageShell>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-muted">
        <Icon size={14} className="text-ink-muted" />
        <span className="text-[13px] font-semibold text-ink">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-subtle">
      <span className="text-[11px] text-ink-muted">{label}</span>
      <span className="text-[11px] font-medium text-ink">{value}</span>
    </div>
  )
}

function EmptyPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-6 px-4">
      <p className="text-[12px] font-medium text-ink-muted">{title}</p>
      <p className="text-[11px] text-ink-faint mt-1 max-w-md mx-auto">{description}</p>
    </div>
  )
}

function FutureItem({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-md bg-surface-subtle">
      <div className="w-1.5 h-1.5 rounded-full bg-border-strong shrink-0 mt-1.5" />
      <div>
        <span className="text-[11px] font-medium text-ink-muted">{label}</span>
        <p className="text-[10px] text-ink-faint mt-0.5">{description}</p>
      </div>
    </div>
  )
}
