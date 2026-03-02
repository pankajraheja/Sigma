import { ArrowRight, BookOpen } from 'lucide-react'
import Button from '../../components/ui/Button'

// ── Capability chips ────────────────────────────────────────────────────────

interface CapabilityChipProps {
  label: string
  description: string
}

function CapabilityChip({ label, description }: CapabilityChipProps) {
  return (
    <div
      title={description}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-ink-inverse/6 border border-ink-inverse/12 backdrop-blur-sm"
    >
      <span className="w-1 h-1 rounded-full bg-ribbon shrink-0" aria-hidden="true" />
      <span className="text-[11px] font-medium text-ink-inverse/65 tracking-wide whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

const CAPABILITIES: CapabilityChipProps[] = [
  { label: 'Discover',     description: 'Asset catalog and metadata registry' },
  { label: 'Prototype',    description: 'Rapid low-code prototype builder' },
  { label: 'Engineer',     description: 'Full-stack application builder' },
  { label: 'Orchestrate',  description: 'FORGE agent pipeline orchestration' },
  { label: 'Govern',       description: 'Taxonomy, access control, standards enforcement' },
]

// ── HeroSection ─────────────────────────────────────────────────────────────

export default function HeroSection() {
  return (
    <section
      className="relative bg-primary-900 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Blueprint grid texture */}
      <div
        className="absolute inset-0 bg-grid-subtle opacity-40"
        aria-hidden="true"
      />

      {/* Right-side radial glow — adds depth without noise */}
      <div
        className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-primary-950/70 to-transparent"
        aria-hidden="true"
      />

      {/* Bottom fade to page surface */}
      <div
        className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-primary-950/40 to-transparent"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative px-8 py-20 max-w-6xl mx-auto">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-8" aria-hidden="true">
          <div className="h-px w-10 bg-ribbon" />
          <span className="text-ribbon text-[11px] font-semibold tracking-[0.18em] uppercase">
            Enterprise Gateway
          </span>
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="text-[2.75rem] leading-[1.1] font-bold tracking-tight text-ink-inverse max-w-xl mb-6"
        >
          Build once.<br />
          Govern everywhere.
        </h1>

        {/* Divider accent */}
        <div className="w-12 h-0.5 bg-ribbon mb-7" aria-hidden="true" />

        {/* Strategic subtext */}
        <p className="text-[15px] leading-relaxed text-ink-inverse/60 max-w-2xl mb-10">
          A unified gateway to discover assets, prototype experiences, engineer
          applications, orchestrate agents, and enforce enterprise standards through
          shared taxonomy, metadata, and access control.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3 mb-14">
          <Button variant="inverse" size="lg">
            Explore Platform
            <ArrowRight size={15} strokeWidth={2} />
          </Button>
          <Button variant="ghost-inverse" size="lg">
            <BookOpen size={14} strokeWidth={1.75} />
            View Standards
          </Button>
        </div>

        {/* Capability indicators */}
        <div className="flex flex-wrap gap-2" role="list" aria-label="Platform capabilities">
          {CAPABILITIES.map((cap) => (
            <div key={cap.label} role="listitem">
              <CapabilityChip {...cap} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
