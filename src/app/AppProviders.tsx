import type React from 'react'
import { BrowserRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// AppProviders — composition root for all React context providers.
// Add providers here as features ship (auth, theme, module registry, etc.).
// ---------------------------------------------------------------------------

interface AppProvidersProps {
  children: React.ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}
