// ---------------------------------------------------------------------------
// StudioWorkspace — three-panel layout for Solutions Studio.
//
// Left:   RequestPanel (280px) — project intake + run controls
// Center: PipelineTimeline + StageViewer (flex) — stage progression + output
// Right:  RunSummaryPanel (240px) — metadata, status, actions
//
// All state flows from usePipelineRun → props.
// ---------------------------------------------------------------------------

import RequestPanel from './RequestPanel'
import PipelineTimeline from './PipelineTimeline'
import StageViewer from './StageViewer'
import RunSummaryPanel from './RunSummaryPanel'
import { usePipelineRun } from '../hooks/usePipelineRun'
import { useBackendHealth } from '../hooks/useBackendHealth'
import { AlertCircle } from 'lucide-react'
import type { BackendStatus } from '../types'

export default function StudioWorkspace() {
  const {
    run,
    selectedStage,
    selectedStageResult,
    latestReview,
    starting,
    polling,
    error,
    canRetry,
    startRun,
    selectStage,
    retryRun,
    cancelRun,
    reset,
  } = usePipelineRun()

  const health = useBackendHealth()

  const hasRun = run !== null
  const isRunning = run?.status === 'running'

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-[14px] font-semibold text-gray-700">Solutions Studio</h1>
          {run && (
            <span className="text-[11px] text-gray-400">
              {run.request.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {run?.providerInfo && (
            <span className="text-[10px] text-gray-400">
              {run.providerInfo.provider} · {run.providerInfo.model}
            </span>
          )}
          <BackendStatusDot status={health.status} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 border-b border-red-200 text-[11px] text-red-700">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Three-panel workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Project Request */}
        <div className="w-[280px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
          <RequestPanel
            onSubmit={startRun}
            onReset={reset}
            hasRun={hasRun}
            starting={starting}
            running={isRunning ?? false}
            backendConnected={health.status === 'connected' || health.status === 'degraded'}
          />
        </div>

        {/* Center — Pipeline Timeline + Stage Output */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {hasRun ? (
            <>
              {/* Timeline sidebar */}
              <div className="w-[220px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
                <PipelineTimeline
                  stages={run.stages}
                  currentStage={run.currentStage}
                  selectedStage={selectedStage}
                  onSelectStage={selectStage}
                />
              </div>

              {/* Stage output viewer */}
              <div className="flex-1 min-w-0 overflow-hidden bg-white">
                <StageViewer result={selectedStageResult} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <span className="text-3xl text-gray-300">Σ</span>
              </div>
              <p className="text-[14px] font-medium text-gray-500">Solutions Studio</p>
              <p className="text-[12px] text-gray-400 mt-1 max-w-xs text-center">
                Enter a project request and run the SDLC pipeline to generate requirements, architecture, code, tests, and more.
              </p>
            </div>
          )}
        </div>

        {/* Right — Run Summary */}
        <div className="w-[240px] shrink-0 border-l border-gray-200 bg-white overflow-hidden">
          <RunSummaryPanel
            run={run}
            latestReview={latestReview}
            canRetry={canRetry}
            polling={polling}
            onRetry={retryRun}
            onCancel={cancelRun}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Backend status indicator
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<BackendStatus, { color: string; label: string }> = {
  connected:    { color: 'bg-green-500', label: 'Backend connected' },
  degraded:     { color: 'bg-amber-500', label: 'Backend degraded' },
  disconnected: { color: 'bg-red-500',   label: 'Backend disconnected' },
  checking:     { color: 'bg-gray-400',  label: 'Checking backend…' },
}

function BackendStatusDot({ status }: { status: BackendStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div className="flex items-center gap-1.5" title={cfg.label}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.color} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] text-gray-400">{cfg.label}</span>
    </div>
  )
}
