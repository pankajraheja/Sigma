// ---------------------------------------------------------------------------
// SDLC API client — integration boundary for the external Agentic SDLC backend.
//
// All communication with the FastAPI SDLC backend flows through this module.
// The base URL is externalized via VITE_SDLC_API_URL so the frontend never
// hardcodes backend location or provider-specific assumptions.
//
// This client is intentionally thin: it translates fetch calls into typed
// responses. Orchestration, retry, and pipeline logic stay in the backend.
// ---------------------------------------------------------------------------

import type {
  ProjectRequest,
  CreateRunResponse,
  RunStatusResponse,
  StageOutputResponse,
  HealthResponse,
  PipelineStage,
} from '../types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL =
  (import.meta.env['VITE_SDLC_API_URL'] as string | undefined) ??
  '/api/sdlc'

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

export class SdlcApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'SdlcApiError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { detail?: string; message?: string }
    throw new SdlcApiError(
      body.detail ?? body.message ?? `Request failed (${res.status})`,
      res.status,
    )
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const sdlcApi = {
  /**
   * Health check — GET /health.
   * Returns backend status, version, and service health.
   */
  checkHealth: async (signal?: AbortSignal): Promise<HealthResponse> => {
    const res = await fetch(`${BASE_URL}/health`, { signal })
    return handleResponse<HealthResponse>(res)
  },

  /**
   * Create and start a new pipeline run.
   * POST /pipeline/run — the real SDLC backend endpoint.
   */
  createRun: async (
    request: ProjectRequest,
    signal?: AbortSignal,
  ): Promise<CreateRunResponse> => {
    const res = await fetch(`${BASE_URL}/pipeline/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
    return handleResponse<CreateRunResponse>(res)
  },

  /**
   * Get the current status of a pipeline run.
   * GET /pipeline/run/:runId — used for polling during execution.
   */
  getRunStatus: async (
    runId: string,
    signal?: AbortSignal,
  ): Promise<RunStatusResponse> => {
    const res = await fetch(`${BASE_URL}/pipeline/run/${encodeURIComponent(runId)}`, { signal })
    return handleResponse<RunStatusResponse>(res)
  },

  /**
   * Get the detailed output for a specific stage of a run.
   * GET /pipeline/run/:runId/stages/:stage
   */
  getStageOutput: async (
    runId: string,
    stage: PipelineStage,
    signal?: AbortSignal,
  ): Promise<StageOutputResponse> => {
    const res = await fetch(
      `${BASE_URL}/pipeline/run/${encodeURIComponent(runId)}/stages/${stage}`,
      { signal },
    )
    return handleResponse<StageOutputResponse>(res)
  },

  /**
   * Request a retry after review rejection.
   * POST /pipeline/run/:runId/retry
   */
  retryRun: async (
    runId: string,
    signal?: AbortSignal,
  ): Promise<RunStatusResponse> => {
    const res = await fetch(`${BASE_URL}/pipeline/run/${encodeURIComponent(runId)}/retry`, {
      method: 'POST',
      signal,
    })
    return handleResponse<RunStatusResponse>(res)
  },

  /**
   * Cancel a running pipeline.
   * POST /pipeline/run/:runId/cancel
   */
  cancelRun: async (
    runId: string,
    signal?: AbortSignal,
  ): Promise<void> => {
    const res = await fetch(`${BASE_URL}/pipeline/run/${encodeURIComponent(runId)}/cancel`, {
      method: 'POST',
      signal,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { detail?: string }
      throw new SdlcApiError(body.detail ?? 'Cancel failed', res.status)
    }
  },
}
