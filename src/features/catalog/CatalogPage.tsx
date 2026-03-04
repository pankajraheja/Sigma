import { lazy, Suspense, useMemo } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { SigmaChatDrawer } from '../chat'
import { CATALOG_CHAT_SKILL } from './chat/catalogChatSkill'
import type { ChatContext } from '../../types'

// ---------------------------------------------------------------------------
// CatalogPage — nested route host for the Catalog module.
// AppRoutes registers this at /catalog/* so all sub-routes resolve here.
//
// Routes:
//   /catalog              → CatalogHomePage
//   /catalog/discovery    → CatalogDiscoveryPage
//   /catalog/assets/:id   → CatalogAssetDetailPage
//   /catalog/admin        → CatalogAdminPage (placeholder)
//
// Sigma Chat — the AI Navigator Assistant drawer is mounted here so it
// appears on all catalog sub-routes. The chat context is page-aware:
// on detail pages it includes entityId; on discovery it includes the path.
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
  const location = useLocation()

  // Extract entityId from detail-page paths: /catalog/assets/:id
  const entityId = useMemo(() => {
    const match = location.pathname.match(/\/catalog\/assets\/([^/]+)/)
    return match ? match[1] : undefined
  }, [location.pathname])

  const chatContext: ChatContext = useMemo(
    () => ({
      page: location.pathname,
      entityId,
    }),
    [location.pathname, entityId],
  )

  return (
    <>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route index              element={<CatalogHomePage />} />
          <Route path="discovery"   element={<CatalogDiscoveryPage />} />
          <Route path="assets/:id"  element={<CatalogAssetDetailPage />} />
          <Route path="admin"       element={<CatalogAdminPage />} />
        </Routes>
      </Suspense>

      {/* Sigma Chat — AI Navigator Assistant */}
      <SigmaChatDrawer skill={CATALOG_CHAT_SKILL} context={chatContext} />
    </>
  )
}
