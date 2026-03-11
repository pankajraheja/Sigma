// ---------------------------------------------------------------------------
// packaging.ts — derives packaging/deliverable state from a PipelineRun.
//
// Pure functions. No side effects, no backend calls.
// The frontend uses these to compute packaging readiness from run state
// without waiting for a dedicated backend packaging endpoint.
// ---------------------------------------------------------------------------

import {
  STAGE_META,
  type PipelineRun,
  type PipelineStage,
  type PackagingSummary,
  type PackagingStatus,
  type DeliverableOutput,
} from '../types'

// ---------------------------------------------------------------------------
// Derive packaging summary from run state
// ---------------------------------------------------------------------------

export function derivePackagingSummary(run: PipelineRun): PackagingSummary {
  const packagingStage = run.stages.find((s) => s.stage === 'packaging')
  const reviewStage = run.stages.find((s) => s.stage === 'review')

  const status = resolvePackagingStatus(run, packagingStage?.status ?? 'pending')

  const allStagesCompleted = run.stages.every(
    (s) => s.status === 'completed' || s.status === 'skipped',
  )

  const reviewApproved =
    reviewStage?.status === 'completed' ||
    (run.reviewHistory.length > 0 && run.reviewHistory[run.reviewHistory.length - 1].approved)

  // Collect artifacts from all completed stages
  const artifactsByStage: PackagingSummary['artifactsByStage'] = []
  let totalArtifacts = 0

  for (const stage of run.stages) {
    if (stage.artifacts.length > 0) {
      artifactsByStage.push({
        stage: stage.stage,
        stageLabel: STAGE_META[stage.stage].label,
        artifacts: stage.artifacts,
      })
      totalArtifacts += stage.artifacts.length
    }
  }

  return {
    status,
    totalArtifacts,
    artifactsByStage,
    allStagesCompleted,
    reviewApproved,
  }
}

function resolvePackagingStatus(
  run: PipelineRun,
  packagingStageStatus: string,
): PackagingStatus {
  // Run hasn't completed yet
  if (run.status === 'running' || run.status === 'idle') {
    if (packagingStageStatus === 'running') return 'in_progress'
    return 'not_started'
  }

  // Run failed or was rejected before packaging
  if (run.status === 'failed' || run.status === 'rejected') {
    if (packagingStageStatus === 'completed') return 'ready'
    if (packagingStageStatus === 'failed') return 'failed'
    return 'skipped'
  }

  // Run completed
  if (run.status === 'completed') {
    if (packagingStageStatus === 'completed') return 'ready'
    if (packagingStageStatus === 'failed') return 'failed'
    // Completed run but packaging didn't run — treat as ready if artifacts exist
    const hasArtifacts = run.stages.some((s) => s.artifacts.length > 0)
    return hasArtifacts ? 'ready' : 'skipped'
  }

  return 'not_started'
}

// ---------------------------------------------------------------------------
// Build a deliverable output descriptor for Delivery Hub handoff
// ---------------------------------------------------------------------------

export function buildDeliverableOutput(run: PipelineRun): DeliverableOutput | null {
  if (run.status !== 'completed') return null

  const packaging = derivePackagingSummary(run)

  return {
    runId: run.id,
    projectName: run.request.name,
    completedAt: run.completedAt ?? new Date().toISOString(),
    packagingStatus: packaging.status,
    artifactCount: packaging.totalArtifacts,
    provider: run.providerInfo,
    stages: run.stages.map((s) => ({
      stage: s.stage,
      label: STAGE_META[s.stage].label,
      status: s.status,
      artifactCount: s.artifacts.length,
    })),
  }
}

// ---------------------------------------------------------------------------
// Artifact helpers
// ---------------------------------------------------------------------------

/** Classify an artifact type for display purposes */
export function classifyArtifactType(type: string): 'code' | 'document' | 'data' | 'other' {
  if (type.startsWith('code/') || type === 'application/json') return 'code'
  if (type.startsWith('text/') || type === 'application/pdf') return 'document'
  if (type.includes('csv') || type.includes('sql') || type.includes('yaml')) return 'data'
  return 'other'
}

/** Format byte size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
