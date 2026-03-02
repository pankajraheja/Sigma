// ---------------------------------------------------------------------------
// navigationRules.ts
//
// Rules governing navigation structure, access control, and routing policy.
// Used by nav components and the future auth layer to filter visible routes.
// ---------------------------------------------------------------------------

import type { ModuleStatus } from '../types'

/** Modules with these statuses are visible in the nav but may be gated. */
export const VISIBLE_STATUSES: ModuleStatus[] = ['live', 'beta', 'preview']

/** Modules with these statuses are hidden from navigation entirely. */
export const HIDDEN_STATUSES: ModuleStatus[] = ['coming-soon']

/** Roles that can access the Admin module. Enforced by AuthProvider + navFiltering. */
export const ADMIN_ROLES = ['Admin'] as const

/** Roles that can access Build modules (Prototype Builder, App Builder). */
export const BUILD_ROLES = ['Admin', 'Editor'] as const

/** Roles with read-only access across all catalog and discovery modules. */
export const VIEWER_ROLES = ['Admin', 'Editor', 'Viewer', 'Auditor'] as const

/** The home route — always accessible, no auth required. */
export const PUBLIC_ROUTES = ['/'] as const
