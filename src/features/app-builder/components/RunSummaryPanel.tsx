// ---------------------------------------------------------------------------
// RunSummaryPanel — right-side summary, actions, and metadata panel.
//
// Shows: run status, elapsed time, provider info, review history,
// packaging status, artifact summary, and action buttons.
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
  Package,
  FileText,
  FileJson,
  Code2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import type {
  PipelineRun,
  ReviewDecision,
  PackagingSummary,
  DeliverableOutput,
  PackagingStatus,
} from '../types'
import { isTerminalStatus } from '../types'
import { classifyArtifactType, formatFileSize } from '../utils/packaging'
import { formatDuration } from '../utils/format'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RunSummaryPanelProps {
  run: PipelineRun | null
  latestReview: ReviewDecision | null
  canRetry: boolean
  polling: boolean
  packagingSummary: PackagingSummary | null
  deliverable: DeliverableOutput | null
  handingOff: boolean
  handedOff: boolean
  onRetry: () => void
  onCancel: () => void
  onHandOff: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RunSummaryPanel({
  run,
  latestReview,
  canRetry,
  polling,
  packagingSummary,
  deliverable,
  handingOff,
  handedOff,
  onRetry,
  onCancel,
  onHandOff,
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
  const isTerminal = isTerminalStatus(run.status)

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

        {/* Packaging status */}
        {packagingSummary && isTerminal && (
          <InfoSection label="Packaging" icon={Package}>
            <PackagingStatusIndicator status={packagingSummary.status} />
            {packagingSummary.status === 'ready' && (
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-500">
                <span>{packagingSummary.totalArtifacts} artifact{packagingSummary.totalArtifacts !== 1 ? 's' : ''}</span>
                {packagingSummary.reviewApproved && (
                  <span className="flex items-center gap-0.5">
                    <CheckCircle2 size={9} className="text-green-500" />
                    Review passed
                  </span>
                )}
              </div>
            )}
          </InfoSection>
        )}

        {/* Artifact summary */}
        {packagingSummary && packagingSummary.totalArtifacts > 0 && isTerminal && (
          <InfoSection label="Artifacts">
            <div className="space-y-1.5">
              {packagingSummary.artifactsByStage.map(({ stage, stageLabel, artifacts }) => (
                <div key={stage} className="text-[10px]">
                  <span className="font-medium text-gray-600">{stageLabel}</span>
                  <span className="text-gray-400 ml-1">({artifacts.length})</span>
                  <div className="mt-0.5 space-y-0.5">
                    {artifacts.map((a) => (
                      <div key={a.id} className="flex items-center gap-1.5 pl-2 text-gray-500">
                        <ArtifactTypeIcon type={a.type} />
                        <span className="truncate flex-1">{a.name}</span>
                        {a.sizeBytes != null && (
                          <span className="text-[9px] text-gray-400 shrink-0">
                            {formatFileSize(a.sizeBytes)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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

        {/* Export — enabled when packaging is ready */}
        {isTerminal && packagingSummary?.status === 'ready' && (
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-1.5 rounded-md bg-gray-800 text-white py-1.5 text-[12px] font-medium opacity-50 cursor-not-allowed"
            title="Download will be available when the backend exposes an artifacts endpoint"
          >
            <FileDown size={12} />
            Export Artifacts
          </button>
        )}

        {/* Delivery Hub handoff — shown for completed, package-ready runs */}
        {deliverable && packagingSummary?.status === 'ready' && !handedOff && (
          <button
            type="button"
            disabled={handingOff}
            onClick={onHandOff}
            className="w-full flex items-center justify-center gap-1.5 rounded-md border border-gray-200 text-gray-600 py-1.5 text-[12px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {handingOff ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
            {handingOff ? 'Handing off…' : 'Hand Off to Delivery'}
          </button>
        )}
        {handedOff && (
          <div className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-green-600">
            <CheckCircle2 size={12} />
            Handed off to Delivery Hub
          </div>
        )}

        {/* Packaging not ready — explain why */}
        {isTerminal && packagingSummary && packagingSummary.status !== 'ready' && packagingSummary.status !== 'not_started' && (
          <p className="text-[10px] text-gray-400 text-center italic">
            {packagingSummary.status === 'failed' && 'Packaging failed — artifacts may be incomplete.'}
            {packagingSummary.status === 'skipped' && 'Packaging was skipped — no deliverables available.'}
            {packagingSummary.status === 'in_progress' && 'Packaging in progress…'}
          </p>
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

function PackagingStatusIndicator({ status }: { status: PackagingStatus }) {
  const config: Record<PackagingStatus, { icon: typeof Package; color: string; label: string }> = {
    not_started: { icon: Package,       color: 'text-gray-400',  label: 'Not started' },
    in_progress: { icon: Package,       color: 'text-blue-500',  label: 'In progress' },
    ready:       { icon: CheckCircle2,  color: 'text-green-500', label: 'Ready' },
    failed:      { icon: XCircle,       color: 'text-red-500',   label: 'Failed' },
    skipped:     { icon: Package,       color: 'text-gray-400',  label: 'Skipped' },
  }
  const c = config[status]
  const Icon = c.icon
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} className={c.color} />
      <span className={`text-[11px] font-medium ${c.color}`}>{c.label}</span>
    </div>
  )
}

function ArtifactTypeIcon({ type }: { type: string }) {
  const kind = classifyArtifactType(type)
  switch (kind) {
    case 'code':     return <Code2 size={9} className="text-indigo-500 shrink-0" />
    case 'document': return <FileText size={9} className="text-gray-400 shrink-0" />
    case 'data':     return <FileJson size={9} className="text-amber-500 shrink-0" />
    default:         return <FileText size={9} className="text-gray-300 shrink-0" />
  }
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

