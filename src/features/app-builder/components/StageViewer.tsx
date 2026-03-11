// ---------------------------------------------------------------------------
// StageViewer — displays the output of a selected pipeline stage.
//
// Center panel: shows stage name, status, output content, artifacts list,
// and error details if the stage failed.
// ---------------------------------------------------------------------------

import {
  FileText,
  AlertCircle,
  Code2,
  FileJson,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { STAGE_META, type StageResult, type StageArtifact } from '../types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StageViewerProps {
  result: StageResult | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StageViewer({ result }: StageViewerProps) {
  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <ViewerHeader title="Stage Output" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[12px] text-gray-400">
            Select a stage to view its output
          </p>
        </div>
      </div>
    )
  }

  const meta = STAGE_META[result.stage]

  return (
    <div className="flex flex-col h-full">
      <ViewerHeader
        title={meta.label}
        status={result.status}
        durationMs={result.durationMs}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Status: pending */}
        {result.status === 'pending' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-gray-400 italic">
              Waiting for pipeline to reach this stage…
            </p>
          </div>
        )}

        {/* Status: running */}
        {result.status === 'running' && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 size={20} className="text-blue-500 animate-spin" />
            <p className="text-[12px] text-blue-600">
              {meta.label} in progress…
            </p>
          </div>
        )}

        {/* Status: failed */}
        {result.status === 'failed' && (
          <div className="p-4">
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-medium text-red-700">Stage Failed</p>
                <p className="text-[11px] text-red-600 mt-1">
                  {result.error ?? 'An unknown error occurred.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status: completed / rejected — show output */}
        {(result.status === 'completed' || result.status === 'rejected') && (
          <div className="p-4 space-y-4">
            {/* Primary output */}
            {result.output && (
              <div>
                <SectionLabel icon={FileText} label="Output" />
                <pre className="mt-1.5 p-3 rounded-md bg-gray-50 border border-gray-200 text-[11px] text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto font-mono">
                  {result.output}
                </pre>
              </div>
            )}

            {/* Artifacts */}
            {result.artifacts.length > 0 && (
              <div>
                <SectionLabel icon={Code2} label={`Artifacts (${result.artifacts.length})`} />
                <div className="mt-1.5 space-y-2">
                  {result.artifacts.map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty output */}
            {!result.output && result.artifacts.length === 0 && (
              <p className="text-[12px] text-gray-400 italic text-center py-8">
                Stage completed with no output content.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ViewerHeader({
  title,
  status,
  durationMs,
}: {
  title: string
  status?: string
  durationMs?: number | null
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        {status && (
          <StatusBadge status={status} />
        )}
      </div>
      {durationMs != null && (
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock size={10} />
          {formatDuration(durationMs)}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500',
    running: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600',
    rejected: 'bg-amber-100 text-amber-600',
    skipped: 'bg-gray-100 text-gray-500',
  }

  return (
    <span className={`text-[9px] px-1.5 py-px rounded-full font-medium ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} className="text-gray-400" />
      <span className="text-[11px] font-medium text-gray-600">{label}</span>
    </div>
  )
}

function ArtifactCard({ artifact }: { artifact: StageArtifact }) {
  const isCode = artifact.type.startsWith('code/') || artifact.type === 'application/json'

  return (
    <div className="rounded-md border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
        {isCode ? (
          <FileJson size={12} className="text-indigo-500" />
        ) : (
          <FileText size={12} className="text-gray-400" />
        )}
        <span className="text-[11px] font-medium text-gray-600 flex-1">{artifact.name}</span>
        <span className="text-[9px] text-gray-400">{artifact.type}</span>
      </div>
      {artifact.content && (
        <pre className="px-3 py-2 text-[10px] text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto font-mono bg-white">
          {artifact.content}
        </pre>
      )}
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
