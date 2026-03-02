import type React from 'react'

// ---------------------------------------------------------------------------
// Shared domain types – no business logic here, only shape definitions
// ---------------------------------------------------------------------------

/** Legacy nav item used by Sidebar */
export interface NavItem {
  label: string
  href: string
  icon?: string
}

/** Primary navigation link used in MainNavbar */
export interface MainNavItem {
  label: string
  href: string
  /** Render with brand emphasis (e.g. FORGE) */
  emphasis?: boolean
}

/** Utility links shown in the TopRibbon */
export interface UtilityLink {
  label: string
  href: string
}

export type EnvironmentVariant = 'production' | 'staging' | 'development'

export interface AppShellProps {
  children: React.ReactNode
}

// ── Module registry ─────────────────────────────────────────────────────────

export type ModuleStatus =
  | 'live'
  | 'beta'
  | 'preview'
  | 'coming-soon'

export type ModuleCategory =
  | 'Discovery'
  | 'Build'
  | 'Orchestrate'
  | 'Govern'
  | 'Platform'

export interface PlatformModule {
  id: string
  displayName: string
  category: ModuleCategory
  description: string
  status: ModuleStatus
  href: string
}

// ── Standards registry ───────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'

export type StandardDomain =
  | 'Governance'
  | 'Security'
  | 'Development'
  | 'Integration'
  | 'AI & Automation'

export interface EnterpriseStandard {
  id: string
  name: string
  domain: StandardDomain
  description: string
  /** Lucide icon component — stored by reference, not string */
  Icon: LucideIcon
  href: string
}
