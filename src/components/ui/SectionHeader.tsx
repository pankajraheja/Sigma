import type React from 'react'

/**
 * SectionHeader — standard section title block used by all homepage sections.
 *
 * Renders inside the section's px-8/py-12 padding; handles max-width, eyebrow
 * line, h2, subtitle, and an optional right-side action slot.
 *
 *   <SectionHeader
 *     id="my-section-heading"
 *     eyebrow="Governance Foundation"   // optional — shows accent hairline
 *     title="Shared Standards"
 *     subtitle="7 standards · platform-wide"
 *     action={<Link to="/admin">Go to Admin →</Link>}
 *   />
 */

interface SectionHeaderProps {
  /** Must match the section's aria-labelledby value. */
  id: string
  /** Optional accent line + uppercase label above the title. */
  eyebrow?: string
  title: string
  subtitle?: string
  /** Optional element rendered on the right side (link, button, count). */
  action?: React.ReactNode
}

export default function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <div className="max-w-6xl mx-auto mb-8">
      {/* Eyebrow — accent hairline + label */}
      {eyebrow && (
        <div className="flex items-center gap-3 mb-4" aria-hidden="true">
          <div className="h-px w-8 bg-primary-300" />
          <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
            {eyebrow}
          </span>
        </div>
      )}

      {/* Title row */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2
            id={id}
            className="text-lg font-semibold text-ink tracking-tight"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
