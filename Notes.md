# SigAI Platform — Module Notes

## Overview

Solutions Studio (`src/features/app-builder/`) is a workflow-driven build workspace inside SigAI. It connects to an **external FastAPI SDLC backend** to orchestrate AI-powered software generation pipelines. The frontend owns request intake, run visibility, and stage output viewing — the backend owns pipeline orchestration, stage sequencing, retry logic, and provider abstraction.

---

## File Structure

```
src/features/app-builder/
├── AppBuilderPage.tsx          # Entry point — composition only, renders StudioWorkspace
├── types.ts                    # All frontend-side types for the module
├── api/
│   └── sdlcApi.ts              # Typed fetch client for the external SDLC backend
├── components/
│   ├── StudioWorkspace.tsx     # Three-panel layout — orchestrates all panels
│   ├── RequestPanel.tsx        # Left panel — project intake form
│   ├── PipelineTimeline.tsx    # Center-left — vertical stage progression
│   ├── StageViewer.tsx         # Center — selected stage output/artifacts
│   └── RunSummaryPanel.tsx     # Right panel — run metadata, status, packaging, actions
├── hooks/
│   ├── useBackendHealth.ts     # Polls GET /health, provides backend status
│   └── usePipelineRun.ts       # Run lifecycle state machine + packaging/deliverable derivation
└── utils/
    ├── format.ts               # Shared formatting (formatDuration) — single source of truth
    └── packaging.ts            # Pure functions: derive packaging status, build deliverable output
```

---

## How Each Piece Works

### sdlcApi.ts — Backend Client

Thin typed fetch wrapper. All backend communication flows through this single module.

- **Base URL**: `VITE_SDLC_API_URL` env var, defaults to `/api/sdlc` (proxied by Vite dev server to `localhost:8000`)
- **Endpoints**:
  - `checkHealth()` → `GET /health` — returns backend status, version, service health
  - `createRun(request)` → `POST /pipeline/run` — submits a project request, returns `run_id`
  - `getRunStatus(runId)` → `GET /pipeline/run/:runId` — returns full run state (used for polling)
  - `getStageOutput(runId, stage)` → `GET /pipeline/run/:runId/stages/:stage` — individual stage detail
  - `retryRun(runId)` → `POST /pipeline/run/:runId/retry` — signals retry after rejection
  - `cancelRun(runId)` → `POST /pipeline/run/:runId/cancel` — cancels a running pipeline
- **Error handling**: `SdlcApiError` with HTTP status code, parsed from `detail` or `message` in response body
- All methods accept optional `AbortSignal` for cancellation

### useBackendHealth.ts — Health Polling Hook

Monitors SDLC backend availability on a timer.

- Calls `GET /health` on mount, then every **15 seconds**
- On failure, backs off to **30 seconds** between retries
- Returns `{ status, detail, lastChecked }` where status is one of: `checking` | `connected` | `degraded` | `disconnected`
- Used by `StudioWorkspace` to show a status dot and disable the submit button when backend is unreachable

### usePipelineRun.ts — Run Lifecycle State Machine

Central hook that manages the entire pipeline run lifecycle. All run state lives here.

**States**: idle → starting → running (polling) → completed / failed / rejected

**Key behaviors**:
- `startRun(request)` — creates optimistic local state, POSTs to backend, begins polling on success
- `startPolling(runId)` — 3-second interval calling `getRunStatus`, replaces `state.run` on each success
- **Terminal detection** — polling stops automatically when `run.status` is `completed`, `failed`, or `rejected`
- **Error backoff** — after 5 consecutive poll failures, polling stops and surfaces an error message
- **Stage selection preservation** — if the user manually clicks a stage, their selection is preserved during poll updates; otherwise the view auto-advances to `run.currentStage`
- `retryRun()` — signals retry after rejection, resumes polling
- `cancelRun()` — stops polling, sends cancel to backend, sets status to `failed`
- `reset()` — clears all state, stops polling, ready for a new run
- Cleanup on unmount clears intervals and aborts pending requests

### StudioWorkspace.tsx — Three-Panel Layout

Main workspace component. Composition layer that wires hooks to panels.

