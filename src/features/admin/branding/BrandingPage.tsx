// ---------------------------------------------------------------------------
// BrandingPage — Phase 1 Admin Control Center brand configuration page.
//
// Left:  editable form for all BrandConfig fields
// Right: live preview rendered using active brand tokens
//
// Admin shell uses neutral gray styling — brand colors only in the preview.
// Structured for future taxonomy config and validation rules alongside.
// ---------------------------------------------------------------------------

import { Palette, Save, Loader2 } from 'lucide-react'
import { useBrand } from '../../brand/BrandContext'
import BrandEditorForm from './components/BrandEditorForm'
import BrandPreview from './components/BrandPreview'
import BrandSwitcher from './components/BrandSwitcher'

export default function BrandingPage() {
  const { currentBrand, brandKey, loading, error, switchBrand, updateToken } = useBrand()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-gray-400" />
        <span className="ml-2 text-[13px] text-gray-500">Loading brand configuration…</span>
      </div>
    )
  }

  if (error || !currentBrand) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-[13px] text-red-500">{error ?? 'Brand not found'}</span>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
              <Palette size={16} className="text-gray-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-gray-900">Brand Configuration</h1>
              <p className="text-[11px] text-gray-500">Manage brand tokens and preview before publishing to the workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BrandSwitcher activeKey={brandKey} onSwitch={switchBrand} />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-800 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-gray-700 transition-colors"
              onClick={() => {
                // Phase 2: write through API route
                // eslint-disable-next-line no-alert
                alert('Save will be wired to an API route in Phase 2.')
              }}
            >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
          {/* Left — Editor */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-[13px] font-bold text-gray-700 mb-4">Token Editor</h2>
            <BrandEditorForm brand={currentBrand} onUpdate={updateToken} />
          </div>

          {/* Right — Preview */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-[13px] font-bold text-gray-700 mb-4">Live Preview</h2>
              <BrandPreview brand={currentBrand} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
