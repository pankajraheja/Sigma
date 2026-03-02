import {
  Network,
  Database,
  Tag,
  ShieldCheck,
  LayoutTemplate,
  Plug,
  Zap,
} from 'lucide-react'
import type { EnterpriseStandard } from './types'

// ---------------------------------------------------------------------------
// Enterprise standards registry
// One entry per platform-wide standard. Consumed by all modules.
// Order controls display sequence.
// ---------------------------------------------------------------------------

export const ENTERPRISE_STANDARDS: EnterpriseStandard[] = [
  {
    id: 'taxonomy',
    name: 'Taxonomy',
    domain: 'Governance',
    description:
      'Enterprise classification hierarchy for domains, capabilities, assets, and functions. Applied universally as the primary organisational schema.',
    Icon: Network,
    href: '/admin/taxonomy',
  },
  {
    id: 'metadata',
    name: 'Metadata',
    domain: 'Governance',
    description:
      'Shared schema definitions for asset description, covering ownership, lineage, quality ratings, and classification bindings.',
    Icon: Database,
    href: '/admin/metadata',
  },
  {
    id: 'tags',
    name: 'Tags',
    domain: 'Governance',
    description:
      'Controlled vocabulary for labelling and filtering assets, services, and deployments with governed, searchable attributes.',
    Icon: Tag,
    href: '/admin/tags',
  },
  {
    id: 'rbac',
    name: 'RBAC',
    domain: 'Security',
    description:
      'Role-based access control framework defining read, write, publish, and admin permissions consistently across every gateway module.',
    Icon: ShieldCheck,
    href: '/admin/rbac',
  },
  {
    id: 'templates',
    name: 'Templates',
    domain: 'Development',
    description:
      'Approved scaffolding patterns for applications, services, pipelines, and agents — reducing deviation and accelerating standards-aligned delivery.',
    Icon: LayoutTemplate,
    href: '/admin/templates',
  },
  {
    id: 'connectors',
    name: 'Connectors',
    domain: 'Integration',
    description:
      'Pre-built, governed adapters for internal systems, cloud services, and external data sources — certified for enterprise use.',
    Icon: Plug,
    href: '/admin/connectors',
  },
  {
    id: 'skills',
    name: 'Skills',
    domain: 'AI & Automation',
    description:
      'Reusable agent capabilities registered in FORGE — the building blocks for composing governed, auditable AI pipelines.',
    Icon: Zap,
    href: '/admin/skills',
  },
]