- **Top bar**: "Solutions Studio" title, run name, live indicator (pulsing blue when polling), provider info, backend status dot
- **Error banner**: Red bar shown when `error` is set
- **Left panel (280px)**: `RequestPanel` — project intake form, disabled when backend disconnected
- **Center panel (flex)**:
  - `PipelineTimeline` (220px) — vertical stage list with status icons, "updating" badge when live
  - `StageViewer` (flex) — output content, artifacts, error details for selected stage
- **Right panel (240px)**: `RunSummaryPanel` — status indicator, progress bar, project info, review history, action buttons
- Empty state shows Sigma logo with description when no run exists

### RequestPanel.tsx — Project Intake Form

Left panel with four fields: Project Name (required), Description (required), Tech Stack (optional), Constraints (optional).

- Submit disabled when: fields empty, run starting, run in progress, or backend disconnected
- Shows "SDLC backend is not reachable" warning when disconnected
- Ctrl+Enter keyboard shortcut for submit
- "New" button in header resets the workspace for a new run

### PipelineTimeline.tsx — Stage Progression

Vertical list of all 6 pipeline stages with visual status indicators.

- **Stages**: Requirements → Architecture → Code Generation → Testing → Review → Packaging
- Each stage shows: status icon (pending/running/completed/failed/skipped/rejected), label, description, duration
- Connector lines between stages change color based on completion
- "active" badge on currently running stage, "rejected" badge if applicable
- "updating" badge in header when `isLive` is true
- Click a stage to view its output in `StageViewer`

### StageViewer.tsx — Stage Output Display

Center panel showing the selected stage's content.

- **Pending**: "Waiting for pipeline to reach this stage..."
- **Running**: Spinner with stage name
- **Failed**: Red error card with error message
- **Completed/Rejected**: Output text in a monospace pre block + artifact cards
- Artifacts rendered as collapsible cards with name, type badge, and content preview
- Code artifacts get a different icon (FileJson) than text artifacts (FileText)

### RunSummaryPanel.tsx — Run Metadata & Actions

Right panel showing run-level information.

- **Status indicator**: Icon + colored label (Idle/Running/Completed/Failed/Rejected)
- **Progress bar**: Filled based on completed stages / total stages, color changes by status
- **Elapsed time**: Formatted as ms/s/min
- **Project info**: Name and description summary
- **Provider info**: Provider name and model (if available)
- **Review history**: List of review decisions with attempt numbers and feedback
- **Actions**: Retry Pipeline (amber, shown when rejected + retries available), Cancel Run (shown when running), Export Output (disabled placeholder for future)

### types.ts — Shared Type Definitions

All types for the module in one file. Key types:

- `PIPELINE_STAGES` — ordered const array of 6 stage IDs
- `PipelineStage` — union type derived from the stages array
- `StageStatus` — `pending | running | completed | failed | skipped | rejected`
- `StageResult` — per-stage output with status, timestamps, output text, artifacts, error
- `PipelineRun` — full run object with stages array, review history, provider info
- `ProjectRequest` — user input: name, description, techStack, constraints
- `HealthResponse` — backend health with status, version, uptime, services
- `BackendStatus` — frontend-side status: `connected | degraded | disconnected | checking`
- `CreateRunResponse` — backend returns `run_id` (snake_case), status, optional full run
- `RunStatusResponse`, `StageOutputResponse` — polling and stage detail response shapes

---

## Vite Dev Proxy

In `vite.config.ts`, the `/api/sdlc` path is proxied to `http://localhost:8000` (the FastAPI SDLC backend). This keeps the frontend running on its own dev server while forwarding SDLC requests to the external backend.

---

## Data Flow

```
User fills form → RequestPanel.onSubmit
  → usePipelineRun.startRun(request)
    → sdlcApi.createRun(request) → POST /pipeline/run
    → optimistic state set immediately
    → on success: startPolling(runId)
      → sdlcApi.getRunStatus(runId) every 3s → GET /pipeline/run/:runId
      → state.run replaced on each poll
      → StudioWorkspace re-renders all panels with new data
      → stops on terminal status or 5 consecutive errors
```

```
Module mounts → useBackendHealth
  → sdlcApi.checkHealth() → GET /health
  → status dot updates in top bar
  → RequestPanel submit disabled if disconnected
  → re-checks every 15s (30s on error)
```

---

## Packaging, Export & Delivery Hub Handoff

### packaging.ts — Pure derivation utilities

All packaging/deliverable state is **derived from run data** — no separate backend call required.

