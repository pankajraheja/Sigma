// ---------------------------------------------------------------------------
// usePipelineRun — manages a single SDLC pipeline run lifecycle.
//
// Handles: run creation, status polling, stage selection, retry after
// review rejection, and cancellation.
//
// All backend communication goes through sdlcApi. This hook owns the
// frontend state machine for a pipeline run.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef, useEffect } from 'react'
import { sdlcApi, SdlcApiError } from '../api/sdlcApi'
import type {
  ProjectRequest,
  PipelineRun,
  PipelineStage,
  StageResult,
  RunStatus,
  ReviewDecision,
} from '../types'
import { PIPELINE_STAGES } from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Polling interval while pipeline is running (ms) */
const POLL_INTERVAL_MS = 3000

// ---------------------------------------------------------------------------
// Hook state
// ---------------------------------------------------------------------------

interface PipelineRunState {
  /** Current run data — null before first run */
  run: PipelineRun | null
  /** Currently selected stage for inspection */
  selectedStage: PipelineStage | null
  /** Loading state for run creation */
  starting: boolean
  /** Loading state for status polling */
  polling: boolean
  /** Error message */
  error: string | null
}

// ---------------------------------------------------------------------------
// Stub run builder — creates a local run before backend responds
// ---------------------------------------------------------------------------

function buildInitialRun(request: ProjectRequest): PipelineRun {
  const now = new Date().toISOString()
  return {
    id: '',
    status: 'idle',
    request,
    stages: PIPELINE_STAGES.map((stage): StageResult => ({
      stage,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      durationMs: null,
      output: null,
      artifacts: [],
      error: null,
    })),
    currentStage: null,
    reviewHistory: [],
    createdAt: now,
    completedAt: null,
    elapsedMs: null,
    providerInfo: null,
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePipelineRun() {
  const [state, setState] = useState<PipelineRunState>({
    run: null,
    selectedStage: null,
    starting: false,
    polling: false,
    error: null,
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      abortRef.current?.abort()
    }
  }, [])

  // ── Poll for run status updates ──────────────────────────────────────
  const startPolling = useCallback((runId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const controller = new AbortController()
        const { run } = await sdlcApi.getRunStatus(runId, controller.signal)

        setState((prev) => ({
          ...prev,
          run,
          polling: false,
          // Auto-select the current stage if user hasn't manually selected one
          selectedStage: prev.selectedStage ?? run.currentStage,
        }))

        // Stop polling when the run is no longer active
        const terminalStatuses: RunStatus[] = ['completed', 'failed', 'rejected']
        if (terminalStatuses.includes(run.status)) {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.warn('[usePipelineRun] Poll error:', err)
      }
    }, POLL_INTERVAL_MS)
  }, [])

  // ── Start a new pipeline run ─────────────────────────────────────────
  const startRun = useCallback(async (request: ProjectRequest) => {
    // Abort any previous operation
    abortRef.current?.abort()
    if (pollRef.current) clearInterval(pollRef.current)

    const controller = new AbortController()
    abortRef.current = controller

    // Optimistic local state
    const initialRun = buildInitialRun(request)
    setState({
      run: initialRun,
      selectedStage: 'requirements',
      starting: true,
      polling: false,
      error: null,
    })

    try {
      const response = await sdlcApi.createRun(request, controller.signal)
      const runId = response.run_id

      // If backend returned a full run object, use it directly
      const updatedRun = response.run
        ? response.run
        : initialRun.id === ''
          ? { ...initialRun, id: runId, status: (response.status as RunStatus) || 'running' }
          : null

      setState((prev) => ({
        ...prev,
        run: updatedRun ?? (prev.run ? { ...prev.run, id: runId, status: 'running' as RunStatus } : null),
        starting: false,
        polling: true,
      }))

      // Begin polling for status updates
      startPolling(runId)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof SdlcApiError
        ? err.message
        : 'Failed to start pipeline run'
      setState((prev) => ({ ...prev, starting: false, error: msg }))
    }
  }, [startPolling])

  // ── Select a stage for inspection ────────────────────────────────────
  const selectStage = useCallback((stage: PipelineStage) => {
    setState((prev) => ({ ...prev, selectedStage: stage }))
  }, [])

  // ── Retry after review rejection ─────────────────────────────────────
  const retryRun = useCallback(async () => {
    const runId = state.run?.id
    if (!runId) return

    setState((prev) => ({ ...prev, error: null, polling: true }))

    try {
      const controller = new AbortController()
      abortRef.current = controller
      const { run } = await sdlcApi.retryRun(runId, controller.signal)

      setState((prev) => ({
        ...prev,
        run,
        polling: true,
        selectedStage: run.currentStage ?? prev.selectedStage,
      }))

      startPolling(runId)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof SdlcApiError ? err.message : 'Retry failed'
      setState((prev) => ({ ...prev, polling: false, error: msg }))
    }
  }, [state.run?.id, startPolling])

  // ── Cancel a running pipeline ────────────────────────────────────────
  const cancelRun = useCallback(async () => {
    const runId = state.run?.id
    if (!runId) return

    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null

    try {
      await sdlcApi.cancelRun(runId)
      setState((prev) => ({
        ...prev,
        run: prev.run ? { ...prev.run, status: 'failed' } : null,
        polling: false,
      }))
    } catch (err) {
      const msg = err instanceof SdlcApiError ? err.message : 'Cancel failed'
      setState((prev) => ({ ...prev, error: msg }))
    }
  }, [state.run?.id])

  // ── Reset to start a new run ─────────────────────────────────────────
  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
    abortRef.current?.abort()
    setState({
      run: null,
      selectedStage: null,
      starting: false,
      polling: false,
      error: null,
    })
  }, [])

  // ── Derived state ────────────────────────────────────────────────────
  const selectedStageResult: StageResult | null =
    state.run?.stages.find((s) => s.stage === state.selectedStage) ?? null

  const latestReview: ReviewDecision | null =
    state.run?.reviewHistory[state.run.reviewHistory.length - 1] ?? null

  const canRetry = state.run?.status === 'rejected' && latestReview && !latestReview.approved &&
    latestReview.attempt < latestReview.maxAttempts

  return {
    run: state.run,
    selectedStage: state.selectedStage,
    selectedStageResult,
    latestReview,
    starting: state.starting,
    polling: state.polling,
    error: state.error,
    canRetry: !!canRetry,
    startRun,
    selectStage,
    retryRun,
    cancelRun,
    reset,
  }
}
