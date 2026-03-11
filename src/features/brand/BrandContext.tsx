import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react'
import type { BrandConfig } from '../../types/brand'

// ---------------------------------------------------------------------------
// Brand registry — static import map for brand JSON files.
// Add new brands here as they become available.
// ---------------------------------------------------------------------------

const BRAND_MODULES: Record<string, () => Promise<{ default: BrandConfig }>> = {
  kpmg: () => import('../../config/brands/kpmg.json') as Promise<{ default: BrandConfig }>,
}

const DEFAULT_BRAND_KEY = 'kpmg'

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

interface BrandState {
  brandKey: string
  brand: BrandConfig | null
  loading: boolean
  error: string | null
}

type BrandAction =
  | { type: 'LOAD_START'; brandKey: string }
  | { type: 'LOAD_OK'; brand: BrandConfig }
  | { type: 'LOAD_FAIL'; error: string }
  | { type: 'UPDATE_TOKEN'; path: string; value: unknown }

function brandReducer(state: BrandState, action: BrandAction): BrandState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, brandKey: action.brandKey, loading: true, error: null }
    case 'LOAD_OK':
      return { ...state, brand: action.brand, loading: false }
    case 'LOAD_FAIL':
      return { ...state, brand: null, loading: false, error: action.error }
    case 'UPDATE_TOKEN': {
      if (!state.brand) return state
      const updated = setNestedValue(state.brand, action.path, action.value)
      return { ...state, brand: updated }
    }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Nested token update helper
// e.g. updateToken('colors.primary', '#FF0000')
// ---------------------------------------------------------------------------

function setNestedValue<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const keys = path.split('.')
  if (keys.length === 0) return obj

  const clone = { ...obj } as Record<string, unknown>
  let current = clone
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    current[k] = { ...(current[k] as Record<string, unknown>) }
    current = current[k] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
  return clone as T
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface BrandContextValue {
  currentBrand: BrandConfig | null
  brandKey: string
  loading: boolean
  error: string | null
  switchBrand: (brandKey: string) => void
  updateToken: (path: string, value: unknown) => void
}

const BrandContext = createContext<BrandContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

async function loadBrand(
  brandKey: string,
  dispatch: Dispatch<BrandAction>,
) {
  dispatch({ type: 'LOAD_START', brandKey })
  const loader = BRAND_MODULES[brandKey]
  if (!loader) {
    dispatch({ type: 'LOAD_FAIL', error: `Unknown brand: ${brandKey}` })
    return
  }
  try {
    const mod = await loader()
    dispatch({ type: 'LOAD_OK', brand: mod.default })
  } catch (err) {
    dispatch({
      type: 'LOAD_FAIL',
      error: err instanceof Error ? err.message : 'Failed to load brand config',
    })
  }
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(brandReducer, {
    brandKey: DEFAULT_BRAND_KEY,
    brand: null,
    loading: true,
    error: null,
  })

  // Load initial brand on mount
  useEffect(() => {
    loadBrand(DEFAULT_BRAND_KEY, dispatch)
  }, [])

  const switchBrand = (key: string) => {
    loadBrand(key, dispatch)
  }

  const updateToken = (path: string, value: unknown) => {
    dispatch({ type: 'UPDATE_TOKEN', path, value })
  }

  const ctx: BrandContextValue = {
    currentBrand: state.brand,
    brandKey: state.brandKey,
    loading: state.loading,
    error: state.error,
    switchBrand,
    updateToken,
  }

  return (
    <BrandContext.Provider value={ctx}>
      {children}
    </BrandContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext)
  if (!ctx) {
    throw new Error('useBrand must be used within a <BrandProvider>')
  }
  return ctx
}
