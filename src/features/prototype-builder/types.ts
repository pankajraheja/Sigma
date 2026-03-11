// ---------------------------------------------------------------------------
// Prototype types — core data model for the Prototype Lab workspace.
// ---------------------------------------------------------------------------

export interface PrototypePage {
  /** Unique page identifier */
  id: string
  /** Route path, e.g. "/" or "/pricing" */
  route: string
  /** Human-readable page title */
  title: string
  /** Short description of the page purpose */
  description: string
  /** Raw HTML string (inline styles only) */
  html: string
  /** ISO timestamp of last generation or edit */
  updatedAt: string
}

export interface SubmissionPage {
  route: string
  title: string
  description: string
  html: string
}

export interface SubmissionRecord {
  id: string
  timestamp: string
  pageCount: number
  brandName: string
  readmeSummary: string
  routeList: string[]
  /** Set by the backend on save */
  createdAt?: string
  /** Stored for re-download in Delivery Hub */
  pages?: SubmissionPage[]
  /** Stored for re-download in Delivery Hub */
  brandConfig?: Record<string, unknown>
}