- `derivePackagingSummary(run)` → `PackagingSummary` with:
  - `status`: `not_started | in_progress | ready | failed | skipped`
  - `totalArtifacts`: count across all stages
  - `artifactsByStage`: grouped artifacts with stage labels
  - `allStagesCompleted`, `reviewApproved` flags
- `buildDeliverableOutput(run)` → `DeliverableOutput | null` (only for completed runs)
  - Portable descriptor: `runId`, `projectName`, `completedAt`, `packagingStatus`, `artifactCount`, `provider`, per-stage manifest
  - Designed as the handoff contract for Delivery Hub integration
- `classifyArtifactType(type)` → `'code' | 'document' | 'data' | 'other'` for icon selection
- `formatFileSize(bytes)` → human-readable size string

### RunSummaryPanel — Packaging & Artifact Sections

When a run reaches a terminal state:

- **Packaging status**: green "Ready", red "Failed", gray "Skipped", blue "In progress"
- **Artifact summary**: grouped by stage, each artifact shows type icon, name, optional size
- **Export Artifacts** button: shown when packaging is ready (disabled until backend artifacts endpoint exists)
- **Hand Off to Delivery** button: shown for completed, package-ready runs (disabled until Delivery Hub integration)
- **Status explanations**: contextual messages for failed/skipped packaging

### sdlcApi.ts — Artifacts Endpoint

`getRunArtifacts(runId)` → `GET /pipeline/run/:runId/artifacts` is wired but **the backend endpoint may not exist yet**. The frontend currently derives all artifact data from stage results returned by polling.

---

## Delivery Hub Handoff (Phase 1)

Solutions Studio completed runs can be handed off to Delivery Hub via the "Hand Off to Delivery" button in RunSummaryPanel.

**Flow**: `usePipelineRun.handOffToDelivery()` → `POST /api/submissions` with `source: 'solutions-studio'`

**Backend**: `submission-store.ts` uses a discriminated union (`PrototypeSubmission | StudioSubmission`) keyed by `source` field. The route validates differently based on source type.

**Delivery Hub**: `SubmissionsTable` renders source-aware rows with badges (purple "Prototype" / blue "Studio"), unified Name column, and source-specific Details column. Stats bar shows per-source counts.

**Studio submission shape**: `runId`, `projectName`, `artifactCount`, `stageSummary[]`, `provider`

---

## Future Extension Points

- **Stage detail fetch**: `getStageOutput()` is wired but not yet called during polling — ready for on-demand artifact loading
- **Retry visualization**: `retryRun()` and review history display are implemented, awaiting backend support
- **Artifact download**: `getRunArtifacts()` is wired; when the backend exposes it, the "Export Artifacts" button can be enabled to trigger a download
- **Real packaging stage polling**: if the backend surfaces packaging progress separately from the run status, `derivePackagingSummary` can be replaced with a direct backend call

---

# Admin Control Center — Governance Hub

## Overview

Admin Control Center (`src/features/admin/`) is the platform governance hub. It manages shared configuration domains consumed by multiple modules. Evolved from a brand-only editor into a multi-domain governance layer.

## Route Structure

```
/admin                       → GovernanceDashboard (domain overview with navigable cards)
/admin/branding              → BrandingPage (brand token editor + live preview)
/admin/taxonomy              → TaxonomyAdminPage (scheme/term CRUD)
/admin/prototype-governance  → PrototypeGovernancePage (blocks, workspace policies, validation)
/admin/solutions-governance  → SolutionsGovernancePage (templates, stacks, deployment — coming soon)
```

## Governance Domains

Defined in `src/shared/types/governance.ts`:

| Domain | Label | Status | Consumers |
|--------|-------|--------|-----------|
| `brand-config` | Branding | Active | Prototype Lab, Solutions Studio |
| `taxonomy-config` | Taxonomy & Metadata | Active | AI Navigator, Prototype Lab |
| `prototype-governance` | Prototype Governance | Active | Prototype Lab |
| `solutions-governance` | Solutions Governance | Coming Soon | Solutions Studio |

## Shared Governance Types

**`PrototypeGovernanceConfig`** — admin-managed config for Prototype Lab:
- `allowedBlockIds` — platform-wide block allowlist (null = all)
- `enforceBrandValidation` — whether auto-correction is enforced
- `maxPagesPerWorkspace` — page limit per workspace
- `allowedWorkspaceTypes` — restrict available workspace types

