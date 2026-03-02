import { APP_CONFIG, FOOTER_LINKS, GOVERNANCE_VERSIONS } from '../../config/app.config'

// ── Governance version tag ──────────────────────────────────────────────────

function GovernanceTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-ink-inverse/30 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[11px] font-mono text-ink-inverse/50">{value}</span>
    </span>
  )
}

const SEPARATOR = (
  <span className="text-ink-inverse/15 select-none" aria-hidden="true">·</span>
)

// ── Footer ──────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer
      className="bg-primary-950 border-t border-primary-900 px-8 py-8 shrink-0"
      aria-label="Site footer"
    >
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Row 1: Brand mark + footer nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Dimmed brand mark */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-primary-800 rounded-sm flex items-center justify-center shrink-0">
              <span
                className="text-ink-inverse/40 font-bold text-[11px] leading-none select-none"
                aria-hidden="true"
              >
                Σ
              </span>
            </div>
            <span className="text-[11px] text-ink-inverse/35 font-medium">
              Sigma
            </span>
            <span className="text-ink-inverse/15" aria-hidden="true">·</span>
            <span className="text-[11px] text-ink-inverse/35">
              {APP_CONFIG.name}
            </span>
          </div>

          {/* Footer nav */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center gap-y-1">
              {FOOTER_LINKS.map((link, i) => (
                <li key={link.label} className="flex items-center">
                  {i > 0 && (
                    <span className="mx-3 text-ink-inverse/15 select-none" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <a
                    href={link.href}
                    className="text-[11px] text-ink-inverse/40 hover:text-ink-inverse/70 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-900" />

        {/* Row 2: Governance artefact versions */}
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
          aria-label="Governance version information"
        >
          <GovernanceTag label="Platform"        value={GOVERNANCE_VERSIONS.platform} />
          {SEPARATOR}
          <GovernanceTag label="Standards"       value={GOVERNANCE_VERSIONS.standards} />
          {SEPARATOR}
          <GovernanceTag label="Taxonomy"        value={GOVERNANCE_VERSIONS.taxonomy} />
          {SEPARATOR}
          <GovernanceTag label="Metadata Schema" value={GOVERNANCE_VERSIONS.metadataSchema} />
          {SEPARATOR}
          <GovernanceTag label="Released"        value={GOVERNANCE_VERSIONS.releasedCycle} />
        </div>

        {/* Row 3: Copyright */}
        <p className="text-[11px] text-ink-inverse/22 leading-relaxed">
          © {new Date().getFullYear()} {APP_CONFIG.name}. Internal use only.
          {' '}All standards enforced by platform policy.
        </p>

      </div>
    </footer>
  )
}
