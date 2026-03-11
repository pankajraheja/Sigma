// ---------------------------------------------------------------------------
// Governance types — shared configuration domain contracts for the platform.
//
// Admin Control Center is the governance hub. These types define the
// configuration domains that Admin manages and other modules consume.
//
// Design principles:
//   - Each domain is independently typed and versioned
//   - Modules consume governance config via read-only contracts
//   - Admin owns writes; modules own reads
//   - Future: backend-persisted, RBAC-gated, audit-logged
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Governance domain registry — the top-level categories Admin manages
// ---------------------------------------------------------------------------

export const GOVERNANCE_DOMAINS = [
  'brand-config',
  'taxonomy-config',
  'prototype-governance',
  'solutions-governance',
] as const

export type GovernanceDomain = (typeof GOVERNANCE_DOMAINS)[number]

export interface GovernanceDomainMeta {
  id: GovernanceDomain
  label: string
  description: string
  /** Admin route segment (appended to /admin/) */
  route: string
  /** Lucide icon name */
  iconName: string
  /** Current governance status */
  status: 'active' | 'coming-soon' | 'disabled'
  /** Which modules consume this domain's config */
  consumers: string[]
}

export const GOVERNANCE_DOMAIN_META: Record<GovernanceDomain, GovernanceDomainMeta> = {
  'brand-config': {
    id: 'brand-config',
    label: 'Branding',
    description: 'Manage brand tokens, color palettes, typography, and visual identity standards shared across all modules.',
    route: 'branding',
    iconName: 'Palette',
    status: 'active',
    consumers: ['prototype-builder', 'app-builder'],
  },
  'taxonomy-config': {
    id: 'taxonomy-config',
    label: 'Taxonomy & Metadata',
    description: 'Govern taxonomy hierarchies, metadata standards, and classification schemes used for asset cataloging and filtering.',
    route: 'taxonomy',
    iconName: 'Layers',
    status: 'active',
    consumers: ['catalog', 'prototype-builder'],
  },
  'prototype-governance': {
    id: 'prototype-governance',
    label: 'Prototype Governance',
    description: 'Control approved blocks, workspace policies, page-type rules, and brand validation enforcement for Prototype Lab.',
    route: 'prototype-governance',
    iconName: 'PenTool',
    status: 'active',
    consumers: ['prototype-builder'],
  },
  'solutions-governance': {
    id: 'solutions-governance',
    label: 'Solutions Governance',
    description: 'Configure allowed solution templates, technology stacks, workflow constraints, and deployment targets for Solutions Studio.',
    route: 'solutions-governance',
    iconName: 'Code2',
    status: 'coming-soon',
    consumers: ['app-builder'],
  },
}

// ---------------------------------------------------------------------------
// Prototype governance — admin-managed config for Prototype Lab
// ---------------------------------------------------------------------------

/** Admin-level override for which blocks are available platform-wide */
export interface PrototypeGovernanceConfig {
  /** Block IDs enabled platform-wide (null = all blocks allowed) */
  allowedBlockIds: string[] | null
  /** Whether brand validation auto-correction is enforced */
  enforceBrandValidation: boolean
  /** Maximum pages allowed per prototype workspace */
  maxPagesPerWorkspace: number
  /** Allowed workspace types (null = all) */
  allowedWorkspaceTypes: string[] | null
}

/** Phase 1 defaults — matches current behavior */
export const DEFAULT_PROTOTYPE_GOVERNANCE: PrototypeGovernanceConfig = {
  allowedBlockIds: null,
  enforceBrandValidation: true,
  maxPagesPerWorkspace: 20,
  allowedWorkspaceTypes: null,
}

// ---------------------------------------------------------------------------
// Solutions governance — admin-managed config for Solutions Studio
// ---------------------------------------------------------------------------

export interface SolutionTemplate {
  id: string
  label: string
  description: string
  /** Technology stack tags (e.g. 'react', 'python', 'fastapi') */
  stackTags: string[]
  /** Whether this template is available for new runs */
  enabled: boolean
}

export interface DeploymentTarget {
  id: string
  label: string
  description: string
  /** Environment type */
  environment: 'development' | 'staging' | 'production'
  enabled: boolean
}

export interface SolutionsGovernanceConfig {
  /** Allowed solution templates for new pipeline runs */
  allowedTemplates: SolutionTemplate[]
  /** Allowed technology stacks (null = unrestricted) */
  allowedStacks: string[] | null
  /** Allowed deployment targets */
  deploymentTargets: DeploymentTarget[]
  /** Maximum concurrent pipeline runs */
  maxConcurrentRuns: number
  /** Whether review stage is required */
  requireReview: boolean
  /** Whether packaging stage is required */
  requirePackaging: boolean
}

/** Phase 1 defaults — permissive, no restrictions */
export const DEFAULT_SOLUTIONS_GOVERNANCE: SolutionsGovernanceConfig = {
  allowedTemplates: [],
  allowedStacks: null,
  deploymentTargets: [],
  maxConcurrentRuns: 3,
  requireReview: true,
  requirePackaging: true,
}

// ---------------------------------------------------------------------------
// Platform governance summary — aggregate view for Admin dashboard
// ---------------------------------------------------------------------------

export interface GovernanceSummary {
  domain: GovernanceDomain
  label: string
  status: GovernanceDomainMeta['status']
  /** Key metric or count for dashboard display */
  metric: string
  /** Modules consuming this domain */
  consumers: string[]
}
