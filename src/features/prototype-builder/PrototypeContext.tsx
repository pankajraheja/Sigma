// ---------------------------------------------------------------------------
// PrototypeContext — holds the collection of prototype pages in the workspace.
//
// Provides addPage, updatePage, removePage, and the full pages array.
// Used by SubmitButton to collect all pages for export.
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react'
import type { PrototypePage } from './types'

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

interface PrototypeState {
  pages: PrototypePage[]
}

type PrototypeAction =
  | { type: 'ADD_PAGE'; page: PrototypePage }
  | { type: 'UPDATE_PAGE'; id: string; html: string; updatedAt: string }
  | { type: 'RENAME_PAGE'; id: string; title: string }
  | { type: 'REMOVE_PAGE'; id: string }
  | { type: 'SET_PAGES'; pages: PrototypePage[] }

function prototypeReducer(state: PrototypeState, action: PrototypeAction): PrototypeState {
  switch (action.type) {
    case 'ADD_PAGE':
      return { ...state, pages: [...state.pages, action.page] }
    case 'UPDATE_PAGE':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id ? { ...p, html: action.html, updatedAt: action.updatedAt } : p,
        ),
      }
    case 'RENAME_PAGE':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id ? { ...p, title: action.title } : p,
        ),
      }
    case 'REMOVE_PAGE':
      return { ...state, pages: state.pages.filter((p) => p.id !== action.id) }
    case 'SET_PAGES':
      return { ...state, pages: action.pages }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PrototypeContextValue {
  pages: PrototypePage[]
  addPage: (page: PrototypePage) => void
  updatePage: (id: string, html: string) => void
  renamePage: (id: string, title: string) => void
  removePage: (id: string) => void
  setPages: (pages: PrototypePage[]) => void
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(prototypeReducer, { pages: [] })

  const addPage = (page: PrototypePage) => dispatch({ type: 'ADD_PAGE', page })
  const updatePage = (id: string, html: string) =>
    dispatch({ type: 'UPDATE_PAGE', id, html, updatedAt: new Date().toISOString() })
  const renamePage = (id: string, title: string) => dispatch({ type: 'RENAME_PAGE', id, title })
  const removePage = (id: string) => dispatch({ type: 'REMOVE_PAGE', id })
  const setPages = (pages: PrototypePage[]) => dispatch({ type: 'SET_PAGES', pages })

  return (
    <PrototypeContext.Provider value={{ pages: state.pages, addPage, updatePage, renamePage, removePage, setPages }}>
      {children}
    </PrototypeContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePrototype(): PrototypeContextValue {
  const ctx = useContext(PrototypeContext)
  if (!ctx) throw new Error('usePrototype must be used within a <PrototypeProvider>')
  return ctx
}
