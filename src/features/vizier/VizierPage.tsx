// ---------------------------------------------------------------------------
// VizierPage — Governance + Reporting + Evaluation + Portfolio Intelligence
// Placeholder implementation — sections defined, no live data yet.
// ---------------------------------------------------------------------------

import {
  ShieldCheck,
  FileBarChart2,
  FlaskConical,
  LayoutGrid,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import PageShell, { PageContent } from '../../components/shell/PageShell'
import PageHeader from '../../components/shell/PageHeader'

// ---------------------------------------------------------------------------
// Shared inner-card primitives
// ---------------------------------------------------------------------------

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <Icon size={15} className="text-primary-600 shrink-0" />
        <h2 className="text-[13px] font-semibold text-ink tracking-tight">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function PlaceholderRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-[12px] text-ink-muted">{label}</span>
      <span className={`text-[12px] font-medium ${accent ? 'text-primary-600' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  )
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-bg border border-border rounded-md px-4 py-3">
      <p className="text-[10px] text-ink-faint uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[20px] font-semibold text-ink leading-none">{value}</p>
      {sub && <p className="text-[10px] text-ink-faint mt-1">{sub}</p>}
    </div>
  )
}

function ComingSoonOverlay() {
  return (
    <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-bg border border-border rounded-md">
      <Clock size={12} className="text-ink-faint shrink-0" />
      <span className="text-[11px] text-ink-faint">Live data connects when backend APIs ship</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section — Governance Status
// ---------------------------------------------------------------------------

function GovernanceStatusSection() {
  return (
    <SectionCard icon={ShieldCheck} title="Governance Status">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatTile label="Assets under governance" value="—" sub="Loading once wired" />
        <StatTile label="Policy violations" value="—" sub="0 critical" />
        <StatTile label="Compliance score" value="—" sub="Target ≥ 95%" />
        <StatTile label="Pending reviews" value="—" sub="Awaiting assignment" />
      </div>

      <PlaceholderRow label="GDPR-covered assets" value="—" />
      <PlaceholderRow label="PII-flagged assets without DPA" value="—" accent />
      <PlaceholderRow label="Access policy coverage" value="—" />
      <PlaceholderRow label="Last full governance scan" value="—" />

      <ComingSoonOverlay />
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Section — Reporting & Metrics
// ---------------------------------------------------------------------------

function ReportingSection() {
  const reports = [
    { name: 'Monthly Asset Register', status: 'Scheduled' },
    { name: 'Compliance Summary Report', status: 'Scheduled' },
    { name: 'Usage & Adoption Dashboard', status: 'In design' },
    { name: 'Audit Trail Export', status: 'Planned' },
  ]

  return (
    <SectionCard icon={FileBarChart2} title="Reporting & Metrics">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatTile label="Reports generated (30 d)" value="—" />
        <StatTile label="Avg. time to certification" value="—" sub="Days" />
      </div>

      <p className="text-[11px] font-medium text-ink-muted mb-2 uppercase tracking-wider">
        Planned reports
      </p>
      <div className="space-y-1">
        {reports.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <span className="text-[12px] text-ink">{r.name}</span>
            <span className="text-[10px] text-ink-faint border border-border rounded px-1.5 py-0.5">
              {r.status}
            </span>
          </div>
        ))}
      </div>

      <ComingSoonOverlay />
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Section — Evaluation Insights
// ---------------------------------------------------------------------------

function EvaluationSection() {
  const dimensions = [
    'Accuracy / F1',
    'Fairness & bias',
    'Robustness',
    'Latency (p95)',
    'Drift detection',
  ]

  return (
    <SectionCard icon={FlaskConical} title="Evaluation Insights">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatTile label="Models evaluated" value="—" />
        <StatTile label="Pass rate" value="—" sub="Last 30 d" />
        <StatTile label="Flagged for re-eval" value="—" />
      </div>

      <p className="text-[11px] font-medium text-ink-muted mb-2 uppercase tracking-wider">
        Tracked dimensions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {dimensions.map((d) => (
          <span
            key={d}
            className="text-[11px] text-ink-muted border border-border rounded-full px-2.5 py-0.5"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 bg-bg border border-border rounded-md">
        <AlertTriangle size={12} className="text-warning mt-0.5 shrink-0" />
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Evaluation pipelines connect to assets registered in AI Navigator. Results will surface
          here once Delivery Hub certification runs are wired.
        </p>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Section — Portfolio Intelligence
// ---------------------------------------------------------------------------

function PortfolioSection() {
  const kinds = ['model', 'dataset', 'api', 'application', 'workflow', 'template', 'prototype']

  return (
    <SectionCard icon={LayoutGrid} title="Portfolio Intelligence">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatTile label="Total certified assets" value="—" />
        <StatTile label="Assets added (30 d)" value="—" />
        <StatTile label="Domains covered" value="—" />
        <StatTile label="Operating companies" value="—" />
      </div>

      <p className="text-[11px] font-medium text-ink-muted mb-2 uppercase tracking-wider">
        Asset kinds tracked
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {kinds.map((k) => (
          <span
            key={k}
            className="text-[11px] text-ink border border-border rounded px-2 py-0.5 capitalize"
          >
            {k}
          </span>
        ))}
      </div>

      <PlaceholderRow label="Fastest growing domain" value="—" accent />
      <PlaceholderRow label="Most reused asset kind" value="—" />
      <PlaceholderRow label="Assets without owner" value="—" accent />

      <ComingSoonOverlay />
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Section — Cost & Usage Trends
// ---------------------------------------------------------------------------

function CostUsageSection() {
  const signals = [
    { label: 'API calls (30 d)', value: '—' },
    { label: 'AI token usage (30 d)', value: '—' },
    { label: 'Avg. cost per asset query', value: '—' },
    { label: 'Top consumer by OpCo', value: '—' },
    { label: 'Infra spend (estimated)', value: '—' },
  ]

  return (
    <SectionCard icon={TrendingUp} title="Cost & Usage Trends">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatTile label="Active users (30 d)" value="—" />
        <StatTile label="Search queries (30 d)" value="—" />
      </div>

      {signals.map((s) => (
        <PlaceholderRow key={s.label} label={s.label} value={s.value} />
      ))}

      <div className="mt-4 flex items-center gap-2 p-3 bg-bg border border-border rounded-md">
        <CheckCircle2 size={12} className="text-success shrink-0" />
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Cost telemetry will aggregate from AI Navigator AI calls, Agent Forge runs, and
          Delivery Hub pipeline executions.
        </p>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function VizierPage() {
  return (
    <PageShell>
      <PageHeader
        icon={BarChart3}
        title="Vizier"
        subtitle="Governance, reporting, evaluation, and portfolio intelligence for the SigAI platform"
        actions={<StatusBadge status="preview" />}
      />

      <PageContent className="py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GovernanceStatusSection />
          <ReportingSection />
          <EvaluationSection />
          <PortfolioSection />
          <div className="lg:col-span-2">
            <CostUsageSection />
          </div>
        </div>
      </PageContent>
    </PageShell>
  )
}
