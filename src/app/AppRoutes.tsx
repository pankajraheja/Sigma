import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import LoadingState from '../components/ui/LoadingState'

// ---------------------------------------------------------------------------
// Route registry — all top-level routes for the SigAI host shell.
// Each module is lazy-loaded so the shell bundle stays lean.
// Swap a stub import for the real module page as features ship.
// ---------------------------------------------------------------------------

const HomePage            = lazy(() => import('../features/home/HomePage'))
const CatalogPage         = lazy(() => import('../features/catalog/CatalogPage'))
const IntakePage          = lazy(() => import('../features/intake/IntakePage'))
const PrototypePage       = lazy(() => import('../features/prototype-builder/PrototypePage'))
const AppBuilderPage      = lazy(() => import('../features/app-builder/AppBuilderPage'))
const ForgePage           = lazy(() => import('../features/forge/ForgePage'))
const PipelinePage        = lazy(() => import('../features/pipeline/PipelinePage'))
const AdminPage           = lazy(() => import('../features/admin/AdminPage'))
const VizierPage          = lazy(() => import('../features/vizier/VizierPage'))

function RouteLoader() {
  return <LoadingState message="Loading module…" />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/catalog/*"           element={<CatalogPage />} />
        <Route path="/intake/*"            element={<IntakePage />} />
        <Route path="/prototype-builder/*" element={<PrototypePage />} />
        <Route path="/app-builder/*"      element={<AppBuilderPage />} />
        <Route path="/forge/*"            element={<ForgePage />} />
        <Route path="/pipeline/*"         element={<PipelinePage />} />
        <Route path="/admin/*"            element={<AdminPage />} />
        <Route path="/vizier/*"           element={<VizierPage />} />
      </Routes>
    </Suspense>
  )
}
