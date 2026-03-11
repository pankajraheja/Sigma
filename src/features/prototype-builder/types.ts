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

// Re-export shared delivery types used by SubmitButton
export type { SubmissionPage } from '../../shared/types/delivery'
