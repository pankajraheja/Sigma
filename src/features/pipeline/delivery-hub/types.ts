// ---------------------------------------------------------------------------
// Delivery Hub types — view models for the submissions table.
//
// Supports two source types:
//   - prototype-lab: exported prototypes with pages + brand config
//   - solutions-studio: SDLC pipeline run deliverables
// ---------------------------------------------------------------------------

export type { SubmissionSource, ProviderInfo, StageSummaryItem } from '../../../shared/types/delivery'
import type { ProviderInfo, StageSummaryItem } from '../../../shared/types/delivery'

// ---------------------------------------------------------------------------
// List items — used in the submissions table
// ---------------------------------------------------------------------------

interface SubmissionBase {
  id: string
  timestamp: string
  source: SubmissionSource
  readmeSummary: string
}

export interface PrototypeListItem extends SubmissionBase {
  source: 'prototype-lab'
  pageCount: number
  brandName: string
  routeList: string[]
  /** True when page HTML + brandConfig are stored and re-download is possible. */
  hasPages: boolean
}

export interface StudioListItem extends SubmissionBase {
  source: 'solutions-studio'
  runId: string
  projectName: string
  artifactCount: number
  stageSummary: StageSummaryItem[]
  provider: ProviderInfo | null
}

export type SubmissionListItem = PrototypeListItem | StudioListItem

// ---------------------------------------------------------------------------
// Detail — used for re-download (prototype-lab only for now)
// ---------------------------------------------------------------------------

export interface SubmissionDetail {
  id: string
  timestamp: string
  pageCount: number
  brandName: string
  readmeSummary: string
  routeList: string[]
  pages?: Array<{ route: string; title: string; description: string; html: string }>
  brandConfig?: Record<string, unknown>
}
