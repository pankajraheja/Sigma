import type { PlatformModule } from '../types'

// ---------------------------------------------------------------------------
// SigAI Platform Module Registry
//
// Single source of truth for all platform modules.
// Drives: navigation, quick-access cards, route stubs, permission checks,
//         and future API wiring.
//
// Field notes:
//   basePath   — matches the React Router route and features/ folder name
//   apiPrefix  — placeholder; wire to actual backend prefix when APIs exist
//   iconName   — Lucide icon name (string); resolved to component in UI layer
//   permissions.roles — empty array = all authenticated users may access
// ---------------------------------------------------------------------------

export const PLATFORM_MODULES: PlatformModule[] = [
  // ── Discovery ──────────────────────────────────────────────────────────────
  {
    id:          'catalog',
    displayName: 'Catalog',
    category:    'Discovery',
    description:
      'Browse, search, and govern the enterprise asset registry. Unified metadata, lineage, and classification across all data and service domains.',
    status:    'live',
    basePath:  '/catalog',
    apiPrefix: '/api/v1/catalog',
    iconName:  'Database',
    permissions: { roles: [] },
  },

  // ── Intake ─────────────────────────────────────────────────────────────────
  {
    id:          'intake',
    displayName: 'Intake',
    category:    'Intake',
    description:
      'Submit, track, and govern incoming data requests, asset onboarding forms, and project intake workflows. Entry point for all governed work.',
    status:    'preview',
    basePath:  '/intake',
    apiPrefix: '/api/v1/intake',
    iconName:  'Inbox',
    permissions: { roles: [] },
  },

  // ── Build ──────────────────────────────────────────────────────────────────
  {
    id:          'prototype-builder',
    displayName: 'Prototype Builder',
    category:    'Build',
    description:
      'Rapidly assemble governed low-code experiences for stakeholder validation before full engineering investment.',
    status:    'live',
    basePath:  '/prototype-builder',
    apiPrefix: '/api/v1/prototypes',
    iconName:  'PenTool',
    permissions: { roles: ['Editor', 'Admin'] },
  },
  {
    id:          'app-builder',
    displayName: 'Application Builder',
    category:    'Build',
    description:
      'Engineer full-stack applications with scaffolded templates, shared component libraries, and integrated deployment pipelines.',
    status:    'beta',
    basePath:  '/app-builder',
    apiPrefix: '/api/v1/apps',
    iconName:  'Code2',
    permissions: { roles: ['Editor', 'Admin'] },
  },

  // ── Orchestrate ────────────────────────────────────────────────────────────
  {
    id:          'forge',
    displayName: 'FORGE',
    category:    'Orchestrate',
    description:
      'Design, execute, and monitor multi-agent AI pipelines with traceability, approval gates, and enterprise policy enforcement.',
    status:    'beta',
    basePath:  '/forge',
    apiPrefix: '/api/v1/forge',
    iconName:  'Cpu',
    permissions: { roles: ['Editor', 'Admin'], featureFlag: 'forge.enabled' },
  },
  {
    id:          'pipeline',
    displayName: 'Pipeline',
    category:    'Orchestrate',
    description:
      'Manage integration flows, event streams, and transformation jobs across on-premise and cloud environments.',
    status:    'preview',
    basePath:  '/pipeline',
    apiPrefix: '/api/v1/pipeline',
    iconName:  'GitBranch',
    permissions: { roles: ['Editor', 'Admin'] },
  },

  // ── Govern ─────────────────────────────────────────────────────────────────
  {
    id:          'admin',
    displayName: 'Admin',
    category:    'Govern',
    description:
      'Administer taxonomy, metadata standards, access control policies, and user provisioning across the SigAI workspace.',
    status:    'live',
    basePath:  '/admin',
    apiPrefix: '/api/v1/admin',
    iconName:  'Settings',
    permissions: { roles: ['Admin'] },
  },
]
