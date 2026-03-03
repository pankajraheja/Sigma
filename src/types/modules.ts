// ---------------------------------------------------------------------------
// Module types — canonical shape for every platform module in SigAI.
// ---------------------------------------------------------------------------

/** Canonical module IDs — match route segment, feature folder, and registry key. */
export type ModuleId =
  | 'catalog'
  | 'forge'
  | 'prototype-builder'
  | 'app-builder'
  | 'intake'
  | 'pipeline'
  | 'admin'

export type ModuleStatus =
  | 'live'
  | 'beta'
  | 'preview'
  | 'coming-soon'

export type ModuleCategory =
  | 'Discovery'
  | 'Intake'
  | 'Build'
  | 'Orchestrate'
  | 'Govern'
  | 'Platform'

/**
 * Access control descriptor — placeholder until AuthProvider + RBAC ships.
 * Empty roles array means "all authenticated users".
 */
export interface ModulePermissions {
  /** Minimum roles required to access this module. */
  roles: string[]
  /** Optional feature flag key — checked against StandardsProvider. */
  featureFlag?: string
}

export interface PlatformModule {
  /** Canonical ID — matches route segment and features/ folder name. */
  id: ModuleId
  /**
   * Human-readable display name shown in nav, cards, and headings.
   * `id` serves as the canonical machine name.
   */
  displayName: string
  /** One-line summary for launcher cards, nav tooltips, and search results. */
  shortDescription: string
  /** Full description for module cards and detail views. */
  description: string
  category: ModuleCategory
  status: ModuleStatus
  /** Root navigation path — drives router, nav links, and breadcrumbs. */
  basePath: string
  /** API prefix for this module's backend endpoints. Placeholder until APIs exist. */
  apiPrefix: string
  /**
   * Lucide icon name as a string — resolved to a component in the UI layer.
   * Keeping it a string avoids importing all icons into the registry.
   */
  iconName: string
  /** Access control placeholder — wire to AuthProvider when RBAC ships. */
  permissions: ModulePermissions
  /** Show this module with visual prominence in the home-page quick-access section. */
  featured: boolean
  /** Include this module in the launcher grid on the home page. */
  availableInLauncher: boolean
  /** Apply emphasis styling (bold, accent colour) in the main navbar. */
  navEmphasis?: boolean
}
