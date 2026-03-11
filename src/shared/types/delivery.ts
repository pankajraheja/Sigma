// ---------------------------------------------------------------------------
// Shared delivery types — cross-module contracts for submission handoffs.
//
// These types define the stable contracts shared between:
//   - Prototype Lab (submits prototype exports)
//   - Solutions Studio (submits pipeline run deliverables)
//   - Delivery Hub (consumes and displays submissions from both sources)
//   - Backend submission store (persists and serves submission records)
//
// Module-specific rendering types (list items, detail views) stay local to
// each module. Only structurally shared contracts live here.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Source identification
// ---------------------------------------------------------------------------

/** Which module originated a submission */
export type SubmissionSource = 'prototype-lab' | 'solutions-studio'

// ---------------------------------------------------------------------------
// Provider info — shared across Solutions Studio and Delivery Hub
// ---------------------------------------------------------------------------

/** AI provider and model that generated output */
export interface ProviderInfo {
  provider: string
  model: string
}

// ---------------------------------------------------------------------------
// Stage summary — compact per-stage metadata used in handoff payloads
// ---------------------------------------------------------------------------

export interface StageSummaryItem {
  stage: string
  label: string
  status: string
  artifactCount: number
}

// ---------------------------------------------------------------------------
// Submission page — shape stored for prototype re-download
// ---------------------------------------------------------------------------

export interface SubmissionPage {
  route: string
  title: string
  description: string
  html: string
}
