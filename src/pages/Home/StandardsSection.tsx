import { ENTERPRISE_STANDARDS } from '../../data/standards'
import StandardCard from '../../components/ui/StandardCard'
import SectionHeader from '../../components/ui/SectionHeader'

export default function StandardsSection() {
  return (
    <section
      className="bg-surface border-b border-border px-8 py-12"
      aria-labelledby="standards-heading"
    >
      <SectionHeader
        id="standards-heading"
        eyebrow="Governance Foundation"
        title="Shared Standards"
        subtitle={`${ENTERPRISE_STANDARDS.length} standards · platform-wide · applied to every module`}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ENTERPRISE_STANDARDS.map((std) => (
          <StandardCard key={std.id} standard={std} />
        ))}
      </div>
    </section>
  )
}
