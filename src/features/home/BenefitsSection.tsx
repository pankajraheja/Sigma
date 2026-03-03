import { Zap, GitMerge, ShieldCheck, Repeat2, Layers, Eye } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ── Data ────────────────────────────────────────────────────────────────────

interface Benefit {
  id: string
  Icon: LucideIcon
  headline: string
  body: string
}

const BENEFITS: Benefit[] = [
  {
    id: 'speed',
    Icon: Zap,
    headline: 'Faster Delivery',
    body: 'Governed scaffolding and approved templates cut new application time-to-production from weeks to days.',
  },
  {
    id: 'consistency',
    Icon: GitMerge,
    headline: 'Enforced Consistency',
    body: 'Every module enforces the same taxonomy, metadata schema, and tagging standards. No drift. No exceptions.',
  },
  {
    id: 'governance',
    Icon: ShieldCheck,
    headline: 'Policy-First Governance',
    body: 'RBAC, audit trails, and approval gates are embedded in the platform — not retrofitted after delivery.',
  },
  {
    id: 'reuse',
    Icon: Repeat2,
    headline: 'Maximum Reuse',
    body: 'Skills, connectors, templates, and components are published once and consumed across all modules and teams.',
  },
  {
    id: 'scalability',
    Icon: Layers,
    headline: 'Horizontal Scalability',
    body: 'New modules, teams, and integrations extend the platform without disrupting the governance or taxonomy foundation.',
  },
  {
    id: 'auditability',
    Icon: Eye,
    headline: 'Full Auditability',
    body: 'Lineage, access history, and deployment records are captured automatically across every action in the platform.',
  },
]

// ── Benefit item ─────────────────────────────────────────────────────────────

function BenefitItem({ benefit }: { benefit: Benefit }) {
  const { Icon } = benefit
  return (
    <div className="flex flex-col">
      {/* Accent rule — primary-700 hair, recessive on dark */}
      <div className="h-px w-8 bg-primary-700 mb-6" aria-hidden="true" />

      <Icon
        size={20}
        strokeWidth={1.5}
        className="text-ribbon mb-4 shrink-0"
        aria-hidden="true"
      />

      <h3 className="text-[14px] font-semibold text-ink-inverse leading-snug mb-2">
        {benefit.headline}
      </h3>

      <p className="text-[13px] leading-relaxed text-ink-inverse/50">
        {benefit.body}
      </p>
    </div>
  )
}

// ── BenefitsSection ──────────────────────────────────────────────────────────

export default function BenefitsSection() {
  return (
    <section
      className="bg-primary-900 px-8 py-16"
      aria-labelledby="benefits-heading"
    >
      <div className="max-w-6xl mx-auto">

        {/* Eyebrow — same rhythm as HeroSection */}
        <div className="flex items-center gap-3 mb-8" aria-hidden="true">
          <div className="h-px w-10 bg-ribbon" />
          <span className="text-ribbon text-[11px] font-semibold tracking-[0.18em] uppercase">
            Why It Matters
          </span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h2
            id="benefits-heading"
            className="text-xl font-bold text-ink-inverse tracking-tight mb-2"
          >
            The case for SigAI.
          </h2>
          <p className="text-[14px] text-ink-inverse/50 max-w-xl leading-relaxed">
            Six reasons why enterprise teams standardise on a unified platform
            before scaling AI delivery.
          </p>
        </div>

        {/* Benefit grid — typographic, no card boxes */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10"
          role="list"
          aria-label="Platform benefits"
        >
          {BENEFITS.map((b) => (
            <div key={b.id} role="listitem">
              <BenefitItem benefit={b} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
