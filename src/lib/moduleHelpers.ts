import { PLATFORM_MODULES, MODULE_CATEGORY_ORDER } from '../registry/modules'
import type { PlatformModule, ModuleStatus, ModuleCategory, ModuleId } from '../types'

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

/** Return modules flagged as featured (shown prominently in the home launcher). */
export function getFeaturedModules(): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => m.featured)
}

/** Return modules that should appear in the home-page quick-access launcher grid. */
export function getLauncherModules(): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => m.availableInLauncher)
}

/**
 * Return launcher modules grouped by category, in the canonical category order.
 * Used by the home-page quick-access section to render category buckets.
 */
export function getLauncherModulesByCategory(): Array<{
  category: ModuleCategory
  modules:  PlatformModule[]
}> {
  const launcherModules = getLauncherModules()

  return MODULE_CATEGORY_ORDER
    .map((category) => ({
      category,
      modules: launcherModules.filter((m) => m.category === category),
    }))
    .filter((group) => group.modules.length > 0)
}

/**
 * Return modules in nav order, mapped to the shape NavItem expects.
 * The Home link is not a module and must be added separately by the navbar.
 */
export function getNavModules(): Array<{
  id:       ModuleId
  label:    string
  href:     string
  emphasis?: boolean
}> {
  return PLATFORM_MODULES.map((m) => ({
    id:       m.id,
    label:    m.displayName,
    href:     m.basePath,
    emphasis: m.navEmphasis,
  }))
}
