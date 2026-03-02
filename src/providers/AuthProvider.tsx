import React, { createContext, useContext } from 'react'

// ---------------------------------------------------------------------------
// AuthProvider
// Holds the authenticated user, roles, and permission helpers.
// Wire to your identity provider (MSAL, OIDC, etc.) when auth is implemented.
// ---------------------------------------------------------------------------

interface AuthContextValue {
  // e.g. user: { id: string; name: string; email: string } | null
  // e.g. roles: string[]
  // e.g. hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthContextValue = {
    // populate from identity provider when ready
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
