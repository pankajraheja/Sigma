import React, { createContext, useContext } from 'react'
import { PLATFORM_MODULES } from '../registry/modules'
import type { PlatformModule } from '../types'

// ---------------------------------------------------------------------------
// ModuleRegistryProvider
// Makes the live module registry available app-wide so any component can read
// module metadata, status, or resolve hrefs without prop-drilling.
// ---------------------------------------------------------------------------

interface ModuleRegistryContextValue {
  modules: PlatformModule[]
  getModule: (id: string) => PlatformModule | undefined
}

const ModuleRegistryContext = createContext<ModuleRegistryContextValue | null>(null)

export function ModuleRegistryProvider({ children }: { children: React.ReactNode }) {
  const value: ModuleRegistryContextValue = {
    modules: PLATFORM_MODULES,
    getModule: (id) => PLATFORM_MODULES.find((m) => m.id === id),
  }

  return (
    <ModuleRegistryContext.Provider value={value}>
      {children}
    </ModuleRegistryContext.Provider>
  )
}

export function useModuleRegistry(): ModuleRegistryContextValue {
  const ctx = useContext(ModuleRegistryContext)
  if (!ctx) throw new Error('useModuleRegistry must be used inside ModuleRegistryProvider')
  return ctx
}
