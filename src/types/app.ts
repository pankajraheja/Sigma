import type React from 'react'

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
