import { getLauncherModulesByCategory, getFeaturedModules } from '../../lib/moduleHelpers'
import ModuleCard from '../../components/ui/ModuleCard'
import SectionHeader from '../../components/ui/SectionHeader'
import { resolveIcon } from '../../lib/resolveIcon'
import type { ModuleCategory } from '../../types'

// ── Category accent colours ───────────────────────────────────────────────────

const CATEGORY_ACCENT: Partial<Record<ModuleCategory, string>> = {
  Discovery:   'border-l-primary-400',
  Intake:      'border-l-info',
  Build:       'border-l-warning',
  Orchestrate: 'border-l-ribbon',
  Govern:      'border-l-success',
}

// ── Derived data (module load time — no re-render needed) ─────────────────────

const categoryGroups  = getLauncherModulesByCategory()
const featuredModules = getFeaturedModules()
const totalLauncher   = categoryGroups.reduce((n, g) => n + g.modules.length, 0)

// ── Sub-components ─────────────────────────────────────────────────────────────

function CategoryHeader({ category }: { category: ModuleCategory }) {
  const accentClass = CATEGORY_ACCENT[category] ?? 'border-l-border-strong'
  return (
    <div className={`pl-3 border-l-2 ${accentClass} mb-4`}>
      <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
        {category}
      </span>
    </div>
  )
}

/** Compact featured strip — icon + name + one-liner, no card chrome. */
function FeaturedStrip() {
  if (featuredModules.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto mb-10">
      <div className="flex items-center gap-3 mb-5" aria-hidden="true">
        <div className="h-px w-6 bg-ribbon" />
        <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          Featured
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {featuredModules.map((mod) => {
          const Icon = resolveIcon(mod.iconName)
          return (
            <a
              key={mod.id}
              href={mod.basePath}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-border bg-surface shadow-card hover:shadow-panel hover:border-primary-300 transition-all"
              aria-label={`${mod.displayName}: ${mod.shortDescription}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary-50 border border-primary-100 shrink-0">
                <Icon size={15} strokeWidth={1.75} className="text-primary-600" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink leading-none mb-1 truncate">
                  {mod.displayName}
                </p>
                <p className="text-[11px] text-ink-faint leading-snug line-clamp-1">
                  {mod.shortDescription}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────

export default function QuickAccessSection() {
  return (
    <section
      className="bg-surface-raised border-b border-border px-8 py-12"
      aria-labelledby="quick-access-heading"
    >
      <SectionHeader
        id="quick-access-heading"
        eyebrow="Platform"
        title="Platform Modules"
        subtitle={`${totalLauncher} modules · governed by shared taxonomy and access control`}
      />

      {/* Featured quick-launch strip */}
      <FeaturedStrip />

      {/* Full module catalog — all launcher modules grouped by category */}
      <div className="max-w-6xl mx-auto space-y-10">
        {categoryGroups.map(({ category, modules }) => (
          <div key={category}>
            <CategoryHeader category={category} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
