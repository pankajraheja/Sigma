import type { PlatformModule } from '../types'

// ---------------------------------------------------------------------------
// SigAI Platform Module Registry
//
// Single source of truth for all platform modules.
// Drives: navigation, quick-access launcher, route stubs, permission checks,
//         and future API wiring.
//
// Field notes:
//   id                  — canonical key; matches route segment and features/ folder
//   displayName         — human-readable name shown in UI
//   shortDescription    — one-liner for launcher cards, nav tooltips, search
//   description         — full prose for module-detail cards
//   basePath            — React Router route; also the nav href
//   apiPrefix           — placeholder until backend APIs exist
//   iconName            — Lucide icon name (string); resolved in the UI layer
//   permissions.roles   — empty array = all authenticated users may access
//   featured            — show with visual prominence in the home-page launcher
//   availableInLauncher — include in the quick-access module grid
//   navEmphasis         — bold / accent colour in the main navbar
// ---------------------------------------------------------------------------

export const PLATFORM_MODULES: PlatformModule[] = [

  // ── Discovery ─────────────────────────────────────────────────────────────
  {
    id:               'catalog',
    displayName:      'Catalog',
    shortDescription: 'Browse and govern the enterprise asset registry.',
    description:
      'Browse, search, and govern the enterprise asset registry. Unified metadata, lineage, and classification across all data and service domains.',
    category:    'Discovery',
    status:      'live',
    basePath:    '/catalog',
    apiPrefix:   '/api/v1/catalog',
    iconName:    'Database',
    permissions: { roles: [] },
    featured:            true,
    availableInLauncher: true,
  },

  // ── Intake ────────────────────────────────────────────────────────────────
  {
    id:               'intake',
    displayName:      'Intake',
    shortDescription: 'Submit and track governed data requests and onboarding forms.',
    description:
      'Submit, track, and govern incoming data requests, asset onboarding forms, and project intake workflows. Entry point for all governed work.',
    category:    'Intake',
    status:      'preview',
    basePath:    '/intake',
    apiPrefix:   '/api/v1/intake',
    iconName:    'Inbox',
    permissions: { roles: [] },
    featured:            true,
    availableInLauncher: true,
  },

  // ── Build ─────────────────────────────────────────────────────────────────
  {
    id:               'prototype-builder',
    displayName:      'Prototype Builder',
    shortDescription: 'Assemble governed low-code prototypes for stakeholder validation.',
    description:
      'Rapidly assemble governed low-code experiences for stakeholder validation before full engineering investment.',
    category:    'Build',
    status:      'live',
    basePath:    '/prototype-builder',
    apiPrefix:   '/api/v1/prototypes',
    iconName:    'PenTool',
    permissions: { roles: ['Editor', 'Admin'] },
    featured:            true,
    availableInLauncher: true,
  },
  {
    id:               'app-builder',
    displayName:      'Application Builder',
    shortDescription: 'Engineer full-stack applications with governed scaffolding.',
    description:
      'Engineer full-stack applications with scaffolded templates, shared component libraries, and integrated deployment pipelines.',
    category:    'Build',
    status:      'beta',
    basePath:    '/app-builder',
    apiPrefix:   '/api/v1/apps',
    iconName:    'Code2',
    permissions: { roles: ['Editor', 'Admin'] },
    featured:            false,
    availableInLauncher: true,
  },

  // ── Orchestrate ───────────────────────────────────────────────────────────
  {
    id:               'forge',
    displayName:      'FORGE',
    shortDescription: 'Design and run governed multi-agent AI pipelines.',
    description:
      'Design, execute, and monitor multi-agent AI pipelines with traceability, approval gates, and enterprise policy enforcement.',
    category:    'Orchestrate',
    status:      'beta',
    basePath:    '/forge',
    apiPrefix:   '/api/v1/forge',
    iconName:    'Cpu',
    permissions: { roles: ['Editor', 'Admin'], featureFlag: 'forge.enabled' },
    featured:            true,
    availableInLauncher: true,
    navEmphasis:         true,
  },
  {
    id:               'pipeline',
    displayName:      'Pipeline',
    shortDescription: 'Manage integration flows, event streams, and transformation jobs.',
    description:
      'Manage integration flows, event streams, and transformation jobs across on-premise and cloud environments.',
    category:    'Orchestrate',
    status:      'preview',
    basePath:    '/pipeline',
    apiPrefix:   '/api/v1/pipeline',
    iconName:    'GitBranch',
    permissions: { roles: ['Editor', 'Admin'] },
    featured:            false,
    availableInLauncher: true,
  },

  // ── Govern ────────────────────────────────────────────────────────────────
  {
    id:               'admin',
    displayName:      'Admin',
    shortDescription: 'Administer taxonomy, access control, and platform standards.',
    description:
      'Administer taxonomy, metadata standards, access control policies, and user provisioning across the SigAI workspace.',
    category:    'Govern',
    status:      'live',
    basePath:    '/admin',
    apiPrefix:   '/api/v1/admin',
    iconName:    'Settings',
    permissions: { roles: ['Admin'] },
    featured:            false,
    availableInLauncher: true,
  },
]

// ── Category display order — controls sequence in nav, launcher, and groups ──
export const MODULE_CATEGORY_ORDER = [
  'Discovery',
  'Intake',
  'Build',
  'Orchestrate',
  'Govern',
] as const
