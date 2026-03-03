import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardFooter } from './Card'
import StatusBadge from './StatusBadge'
import { resolveIcon } from '../../lib/resolveIcon'
import type { PlatformModule } from '../../types'

interface ModuleCardProps {
  module: PlatformModule
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const Icon = resolveIcon(module.iconName)

  return (
    <Card>
      <CardBody>
        {/* Icon badge + category + status row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary-50 border border-primary-100 shrink-0">
              <Icon
                size={15}
                strokeWidth={1.75}
                className="text-primary-600"
                aria-hidden="true"
              />
            </div>
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              {module.category}
            </p>
          </div>
          <StatusBadge status={module.status} />
        </div>

        {/* Module name */}
        <h3 className="text-[15px] font-semibold text-ink leading-snug mb-2">
          {module.displayName}
        </h3>

        {/* Short description — concise, fits launcher card height */}
        <p className="text-[13px] leading-relaxed text-ink-muted flex-1">
          {module.shortDescription}
        </p>
      </CardBody>

      <CardFooter>
        <Link
          to={module.basePath}
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
