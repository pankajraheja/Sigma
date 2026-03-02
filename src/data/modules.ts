import type { PlatformModule } from './types'

// ---------------------------------------------------------------------------
// Platform module registry
// One entry per product module. Edit status here as modules ship.
// Order controls the display sequence in the UI.
// ---------------------------------------------------------------------------

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: 'catalog',
    displayName: 'Catalog',
    category: 'Discovery',
    description:
      'Browse, search, and govern the enterprise asset registry. Unified metadata, lineage, and classification across all data and service domains.',
    status: 'live',
    href: '/catalog',
  },
  {
    id: 'prototype-builder',
    displayName: 'Prototype Builder',
    category: 'Build',
    description:
      'Rapidly assemble governed low-code experiences for stakeholder validation before full engineering investment.',
    status: 'live',
    href: '/prototype-builder',
  },
  {
    id: 'app-builder',
    displayName: 'Application Builder',
    category: 'Build',
    description:
      'Engineer full-stack applications with scaffolded templates, shared component libraries, and integrated deployment pipelines.',
    status: 'beta',
    href: '/app-builder',
  },
  {
    id: 'forge',
    displayName: 'FORGE',
    category: 'Orchestrate',
    description:
      'Design, execute, and monitor multi-agent AI pipelines with traceability, approval gates, and enterprise policy enforcement.',
    status: 'beta',
    href: '/forge',
  },
  {
    id: 'pipeline',
    displayName: 'Pipeline',
    category: 'Orchestrate',
    description:
      'Manage integration flows, event streams, and transformation jobs across on-premise and cloud environments.',
    status: 'preview',
    href: '/pipeline',
  },
  {
    id: 'admin',
    displayName: 'Admin',
    category: 'Govern',
    description:
      'Administer taxonomy, metadata standards, access control policies, and user provisioning across the enterprise gateway.',
    status: 'live',
    href: '/admin',
  },
]