**`SolutionsGovernanceConfig`** — admin-managed config for Solutions Studio:
- `allowedTemplates` — solution template definitions
- `allowedStacks` — tech stack restrictions (null = unrestricted)
- `deploymentTargets` — configured deployment environments
- `maxConcurrentRuns`, `requireReview`, `requirePackaging` — pipeline constraints

## How Modules Consume Governance

**Prototype Lab**: `workspace-policy.ts` accepts `governanceConfig?: PrototypeGovernanceConfig` on `BlockPolicyContext`. The `resolveAllowedBlockIds()` function intersects governance allowlist with workspace/page policies. Currently uses `DEFAULT_PROTOTYPE_GOVERNANCE` (all blocks allowed). When Admin persists config to backend, Prototype Lab just loads and passes it.

**Solutions Studio**: `SolutionsGovernanceConfig` defines the contract. Studio imports the types but currently runs with `DEFAULT_SOLUTIONS_GOVERNANCE` (permissive defaults). Full governance consumption will be added when the admin backend persistence layer is built.

## File Structure

```
src/features/admin/
├── AdminPage.tsx                        # Sub-router — lazy loads all governance pages
├── GovernanceDashboard.tsx              # Landing page — domain cards
├── branding/
│   ├── BrandingPage.tsx                 # Brand token editor + preview
│   └── components/
│       ├── BrandEditorForm.tsx
│       ├── BrandPreview.tsx
│       └── BrandSwitcher.tsx
├── taxonomy/
│   ├── TaxonomyAdminPage.tsx            # Scheme/term CRUD
│   ├── TermFormDialog.tsx
│   ├── useTaxonomyAdmin.ts
│   └── index.ts
├── prototype-governance/
│   └── PrototypeGovernancePage.tsx       # Block registry, workspace policies, validation rules
└── solutions-governance/
    └── SolutionsGovernancePage.tsx       # Coming-soon: templates, stacks, deployment targets

src/shared/types/
├── governance.ts                        # Shared governance domain types + config contracts
└── taxonomy.ts                          # Taxonomy 4-table schema types
```

## Future Governance Work

- Backend persistence for governance config (currently in-memory defaults)
- RBAC integration — per-domain edit permissions
- Provider governance — allowed AI providers/models
- Deployment governance — infrastructure constraints
- Audit/change history — who changed what governance config when
- Edit/save UI in PrototypeGovernancePage and SolutionsGovernancePage
- Delivery Hub governance metadata — which rules applied to each deliverable

---

# Shared Platform Contracts

## Overview

Cross-module types that are structurally shared between multiple SigAI modules live in `src/shared/types/`. Module-specific types (rendering, internal state) stay local to each feature folder.

## Shared Type Files

```
src/shared/types/
├── delivery.ts       # Cross-module submission/handoff contracts
├── governance.ts     # Governance domain configs consumed by Admin + modules
└── taxonomy.ts       # Taxonomy 4-table schema types
```

### delivery.ts — Submission & Handoff Contracts

Shared between Prototype Lab, Solutions Studio, Delivery Hub, and the backend submission store.

- **`SubmissionSource`** — `'prototype-lab' | 'solutions-studio'` — which module originated a submission
- **`ProviderInfo`** — `{ provider, model }` — AI provider/model that generated output
- **`StageSummaryItem`** — `{ stage, label, status, artifactCount }` — compact per-stage metadata for handoff payloads
- **`SubmissionPage`** — `{ route, title, description, html }` — page shape stored for prototype re-download

### Import Patterns

- **Frontend modules** import directly: `import type { ProviderInfo } from '../../shared/types/delivery'`
- **app-builder/types.ts** re-exports `ProviderInfo` so existing in-module imports keep working
- **delivery-hub/types.ts** re-exports `SubmissionSource`, `ProviderInfo`, `StageSummaryItem` for convenience
- **Backend** (`backend/catalog/src/services/submission-store.ts`) mirrors the same type names but can't import from frontend tree (separate tsconfig). Kept in sync by convention with alignment comments.

### What Stays Local

- `PrototypeListItem`, `StudioListItem`, `SubmissionDetail` — Delivery Hub view models
- `PipelineRun`, `StageResult`, `StageArtifact` — Solutions Studio internal types
- `PrototypePage` — Prototype Lab workspace model
- `SubmissionBrandConfig` — backend-specific brand config persistence shape

