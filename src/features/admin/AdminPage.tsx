import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// ---------------------------------------------------------------------------
// AdminPage — sub-router for Admin Control Center.
// Each admin section is lazy-loaded to keep the bundle lean.
// ---------------------------------------------------------------------------

const BrandingPage      = lazy(() => import('./branding/BrandingPage'))
const TaxonomyAdminPage = lazy(() => import('./taxonomy/TaxonomyAdminPage'))

function AdminLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <span className="text-[13px] text-gray-400">Loading…</span>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Routes>
        <Route index element={<Navigate to="branding" replace />} />
        <Route path="branding" element={<BrandingPage />} />
        <Route path="taxonomy" element={<TaxonomyAdminPage />} />
      </Routes>
    </Suspense>
  )
}
