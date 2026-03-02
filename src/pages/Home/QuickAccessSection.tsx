import { PLATFORM_MODULES } from '../../data/modules'
import ModuleCard from '../../components/ui/ModuleCard'
import SectionHeader from '../../components/ui/SectionHeader'

export default function QuickAccessSection() {
  return (
    <section
      className="bg-surface-raised border-b border-border px-8 py-12"
      aria-labelledby="quick-access-heading"
    >
      <SectionHeader
        id="quick-access-heading"
        title="Platform Modules"
        subtitle={`${PLATFORM_MODULES.length} modules · governed by shared taxonomy and access control`}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORM_MODULES.map((mod) => (
          <ModuleCard key={mod.id} module={mod} />
        ))}
      </div>
    </section>
  )
}
