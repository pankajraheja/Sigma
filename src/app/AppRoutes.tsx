import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Route registry — all top-level routes for the SigAI host shell.
// Each module is lazy-loaded so the shell bundle stays lean.
// Swap a stub import for the real module page as features ship.
// ---------------------------------------------------------------------------

const HomePage            = lazy(() => import('../features/home/HomePage'))
const CatalogPage         = lazy(() => import('../features/catalog/CatalogPage'))
const PrototypePage       = lazy(() => import('../features/prototype-builder/PrototypePage'))
const AppBuilderPage      = lazy(() => import('../features/app-builder/AppBuilderPage'))
const ForgePage           = lazy(() => import('../features/forge/ForgePage'))
const PipelinePage        = lazy(() => import('../features/pipeline/PipelinePage'))
const AdminPage           = lazy(() => import('../features/admin/AdminPage'))

function RouteLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <span className="text-[13px] text-ink-faint">Loading…</span>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/catalog/*"          element={<CatalogPage />} />
        <Route path="/prototype-builder/*" element={<PrototypePage />} />
        <Route path="/app-builder/*"      element={<AppBuilderPage />} />
        <Route path="/forge/*"            element={<ForgePage />} />
        <Route path="/pipeline/*"         element={<PipelinePage />} />
        <Route path="/admin/*"            element={<AdminPage />} />
      </Routes>
    </Suspense>
  )
}
