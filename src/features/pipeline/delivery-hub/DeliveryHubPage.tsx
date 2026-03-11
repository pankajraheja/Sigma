// ---------------------------------------------------------------------------
// DeliveryHubPage — review exported prototype submissions and re-download.
//
// Sits after export in the SigAI workflow:
//   Admin → Brand Setup → User Generates → Validation → Export → Delivery Hub
// ---------------------------------------------------------------------------

import { Package, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { useSubmissions } from './useSubmissions'
import SubmissionsTable from './SubmissionsTable'

export default function DeliveryHubPage() {
  const { submissions, loading, error, downloading, redownload, refresh } = useSubmissions()

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
              <Package size={16} className="text-gray-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-gray-900">Delivery Hub</h1>
              <p className="text-[11px] text-gray-500">Review exported prototype submissions and re-download</p>
            </div>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Stats bar */}
          <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-6">
            <span className="text-[12px] text-gray-500">
              Total submissions: <span className="font-bold text-gray-800">{submissions.length}</span>
            </span>
            {submissions.length > 0 && (
              <span className="text-[12px] text-gray-500">
                Brands: <span className="font-bold text-gray-800">
                  {new Set(submissions.map((s) => s.brandName)).size}
                </span>
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <span className="ml-2 text-[13px] text-gray-500">Loading submissions…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center justify-center gap-2 py-16">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-[13px] text-red-500">{error}</span>
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
      </div>
    </div>
  )
}
