import { PLATFORM_MODULES } from '../registry/modules'
import type { PlatformModule, ModuleStatus, ModuleCategory } from '../types'

// ---------------------------------------------------------------------------
// moduleHelpers — query and filter helpers for the platform module registry.
// ---------------------------------------------------------------------------

/** Return a module by id, or undefined if not found. */
export function getModuleById(id: string): PlatformModule | undefined {
  return PLATFORM_MODULES.find((m) => m.id === id)
}

/** Return all modules matching a given status. */
export function getModulesByStatus(status: ModuleStatus): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => m.status === status)
}

/** Return all modules in a given category. */
export function getModulesByCategory(category: ModuleCategory): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => m.category === category)
}

/**
 * Return modules accessible to a given set of roles.
 * Modules with an empty roles array are accessible to all authenticated users.
 */
export function getModulesForRoles(roles: string[]): PlatformModule[] {
  return PLATFORM_MODULES.filter(
    (m) =>
      m.permissions.roles.length === 0 ||
      roles.some((r) => m.permissions.roles.includes(r)),
  )
}
