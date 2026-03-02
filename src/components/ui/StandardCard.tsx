import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardFooter } from './Card'
import type { EnterpriseStandard } from '../../types'

interface StandardCardProps {
  standard: EnterpriseStandard
}

export default function StandardCard({ standard }: StandardCardProps) {
  const { Icon } = standard

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-1.5 mb-3">
          <Icon
            size={12}
            strokeWidth={2}
            className="text-primary-600 shrink-0"
            aria-hidden="true"
          />
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            {standard.domain}
          </p>
        </div>

        <h3 className="text-[15px] font-semibold text-ink leading-snug mb-3">
          {standard.name}
        </h3>

        <p className="text-[13px] leading-relaxed text-ink-muted flex-1">
          {standard.description}
        </p>
      </CardBody>

      <CardFooter>
        <Link
          to={standard.href}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-600 hover:text-primary-700 transition-colors group-hover:gap-2"
          aria-label={`View ${standard.name} standard`}
        >
          View standard
          <ArrowRight size={13} strokeWidth={2} />
        </Link>
      </CardFooter>
    </Card>
  )
}
