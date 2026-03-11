// ---------------------------------------------------------------------------
// BrandingPage — Admin Control Center brand configuration page.
//
// Left:  editable form for all BrandConfig fields (neutral admin shell)
// Right: live preview rendered using active brand tokens (branded canvas)
//
// Admin shell uses design tokens (surface/ink/border) — brand colors appear
// ONLY inside the bounded preview canvas on the right.
// ---------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom'
import { Palette, Save, RotateCcw, Monitor } from 'lucide-react'
import { useBrand } from '../../brand/BrandContext'
import PageShell, { PageContent } from '../../../components/shell/PageShell'
import PageHeader from '../../../components/shell/PageHeader'
import LoadingState from '../../../components/ui/LoadingState'
import BrandEditorForm from './components/BrandEditorForm'
import BrandPreview from './components/BrandPreview'
import BrandSwitcher from './components/BrandSwitcher'

export default function BrandingPage() {
  const navigate = useNavigate()
  const { currentBrand, brandKey, loading, error, switchBrand, updateToken } = useBrand()

  if (loading) {
    return (
      <PageShell>
        <PageHeader
          icon={Palette}
          title="Brand Configuration"
          subtitle="Manage brand tokens and preview before publishing"
          onBack={() => navigate('/admin')}
        />
        <LoadingState message="Loading brand configuration…" />
      </PageShell>
    )
  }

  if (error || !currentBrand) {
    return (
      <PageShell>
        <PageHeader
          icon={Palette}
          title="Brand Configuration"
          subtitle="Manage brand tokens and preview before publishing"
          onBack={() => navigate('/admin')}
        />
        <div className="flex items-center justify-center py-24">
          <span className="text-[13px] text-error">{error ?? 'Brand not found'}</span>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        icon={Palette}
        title="Brand Configuration"
        subtitle="Manage brand tokens and preview before publishing to the workspace"
        maxWidth="7xl"
        onBack={() => navigate('/admin')}
        actions={
          <div className="flex items-center gap-2">
            <BrandSwitcher activeKey={brandKey} onSwitch={switchBrand} />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-subtle transition-colors"
              onClick={() => {
                // Phase 2: reset to last saved state
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-900 px-3.5 py-1.5 text-[13px] font-medium text-ink-inverse hover:bg-primary-800 transition-colors"
              onClick={() => {
                // Phase 2: write through API route
                // eslint-disable-next-line no-alert
                alert('Save will be wired to an API route in Phase 2.')
              }}
            >
              <Save size={13} />
              Save
            </button>
          </div>
        }
      />

      <PageContent maxWidth="7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
          {/* Left — Token Editor */}
          <div className="rounded-lg border border-border bg-surface shadow-card">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border-muted">
              <Palette size={14} className="text-ink-muted" />
              <span className="text-[13px] font-semibold text-ink">Token Editor</span>
            </div>
            <div className="p-5">
              <BrandEditorForm brand={currentBrand} onUpdate={updateToken} />
            </div>
          </div>

          {/* Right — Live Preview Canvas */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-lg border border-border bg-surface shadow-card">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-muted">
                <Monitor size={14} className="text-ink-muted" />
                <span className="text-[13px] font-semibold text-ink">Live Preview</span>
                <span className="text-[10px] text-ink-faint ml-auto">Branded output preview</span>
              </div>
              <div className="p-4 bg-surface-subtle">
                {/* The preview canvas — brand colors are isolated inside this boundary */}
                <div className="rounded-md shadow-panel overflow-hidden">
                  <BrandPreview brand={currentBrand} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </PageShell>
  )
}
