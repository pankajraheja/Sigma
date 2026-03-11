// ---------------------------------------------------------------------------
// RunSummaryPanel — right-side summary, actions, and metadata panel.
//
// Shows: run status, elapsed time, provider info, review history,
// retry button (if rejected), and cancel button (if running).
// ---------------------------------------------------------------------------

import {
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  StopCircle,
  Cpu,
  FileDown,
} from 'lucide-react'
import type { PipelineRun, ReviewDecision } from '../types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RunSummaryPanelProps {
  run: PipelineRun | null
  latestReview: ReviewDecision | null
  canRetry: boolean
  polling: boolean
  onRetry: () => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RunSummaryPanel({
  run,
  latestReview,
  canRetry,
  polling,
  onRetry,
  onCancel,
}: RunSummaryPanelProps) {
  if (!run) {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[11px] text-gray-400 text-center">
            Submit a project request to start a pipeline run.
          </p>
        </div>
      </div>
    )
  }

  const completedStages = run.stages.filter((s) => s.status === 'completed').length
  const totalStages = run.stages.length
  const isRunning = run.status === 'running'
  const isTerminal = ['completed', 'failed', 'rejected'].includes(run.status)

  return (
    <div className="flex flex-col h-full">
      <PanelHeader />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Run status */}
        <InfoSection label="Status">
          <RunStatusIndicator status={run.status} />
        </InfoSection>

        {/* Progress */}
        <InfoSection label="Progress">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  run.status === 'completed' ? 'bg-green-500' :
                  run.status === 'failed' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${(completedStages / totalStages) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 shrink-0">
              {completedStages}/{totalStages}
            </span>
          </div>
        </InfoSection>

        {/* Elapsed time */}
        {run.elapsedMs != null && (
          <InfoSection label="Elapsed Time" icon={Clock}>
            <span className="text-[11px] text-gray-700">{formatDuration(run.elapsedMs)}</span>
          </InfoSection>
        )}

        {/* Project info */}
        <InfoSection label="Project">
          <span className="text-[11px] font-medium text-gray-700">{run.request.name}</span>
          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-3">{run.request.description}</p>
        </InfoSection>

        {/* Provider info */}
        {run.providerInfo && (
          <InfoSection label="Provider" icon={Cpu}>
            <span className="text-[11px] text-gray-700">
              {run.providerInfo.provider} / {run.providerInfo.model}
            </span>
          </InfoSection>
        )}

        {/* Review history */}
        {run.reviewHistory.length > 0 && (
          <InfoSection label="Review History">
            <div className="space-y-1.5">
              {run.reviewHistory.map((review, idx) => (
                <ReviewEntry key={idx} review={review} />
              ))}
            </div>
          </InfoSection>
        )}

        {/* Error */}
        {run.status === 'failed' && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-50 border border-red-100">
            <XCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-600">
              Pipeline failed. Check stage outputs for details.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-1.5 rounded-md bg-amber-600 text-white py-1.5 text-[12px] font-medium hover:bg-amber-700 transition-colors"
          >
            <RotateCcw size={12} />
            Retry Pipeline
          </button>
        )}

        {isRunning && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-1.5 rounded-md border border-gray-200 text-gray-600 py-1.5 text-[12px] font-medium hover:bg-gray-50 transition-colors"
          >
            <StopCircle size={12} />
            Cancel Run
          </button>
        )}

        {run.status === 'completed' && (
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-1.5 rounded-md bg-gray-800 text-white py-1.5 text-[12px] font-medium opacity-50 cursor-not-allowed"
            title="Export will be available in a future release"
          >
            <FileDown size={12} />
            Export Output
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PanelHeader() {
  return (
    <div className="px-4 py-2.5 border-b border-gray-200">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Run Summary
      </span>
    </div>
  )
}

function InfoSection({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon?: typeof Clock
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={10} className="text-gray-400" />}
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  )
}

function RunStatusIndicator({ status }: { status: string }) {
  const config: Record<string, { icon: typeof Activity; color: string; label: string }> = {
    idle:      { icon: Activity,       color: 'text-gray-400',  label: 'Idle' },
    running:   { icon: Activity,       color: 'text-blue-500',  label: 'Running' },
    completed: { icon: CheckCircle2,   color: 'text-green-500', label: 'Completed' },
    failed:    { icon: XCircle,        color: 'text-red-500',   label: 'Failed' },
    rejected:  { icon: AlertTriangle,  color: 'text-amber-500', label: 'Rejected' },
  }
  const c = config[status] ?? config.idle!
  const Icon = c.icon

  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={c.color} />
      <span className={`text-[12px] font-medium ${c.color}`}>{c.label}</span>
    </div>
  )
}

function ReviewEntry({ review }: { review: ReviewDecision }) {
  return (
    <div className={`flex items-start gap-2 px-2 py-1.5 rounded text-[10px] ${
      review.approved ? 'bg-green-50' : 'bg-amber-50'
    }`}>
      {review.approved ? (
        <CheckCircle2 size={10} className="text-green-500 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />
      )}
      <div>
        <span className="font-medium text-gray-600">
          Attempt {review.attempt}/{review.maxAttempts}:
        </span>{' '}
        <span className="text-gray-500">{review.feedback}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const secs = Math.round(ms / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  const remSecs = secs % 60
  return `${mins}m ${remSecs}s`
}
