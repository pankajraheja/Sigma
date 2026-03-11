// ---------------------------------------------------------------------------
// Solutions Studio types — frontend-side contracts for SDLC pipeline integration.
//
// These types model the external Agentic SDLC backend's concepts in a
// frontend-friendly way. They align conceptually with the FastAPI backend
// contracts but are owned by the SigAI frontend and may diverge as the
// UI layer evolves independently.
//
// The SDLC backend remains the source of truth for execution; these types
// are the source of truth for display and interaction.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pipeline stages — ordered phases of the SDLC pipeline
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES = [
  'requirements',
  'architecture',
  'codegen',
  'testing',
  'review',
  'packaging',
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const STAGE_META: Record<PipelineStage, { label: string; description: string }> = {
  requirements:  { label: 'Requirements',  description: 'Gather and structure functional and non-functional requirements.' },
  architecture:  { label: 'Architecture',  description: 'Design system architecture, components, and data models.' },
  codegen:       { label: 'Code Generation', description: 'Generate implementation code from architecture specs.' },
  testing:       { label: 'Testing',        description: 'Generate and execute test suites for quality assurance.' },
  review:        { label: 'Review',         description: 'Automated review with accept/reject decision.' },
  packaging:     { label: 'Packaging',      description: 'Bundle approved output for delivery and handoff.' },
}

// ---------------------------------------------------------------------------
// Stage status
// ---------------------------------------------------------------------------

export type StageStatus =
  | 'pending'     // not yet started
  | 'running'     // currently executing
  | 'completed'   // finished successfully
  | 'failed'      // finished with error
  | 'skipped'     // skipped by pipeline logic
  | 'rejected'    // review rejected — triggers retry

// ---------------------------------------------------------------------------
// Stage result — output from a completed stage
// ---------------------------------------------------------------------------

export interface StageResult {
  stage: PipelineStage
  status: StageStatus
  /** ISO timestamp when this stage started */
  startedAt: string | null
  /** ISO timestamp when this stage completed */
  completedAt: string | null
  /** Duration in milliseconds */
  durationMs: number | null
  /** Primary output content (requirements doc, architecture spec, code, etc.) */
  output: string | null
  /** Structured artifacts if available */
  artifacts: StageArtifact[]
  /** Error message if the stage failed */
  error: string | null
}

export interface StageArtifact {
  /** Artifact identifier */
  id: string
  /** Human-readable name */
  name: string
  /** MIME type or artifact kind (e.g. "text/markdown", "application/json", "code/python") */
  type: string
  /** Content or download reference */
  content: string
}

// ---------------------------------------------------------------------------
// Review — special handling for the review stage
// ---------------------------------------------------------------------------

export interface ReviewDecision {
  /** Whether the review passed */
  approved: boolean
  /** Reviewer feedback / rejection reason */
  feedback: string
  /** Which attempt number this review corresponds to */
  attempt: number
  /** Maximum retry attempts allowed */
  maxAttempts: number
}

// ---------------------------------------------------------------------------
// Pipeline run — a complete execution of the SDLC pipeline
// ---------------------------------------------------------------------------

export type RunStatus =
  | 'idle'        // created but not started
  | 'running'     // pipeline is executing
  | 'completed'   // all stages finished successfully
  | 'failed'      // pipeline stopped due to error
  | 'rejected'    // review rejected and retries exhausted

export interface PipelineRun {
  /** Unique run identifier */
  id: string
  /** Current overall status */
  status: RunStatus
  /** The project request that initiated this run */
  request: ProjectRequest
  /** Per-stage results */
  stages: StageResult[]
  /** Currently active stage (null if idle or completed) */
  currentStage: PipelineStage | null
  /** Review decision history (may have multiple if retries occurred) */
  reviewHistory: ReviewDecision[]
  /** ISO timestamp when the run was created */
  createdAt: string
  /** ISO timestamp when the run completed (or failed) */
  completedAt: string | null
  /** Total elapsed time in milliseconds */
  elapsedMs: number | null
  /** Provider/model info if available */
  providerInfo: ProviderInfo | null
}

// ---------------------------------------------------------------------------
// Project request — the user's input that starts a pipeline run
// ---------------------------------------------------------------------------

export interface ProjectRequest {
  /** Project/solution name */
  name: string
  /** Detailed description of what to build */
  description: string
  /** Technology constraints or preferences */
  techStack?: string
  /** Additional context or requirements */
  constraints?: string
}

// ---------------------------------------------------------------------------
// Provider info — which AI provider/model handled the run
// ---------------------------------------------------------------------------

export interface ProviderInfo {
  provider: string
  model: string
}

// ---------------------------------------------------------------------------
// Health check — response from GET /health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  version?: string
  uptime?: number
  services?: Record<string, { status: string; latency_ms?: number }>
}

export type BackendStatus = 'connected' | 'degraded' | 'disconnected' | 'checking'

// ---------------------------------------------------------------------------
// API response wrappers — shapes returned by the SDLC backend
// ---------------------------------------------------------------------------

/**
 * POST /pipeline/run response — the real backend returns this shape.
 * The backend may return a full run object or a minimal creation ack.
 */
export interface CreateRunResponse {
  run_id: string
  status: RunStatus | string
  /** Full run data if the backend returns it immediately */
  run?: PipelineRun
}

export interface RunStatusResponse {
  run: PipelineRun
}

export interface StageOutputResponse {
  stage: PipelineStage
  result: StageResult
}
