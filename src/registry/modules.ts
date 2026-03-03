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

  // ── Discover & Start ──────────────────────────────────────────────────────
  {
    id:               'catalog',
    displayName:      'AI Navigator',
    shortDescription: 'AI-powered discovery for approved enterprise assets.',
    description:
      'AI Navigator is the semantic discovery layer for approved enterprise assets. Discover, understand, compare, and reuse certified AI models, datasets, APIs, applications, workflows, and prototypes across SigAI using semantic search and guided navigation.',
    category:    'Discover & Start',
    status:      'live',
    basePath:    '/catalog',
    apiPrefix:   '/api/v1/catalog',
    iconName:    'Database',
    permissions: { roles: [] },
    featured:            true,
    availableInLauncher: true,
  },
  {
    id:               'intake',
    displayName:      'Request Hub',
    shortDescription: 'Submit, track, and manage requests for new assets, solutions, and capabilities.',
    description:
      'Request Hub is the governed entry point for all new work across SigAI. Submit, track, and manage requests for new assets, solutions, and capabilities — with built-in routing, approval workflows, and full audit history.',
    category:    'Discover & Start',
    status:      'preview',
    basePath:    '/intake',
    apiPrefix:   '/api/v1/intake',
    iconName:    'Inbox',
    permissions: { roles: [] },
    featured:            true,
    availableInLauncher: true,
  },

  // ── Build & Create ────────────────────────────────────────────────────────
  {
    id:               'prototype-builder',
    displayName:      'Prototype Lab',
    shortDescription: 'Design and refine low-code or no-code prototypes for rapid experimentation.',
    description:
      'Prototype Lab is the rapid experimentation environment for SigAI. Design, iterate, and validate low-code or no-code prototypes before committing to full engineering investment — with governed asset references and stakeholder sharing built in.',
    category:    'Build & Create',
    status:      'live',
    basePath:    '/prototype-builder',
    apiPrefix:   '/api/v1/prototypes',
    iconName:    'PenTool',
    permissions: { roles: ['Editor', 'Admin'] },
    featured:            true,
    availableInLauncher: true,
  },
  {
    id:               'forge',
    displayName:      'Agent Forge',
    shortDescription: 'Create, orchestrate, and govern agents, skills, connectors, and workflows.',
    description:
      'Agent Forge is the multi-agent orchestration platform for SigAI. Create, configure, and govern AI agents, skills, connectors, and end-to-end workflows — with full traceability, approval gates, and enterprise policy enforcement at every step.',
    category:    'Build & Create',
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
    id:               'app-builder',
    displayName:      'Solution Studio',
    shortDescription: 'Build production-ready applications and engineering solutions.',
    description:
      'Solution Studio is the full-stack engineering workspace for SigAI. Build, scaffold, and ship production-ready applications and engineering solutions with governed templates, shared component libraries, and integrated deployment pipelines.',
    category:    'Build & Create',
    status:      'beta',
    basePath:    '/app-builder',
    apiPrefix:   '/api/v1/apps',
    iconName:    'Code2',
    permissions: { roles: ['Editor', 'Admin'] },
    featured:            false,
    availableInLauncher: true,
  },

  // ── Deliver & Observe ─────────────────────────────────────────────────────
  {
    id:               'pipeline',
    displayName:      'Delivery Hub',
    shortDescription: 'Manage certification, automation, release progression, and promotion to GA.',
    description:
      'Delivery Hub manages the end-to-end release lifecycle for SigAI assets and solutions. Automate certification checks, coordinate release progression, and govern promotion gates from preview through to general availability.',
    category:    'Deliver & Observe',
    status:      'preview',
    basePath:    '/pipeline',
    apiPrefix:   '/api/v1/pipeline',
    iconName:    'GitBranch',
    permissions: { roles: ['Editor', 'Admin'] },
    featured:            false,
    availableInLauncher: true,
  },
  {
    id:               'vizier',
    displayName:      'Vizier',
    shortDescription: 'Governance, reporting, evaluation, and portfolio intelligence for the AI platform.',
    description:
      'Vizier is the governance and observability layer for SigAI. Track portfolio health, monitor evaluation outcomes, measure cost and usage trends, and generate compliance-ready reports across all AI assets, agents, and solutions in the enterprise.',
    category:    'Deliver & Observe',
    status:      'preview',
    basePath:    '/vizier',
    apiPrefix:   '/api/vizier',
    iconName:    'BarChart3',
    permissions: { roles: [] },
    featured:            false,
    availableInLauncher: true,
  },

  // ── Govern ────────────────────────────────────────────────────────────────
  {
    id:               'admin',
    displayName:      'Admin Control Center',
    shortDescription: 'Govern taxonomy, metadata, access, platform settings, and shared standards.',
    description:
      'Admin Control Center is the governance and configuration hub for SigAI. Manage taxonomy hierarchies, metadata standards, access control policies, user provisioning, platform settings, and shared enterprise standards across the entire workspace.',
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
  'Discover & Start',
  'Build & Create',
  'Deliver & Observe',
  'Govern',
] as const
