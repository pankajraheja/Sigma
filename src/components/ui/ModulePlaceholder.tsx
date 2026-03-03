import { getModuleById } from '../../lib/moduleHelpers'
import StatusBadge from './StatusBadge'

// ---------------------------------------------------------------------------
// ModulePlaceholder — shown for modules that are registered but not yet built.
// Reads live data from the module registry so metadata is always in sync.
// Replace by swapping the feature page import in AppRoutes.tsx.
// ---------------------------------------------------------------------------

interface ModulePlaceholderProps {
  moduleId: string
}

export default function ModulePlaceholder({ moduleId }: ModulePlaceholderProps) {
  const mod = getModuleById(moduleId)

  return (
    <section className="flex flex-col items-center justify-center py-24 px-8 flex-1">
      <div className="max-w-lg w-full text-center">

        {mod ? (
          <>
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-3">
              {mod.category}
            </p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-xl font-semibold text-ink tracking-tight">
                {mod.displayName}
              </h1>
              <StatusBadge status={mod.status} />
            </div>

            <p className="text-[14px] text-ink-muted leading-relaxed mb-8">
              {mod.description}
            </p>
          </>
        ) : (
          <h1 className="text-xl font-semibold text-ink mb-8">Module not found</h1>
        )}

        <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-surface border border-border rounded-md shadow-card">
          <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-hidden="true" />
          <span className="text-[12px] text-ink-muted">
            This module is under active development
          </span>
        </div>

      </div>
    </section>
  )
}