---

# Platform Shell & Navigation

## Overview

SigAI uses a consistent shell architecture: AppShell wraps all pages with TopRibbon + MainNavbar + Footer. Module pages are lazy-loaded into the `<main>` content area.

## Shell Components

```
src/components/shell/
├── TopRibbon.tsx     # Environment badge + utility links (h-7, sticky)
├── MainNavbar.tsx    # BrandMark + registry-driven module nav (h-14, sticky)
├── NavItem.tsx       # Individual nav link with active indicator
├── Footer.tsx        # Governance versions + copyright
├── PageShell.tsx     # Content-mode page container (bg-surface-raised)
└── PageHeader.tsx    # Standard header bar (icon, title, subtitle, actions, back button)
```

## Two Layout Modes

### Content Mode — `PageShell` + `PageHeader` + `PageContent`
Used by: Delivery Hub, Admin (Governance Dashboard, Prototype Governance, Solutions Governance), Vizier

Pattern:
```tsx
<PageShell>
  <PageHeader icon={Package} title="Delivery Hub" subtitle="..." maxWidth="7xl" actions={...} />
  <PageContent maxWidth="7xl">
    {/* module content */}
  </PageContent>
</PageShell>
```

`PageShell` provides `min-h-full bg-surface-raised`. `PageHeader` provides `border-b border-border bg-surface` header bar with icon box, title, subtitle, and optional actions/back button. `PageContent` provides `mx-auto max-w-{size} px-6 py-6` constraint.

### Workspace Mode — full-height panel layouts
Used by: Prototype Lab, Solutions Studio

Pattern: `h-[calc(100vh-64px)]` with flex panels. These modules own their own top bar and panel structure — they don't use PageShell because they need full viewport control.

## Shared UI Components

```
src/components/ui/
├── EmptyState.tsx    # Icon + title + description + action slot
├── LoadingState.tsx  # Spinner or skeleton variant
├── Card.tsx          # Surface card with body + footer
├── Panel.tsx         # Collapsible panel with header + rows
├── Button.tsx        # Primary/outline/ghost variants
├── SectionHeader.tsx # Eyebrow + title + subtitle + action
├── StatusBadge.tsx   # live/beta/preview/coming-soon
└── ModulePlaceholder.tsx # Placeholder for unbuilt modules
```

## Design Token Usage

All content-mode pages now use the platform design token system consistently:
- **Backgrounds**: `bg-surface`, `bg-surface-raised`, `bg-surface-subtle`
- **Borders**: `border-border`, `border-border-muted`, `border-border-strong`
- **Text**: `text-ink`, `text-ink-muted`, `text-ink-faint`, `text-ink-inverse`
- **Status**: `text-success`, `text-warning`, `text-error`
- **Shadows**: `shadow-card`, `shadow-panel`

Raw Tailwind color classes (`gray-50`, `gray-200`, etc.) should not be used in content-mode pages. Status-specific colors (green-50 for "Active" badges, amber-50 for "Coming Soon") are acceptable as semantic accents.

## Module Identity Within the Shell

Each module retains its distinct identity:
- **AI Navigator** (Catalog) — rich hero section with search, KPI cards, featured assets grid. Owns its own layout since it has a unique discovery-focused entry experience.
- **Prototype Lab** — three-panel workspace (page tree / editor / preview). Full-height, panel-based.
- **Solutions Studio** — three-panel workspace (request / timeline+viewer / summary). Full-height, panel-based.
- **Delivery Hub** — PageShell with data table. Uses maxWidth="7xl" for wide table layout.
- **Admin Control Center** — PageShell with sub-routes. GovernanceDashboard shows domain cards. Sub-pages (Prototype/Solutions Governance, Branding, Taxonomy) use PageHeader with back button.
- **Vizier** — PageShell with section card grid. Preview status badge in header.

## Future Consistency Gaps

- Catalog sub-pages (discovery, asset detail) don't use PageShell yet — they have rich custom layouts
- Branding and Taxonomy admin sub-pages haven't been migrated to PageShell/PageHeader yet
- Workspace modules (Prototype Lab, Solutions Studio) have slightly different top bar patterns — could share a `WorkspaceHeader` component
- No shared error banner component yet (each module has its own inline error display)
- Empty states in SubmissionsTable and other tables could use the shared `EmptyState` component
