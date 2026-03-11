// ---------------------------------------------------------------------------
// Delivery Hub types — lightweight view models for the submissions table.
// ---------------------------------------------------------------------------

export interface SubmissionListItem {
  id: string
  timestamp: string
  pageCount: number
  brandName: string
  readmeSummary: string
  routeList: string[]
  /** True when page HTML + brandConfig are stored and re-download is possible. */
  hasPages: boolean
}

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
