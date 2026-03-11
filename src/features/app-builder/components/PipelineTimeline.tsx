// ---------------------------------------------------------------------------
// PipelineTimeline — vertical stage progression display.
//
// Shows all SDLC stages with their current status, duration, and selection
// state. Users click a stage to inspect its output in the StageViewer.
// ---------------------------------------------------------------------------

import {
  Circle,
  CheckCircle2,
  XCircle,
  Loader2,
  SkipForward,
  AlertTriangle,
} from 'lucide-react'
import {
  PIPELINE_STAGES,
  STAGE_META,
  type PipelineStage,
  type StageResult,
  type StageStatus,
} from '../types'
import { formatDuration } from '../utils/format'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PipelineTimelineProps {
  stages: StageResult[]
  currentStage: PipelineStage | null
  selectedStage: PipelineStage | null
  onSelectStage: (stage: PipelineStage) => void
  isLive?: boolean
}

// ---------------------------------------------------------------------------
// Status → icon + color mapping
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<StageStatus, { icon: typeof Circle; color: string; bg: string }> = {
  pending:   { icon: Circle,        color: 'text-gray-300', bg: 'bg-gray-50' },
  running:   { icon: Loader2,       color: 'text-blue-500', bg: 'bg-blue-50' },
  completed: { icon: CheckCircle2,  color: 'text-green-500', bg: 'bg-green-50' },
  failed:    { icon: XCircle,       color: 'text-red-500',  bg: 'bg-red-50' },
  skipped:   { icon: SkipForward,   color: 'text-gray-400', bg: 'bg-gray-50' },
  rejected:  { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PipelineTimeline({
  stages,
  currentStage,
  selectedStage,
  onSelectStage,
  isLive = false,
}: PipelineTimelineProps) {
  // Build a lookup from stage results
  const stageMap = new Map(stages.map((s) => [s.stage, s]))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Pipeline Stages
        </span>
        {isLive && (
          <span className="text-[9px] px-1.5 py-px rounded-full bg-blue-100 text-blue-600 font-medium animate-pulse">
            updating
          </span>
        )}
      </div>

      {/* Stage list */}
      <div className="flex-1 overflow-y-auto py-2">
        {PIPELINE_STAGES.map((stageId, idx) => {
          const result = stageMap.get(stageId)
          const status: StageStatus = result?.status ?? 'pending'
          const meta = STAGE_META[stageId]
          const isSelected = selectedStage === stageId
          const isCurrent = currentStage === stageId
          const isLast = idx === PIPELINE_STAGES.length - 1
          const style = STATUS_STYLES[status]
          const Icon = style.icon

          return (
            <div key={stageId} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-[23px] top-[32px] w-[2px] h-[calc(100%-16px)] ${
                    status === 'completed' ? 'bg-green-200' :
                    status === 'running' ? 'bg-blue-200' :
                    'bg-gray-200'
                  }`}
                />
              )}

              <button
                type="button"
                onClick={() => onSelectStage(stageId)}
                className={`relative flex items-start gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Status icon */}
                <div className={`shrink-0 mt-0.5 rounded-full p-0.5 ${style.bg}`}>
                  <Icon
                    size={14}
                    className={`${style.color} ${status === 'running' ? 'animate-spin' : ''}`}
                  />
                </div>

                {/* Stage info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-medium ${
                      isSelected ? 'text-blue-700' :
                      status === 'completed' ? 'text-gray-700' :
                      status === 'running' ? 'text-blue-600' :
                      'text-gray-500'
                    }`}>
                      {meta.label}
                    </span>
                    {isCurrent && status === 'running' && (
                      <span className="text-[9px] px-1.5 py-px rounded-full bg-blue-100 text-blue-600 font-medium">
                        active
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="text-[9px] px-1.5 py-px rounded-full bg-amber-100 text-amber-600 font-medium">
                        rejected
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {meta.description}
                  </p>
                  {result?.durationMs != null && (
                    <span className="text-[10px] text-gray-400">
                      {formatDuration(result.durationMs)}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

