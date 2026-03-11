import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// ---------------------------------------------------------------------------
// AdminPage — sub-router for Admin Control Center (governance hub).
//
// Routes:
//   /admin               → GovernanceDashboard (domain overview)
//   /admin/branding      → Brand configuration editor
//   /admin/taxonomy      → Taxonomy term management
//   /admin/prototype-governance   → Prototype Lab governance
//   /admin/solutions-governance   → Solutions Studio governance
//
// Each governance section is lazy-loaded to keep the bundle lean.
// ---------------------------------------------------------------------------

const GovernanceDashboard    = lazy(() => import('./GovernanceDashboard'))
const BrandingPage           = lazy(() => import('./branding/BrandingPage'))
const TaxonomyAdminPage      = lazy(() => import('./taxonomy/TaxonomyAdminPage'))
const PrototypeGovernancePage = lazy(() => import('./prototype-governance/PrototypeGovernancePage'))
const SolutionsGovernancePage = lazy(() => import('./solutions-governance/SolutionsGovernancePage'))

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
        <Route index element={<GovernanceDashboard />} />
        <Route path="branding" element={<BrandingPage />} />
        <Route path="taxonomy" element={<TaxonomyAdminPage />} />
        <Route path="prototype-governance" element={<PrototypeGovernancePage />} />
        <Route path="solutions-governance" element={<SolutionsGovernancePage />} />
      </Routes>
    </Suspense>
  )
}
