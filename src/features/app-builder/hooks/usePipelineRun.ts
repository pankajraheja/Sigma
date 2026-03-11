// ---------------------------------------------------------------------------
// usePipelineRun — manages a single SDLC pipeline run lifecycle.
//
// Handles: run creation, status polling, stage selection, retry after
// review rejection, and cancellation.
//
// All backend communication goes through sdlcApi. This hook owns the
// frontend state machine for a pipeline run.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { sdlcApi, SdlcApiError } from '../api/sdlcApi'
import type {
  ProjectRequest,
  PipelineRun,
  PipelineStage,
  StageResult,
  RunStatus,
  ReviewDecision,
  PackagingSummary,
  DeliverableOutput,
} from '../types'
import { PIPELINE_STAGES, STAGE_META, TERMINAL_STATUSES } from '../types'
import { derivePackagingSummary, buildDeliverableOutput } from '../utils/packaging'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Polling interval while pipeline is running (ms) */
const POLL_INTERVAL_MS = 3000

/** Stop polling after this many consecutive errors */
const MAX_CONSECUTIVE_ERRORS = 5

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
  const pollErrorCountRef = useRef(0)
  /** Tracks whether the user has manually selected a stage during this run */
  const userSelectedStageRef = useRef(false)

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopPolling()
      abortRef.current?.abort()
    }
  }, [])

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  // ── Poll for run status updates ──────────────────────────────────────
  const startPolling = useCallback((runId: string) => {
    stopPolling()
    pollErrorCountRef.current = 0

    pollRef.current = setInterval(async () => {
      try {
        const controller = new AbortController()
        const { run } = await sdlcApi.getRunStatus(runId, controller.signal)

        // Reset error counter on success
        pollErrorCountRef.current = 0

        setState((prev) => {
          // Preserve user's manual stage selection; auto-advance only if they haven't picked one
          const nextSelectedStage = userSelectedStageRef.current
            ? prev.selectedStage
            : (run.currentStage ?? prev.selectedStage)

          return {
            ...prev,
            run,
            polling: true,
            error: null,
            selectedStage: nextSelectedStage,
          }
        })

        // Stop polling when the run reaches a terminal state
        if (TERMINAL_STATUSES.includes(run.status)) {
          stopPolling()
          setState((prev) => ({ ...prev, polling: false }))
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return

        pollErrorCountRef.current++
        console.warn(
          `[usePipelineRun] Poll error (${pollErrorCountRef.current}/${MAX_CONSECUTIVE_ERRORS}):`,
          err,
        )

        // Stop polling after too many consecutive failures
        if (pollErrorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
          stopPolling()
          const msg = err instanceof SdlcApiError
            ? err.message
            : 'Lost connection to SDLC backend'
          setState((prev) => ({ ...prev, polling: false, error: msg }))
        }
      }
    }, POLL_INTERVAL_MS)
  }, [])

  // ── Start a new pipeline run ─────────────────────────────────────────
  const startRun = useCallback(async (request: ProjectRequest) => {
    // Abort any previous operation
    abortRef.current?.abort()
    stopPolling()
    userSelectedStageRef.current = false

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
    userSelectedStageRef.current = true
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

    stopPolling()

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
    stopPolling()
    abortRef.current?.abort()
    userSelectedStageRef.current = false
    setHandedOff(false)
    setHandingOff(false)
    setState({
      run: null,
      selectedStage: null,
      starting: false,
      polling: false,
      error: null,
    })
  }, [])

  // ── Hand off to Delivery Hub ────────────────────────────────────────
  const [handingOff, setHandingOff] = useState(false)
  const [handedOff, setHandedOff] = useState(false)

  const handOffToDelivery = useCallback(async () => {
    const run = state.run
    if (!run || run.status !== 'completed') return

    setHandingOff(true)
    setState((prev) => ({ ...prev, error: null }))

    try {
      const payload = {
        id: `studio-${run.id}-${Date.now()}`,
        source: 'solutions-studio' as const,
        runId: run.id,
        projectName: run.request.name,
        artifactCount: run.stages.reduce((sum, s) => sum + s.artifacts.length, 0),
        readmeSummary: `SDLC pipeline output for "${run.request.name}". ${run.request.description.slice(0, 200)}`,
        stageSummary: run.stages.map((s) => ({
          stage: s.stage,
          label: STAGE_META[s.stage].label,
          status: s.status,
          artifactCount: s.artifacts.length,
        })),
        provider: run.providerInfo,
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as Record<string, string>).message ?? `Handoff failed (${res.status})`)
      }

      setHandedOff(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Handoff to Delivery Hub failed'
      setState((prev) => ({ ...prev, error: msg }))
    } finally {
      setHandingOff(false)
    }
  }, [state.run])

  // ── Derived state ────────────────────────────────────────────────────
  const selectedStageResult: StageResult | null =
    state.run?.stages.find((s) => s.stage === state.selectedStage) ?? null

  const latestReview: ReviewDecision | null =
    state.run?.reviewHistory[state.run.reviewHistory.length - 1] ?? null

  const canRetry = state.run?.status === 'rejected' && latestReview && !latestReview.approved &&
    latestReview.attempt < latestReview.maxAttempts

  // Packaging and deliverable state — derived from run data
  const packagingSummary: PackagingSummary | null = useMemo(
    () => state.run ? derivePackagingSummary(state.run) : null,
    [state.run],
  )

  const deliverable: DeliverableOutput | null = useMemo(
    () => state.run ? buildDeliverableOutput(state.run) : null,
    [state.run],
  )

  return {
    run: state.run,
    selectedStage: state.selectedStage,
    selectedStageResult,
    latestReview,
    packagingSummary,
    deliverable,
    starting: state.starting,
    polling: state.polling,
    error: state.error,
    canRetry: !!canRetry,
    handingOff,
    handedOff,
    startRun,
    selectStage,
    retryRun,
    cancelRun,
    reset,
    handOffToDelivery,
  }
}
