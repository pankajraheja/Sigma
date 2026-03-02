import React, { createContext, useContext } from 'react'

// ---------------------------------------------------------------------------
// StandardsProvider
// Exposes active governance standard versions and feature flags platform-wide.
// Expand this context as taxonomy versions, schema locks, and flag toggles ship.
// ---------------------------------------------------------------------------

interface StandardsContextValue {
  // e.g. taxonomyVersion: string
  // e.g. metadataSchemaVersion: string
  // e.g. flags: Record<string, boolean>
}

const StandardsContext = createContext<StandardsContextValue | null>(null)

export function StandardsProvider({ children }: { children: React.ReactNode }) {
  const value: StandardsContextValue = {
    // populate from config or remote when ready
  }

  return (
    <StandardsContext.Provider value={value}>
      {children}
    </StandardsContext.Provider>
  )
}

export function useStandards(): StandardsContextValue {
  const ctx = useContext(StandardsContext)
  if (!ctx) throw new Error('useStandards must be used inside StandardsProvider')
  return ctx
}
