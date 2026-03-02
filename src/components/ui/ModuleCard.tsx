import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardFooter } from './Card'
import StatusBadge from './StatusBadge'
import type { PlatformModule } from '../../data/types'

interface ModuleCardProps {
  module: PlatformModule
}

export default function ModuleCard({ module }: ModuleCardProps) {
  return (
    <Card>
      <CardBody>
        <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-3">
          {module.category}
        </p>

        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-[15px] font-semibold text-ink leading-snug">
            {module.displayName}
          </h3>
          <StatusBadge status={module.status} />
        </div>

        <p className="text-[13px] leading-relaxed text-ink-muted flex-1">
          {module.description}
        </p>
      </CardBody>

      <CardFooter>
        <Link
          to={module.href}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-600 hover:text-primary-700 transition-colors group-hover:gap-2"
          aria-label={`Open ${module.displayName}`}
        >
          Open module
          <ArrowRight size={13} strokeWidth={2} />
        </Link>
      </CardFooter>
    </Card>
  )
}
