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

/** Return modules accessible to a given set of roles.
 *  Expand the role → module mapping here as RBAC rules are defined. */
export function getModulesForRoles(roles: string[]): PlatformModule[] {
  // TODO: replace with real role-permission mapping from AuthProvider/RBAC
  void roles
  return PLATFORM_MODULES
}
