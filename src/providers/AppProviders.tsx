import type React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { StandardsProvider } from './StandardsProvider'
import { AuthProvider } from './AuthProvider'
import { ModuleRegistryProvider } from './ModuleRegistryProvider'

// ---------------------------------------------------------------------------
// AppProviders — single composition root for all React context providers.
//
// Provider order (outer → inner):
//   BrowserRouter          — routing context (must wrap everything)
//   StandardsProvider      — governance standard versions + feature flags
//   AuthProvider           — user identity, roles, permissions
//   ModuleRegistryProvider — live module registry + lookup helpers
// ---------------------------------------------------------------------------

interface AppProvidersProps {
  children: React.ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <StandardsProvider>
        <AuthProvider>
          <ModuleRegistryProvider>
            {children}
          </ModuleRegistryProvider>
        </AuthProvider>
      </StandardsProvider>
    </BrowserRouter>
  )
}
