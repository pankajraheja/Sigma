import type { UtilityLink, EnvironmentVariant } from '../types'

export const APP_CONFIG = {
  name: 'SigAI Workspace',
  version: '0.1.0',
  description: 'AI-powered enterprise workspace — build, govern, and orchestrate from a single shell',
} as const

export const ENVIRONMENT: { label: string; variant: EnvironmentVariant } = {
  label: 'PRODUCTION',
  variant: 'production',
}

// Navigation is now driven by the module registry (registry/modules.ts).
// See lib/moduleHelpers.ts → getNavModules() for the nav items.

export const UTILITY_LINKS: UtilityLink[] = [
  { label: 'Support',       href: '#' },
  { label: 'Documentation', href: '#' },
  { label: 'My Account',    href: '#' },
]

export const FOOTER_LINKS: UtilityLink[] = [
  { label: 'Support',         href: '#' },
  { label: 'Privacy Policy',  href: '#' },
  { label: 'Accessibility',   href: '#' },
  { label: 'Terms of Use',    href: '#' },
]

/** Governance artefact versions — update on each standards release cycle */
export const GOVERNANCE_VERSIONS = {
  platform:       `v${APP_CONFIG.version}`,
  standards:      'v1.4',
  taxonomy:       'v2.1',
  metadataSchema: 'v3.0',
  releasedCycle:  '2025-Q4',
} as const
