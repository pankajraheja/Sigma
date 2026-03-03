import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// ---------------------------------------------------------------------------
// CatalogPage — nested route host for the Catalog module.
// AppRoutes registers this at /catalog/* so all sub-routes resolve here.
//
// Routes:
//   /catalog              → CatalogHomePage
//   /catalog/discovery    → CatalogDiscoveryPage
//   /catalog/assets/:id   → CatalogAssetDetailPage
//   /catalog/admin        → CatalogAdminPage (placeholder)
// ---------------------------------------------------------------------------

const CatalogHomePage        = lazy(() => import('./CatalogHomePage'))
const CatalogDiscoveryPage   = lazy(() => import('./CatalogDiscoveryPage'))
const CatalogAssetDetailPage = lazy(() => import('./CatalogAssetDetailPage'))
const CatalogAdminPage       = lazy(() => import('./CatalogAdminPage'))

function Loader() {
  return (
    <div className="flex items-center justify-center py-24">
      <span className="text-[13px] text-ink-faint">Loading…</span>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route index              element={<CatalogHomePage />} />
        <Route path="discovery"   element={<CatalogDiscoveryPage />} />
        <Route path="assets/:id"  element={<CatalogAssetDetailPage />} />
        <Route path="admin"       element={<CatalogAdminPage />} />
      </Routes>
    </Suspense>
  )
}
