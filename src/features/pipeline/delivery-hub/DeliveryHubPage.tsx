// ---------------------------------------------------------------------------
// DeliveryHubPage — review exported prototype submissions and re-download.
//
// Sits after export in the SigAI workflow:
//   Admin → Brand Setup → User Generates → Validation → Export → Delivery Hub
// ---------------------------------------------------------------------------

import { Package, RefreshCw, AlertCircle } from 'lucide-react'
import PageShell, { PageContent } from '../../../components/shell/PageShell'
import PageHeader from '../../../components/shell/PageHeader'
import LoadingState from '../../../components/ui/LoadingState'
import { useSubmissions } from './useSubmissions'
import SubmissionsTable from './SubmissionsTable'

export default function DeliveryHubPage() {
  const { submissions, loading, error, downloading, downloadError, redownload, refresh } = useSubmissions()

  return (
    <PageShell>
      <PageHeader
        icon={Package}
        title="Delivery Hub"
        subtitle="Review deliverables from Prototype Lab and Solutions Studio"
        maxWidth="7xl"
        actions={
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-subtle transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      <PageContent maxWidth="7xl">
        <div className="rounded-lg border border-border bg-surface shadow-card">
          {/* Stats bar */}
          <div className="border-b border-border-muted px-5 py-3 flex items-center gap-6">
            <span className="text-[12px] text-ink-muted">
              Total: <span className="font-bold text-ink">{submissions.length}</span>
            </span>
            {submissions.length > 0 && (
              <>
                <span className="text-[12px] text-ink-muted">
                  Prototypes: <span className="font-bold text-ink">
                    {submissions.filter((s) => s.source === 'prototype-lab').length}
                  </span>
                </span>
                <span className="text-[12px] text-ink-muted">
                  Studio runs: <span className="font-bold text-ink">
                    {submissions.filter((s) => s.source === 'solutions-studio').length}
                  </span>
                </span>
              </>
            )}
          </div>

          {/* Loading */}
          {loading && <LoadingState message="Loading submissions…" />}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center justify-center gap-2 py-16">
              <AlertCircle size={14} className="text-error" />
              <span className="text-[13px] text-error">{error}</span>
            </div>
          )}

          {/* Download error banner */}
          {downloadError && (
            <div className="flex items-center gap-2 mx-5 mt-3 px-3 py-2 rounded-md bg-red-50 border border-red-100">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <span className="text-[12px] text-red-700">{downloadError}</span>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="px-2 pb-2">
              <SubmissionsTable
                submissions={submissions}
                onRedownload={redownload}
                downloading={downloading}
              />
            </div>
          )}
        </div>
      </PageContent>
    </PageShell>
  )
}
