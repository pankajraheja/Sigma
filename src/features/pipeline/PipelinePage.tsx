import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// ---------------------------------------------------------------------------
// PipelinePage — sub-router for Deliver & Observe.
// ---------------------------------------------------------------------------

const DeliveryHubPage = lazy(() => import('./delivery-hub/DeliveryHubPage'))

function PipelineLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <span className="text-[13px] text-gray-400">Loading…</span>
    </div>
  )
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<PipelineLoader />}>
      <Routes>
        <Route index element={<Navigate to="delivery-hub" replace />} />
        <Route path="delivery-hub" element={<DeliveryHubPage />} />
      </Routes>
    </Suspense>
  )
}
