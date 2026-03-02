// ---------------------------------------------------------------------------
// standards.registry.ts
//
// Canonical list of every platform-wide standard enforced by the gateway.
// This is the authoritative reference — the same data drives the UI registry,
// the AdminPreviewSection, and future compliance checks.
//
// To add a standard: add one entry here. The UI picks it up automatically.
// ---------------------------------------------------------------------------

export const STANDARD_IDS = [
  'taxonomy',
  'metadata',
  'tags',
  'rbac',
  'templates',
  'connectors',
  'skills',
] as const

export type StandardId = (typeof STANDARD_IDS)[number]

export const STANDARD_DOMAINS = [
  'Governance',
  'Security',
  'Development',
  'Integration',
  'AI & Automation',
] as const

export type StandardDomainId = (typeof STANDARD_DOMAINS)[number]

/** Map of standard id → owning domain. Single source of truth for domain assignment. */
export const STANDARD_DOMAIN_MAP: Record<StandardId, StandardDomainId> = {
  taxonomy:   'Governance',
  metadata:   'Governance',
  tags:       'Governance',
  rbac:       'Security',
  templates:  'Development',
  connectors: 'Integration',
  skills:     'AI & Automation',
}

/** Admin route for each standard — used by links and breadcrumbs platform-wide. */
export const STANDARD_HREFS: Record<StandardId, string> = {
  taxonomy:   '/admin/taxonomy',
  metadata:   '/admin/metadata',
  tags:       '/admin/tags',
  rbac:       '/admin/rbac',
  templates:  '/admin/templates',
  connectors: '/admin/connectors',
  skills:     '/admin/skills',
}
