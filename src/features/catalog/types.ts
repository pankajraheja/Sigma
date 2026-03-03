// ---------------------------------------------------------------------------
// Catalog module types
//
// All Catalog-specific domain types live here.
// Shared platform types (ModuleId, ModuleStatus, etc.) live in src/types/.
// ---------------------------------------------------------------------------

// ── Publication lifecycle ────────────────────────────────────────────────────

export type PublicationStatus =
  | 'draft'       // being authored; not visible outside the authoring team
  | 'submitted'   // submitted for review; locked for edits
  | 'in-review'   // under active certification review
  | 'approved'    // certified and published; discoverable in Catalog
  | 'deprecated'  // superseded; visible but flagged as end-of-life
  | 'archived'    // retired; hidden from default discovery

// ── Asset kinds ──────────────────────────────────────────────────────────────

export type AssetKind =
  | 'Dataset'
  | 'API'
  | 'Report'
  | 'Model'
  | 'Dashboard'
  | 'Pipeline'
  | 'Template'
  | 'Skill'
  | 'Connector'

// ── NFR enumerations ─────────────────────────────────────────────────────────

export type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted'

export type HostingType = 'Cloud' | 'On-Premise' | 'Hybrid' | 'SaaS'

// ── Nested structures ─────────────────────────────────────────────────────────

export interface CatalogNFRs {
  dataClassification: DataClassification
  hostingType:        HostingType
  containsPII:        boolean
  /** e.g. "99.9%" */
  sla?:               string
  /** e.g. "7 years" */
  retentionPolicy?:   string
  /** e.g. ['GDPR', 'CCPA', 'SOX'] */
  complianceTags:     string[]
}

export interface AssetVersion {
  version:    string   // semver, e.g. "2.1.0"
  releasedAt: string   // ISO date
  changedBy:  string   // team or person
  summary:    string   // human-readable changelog entry
}

export type LinkedResourceKind =
  | 'documentation'
  | 'source'
  | 'lineage'
  | 'runbook'
  | 'jira'
  | 'github'

export interface LinkedResource {
  label: string
  href:  string
  kind:  LinkedResourceKind
}

export interface AuditEntry {
  action:      string   // human-readable description of what happened
  performedBy: string   // person or system
  at:          string   // ISO date
}

export interface CertificationSummary {
  certifiedBy: string
  certifiedAt: string   // ISO date
  validUntil:  string   // ISO date
  standard:    string   // e.g. "Enterprise Metadata Standard v3.0"
  score:       number   // 0–100 compliance score
}

// ── Primary asset record ─────────────────────────────────────────────────────

export interface CatalogAsset {
  // Required metadata (per metadataRules.ts)
  id:    string
  name:  string
  owner: string   // team or person who owns this asset
  domain: string  // enterprise taxonomy domain

  // Display fields
  shortSummary: string   // one-liner for cards and search results
  description:  string   // full prose for the detail page

  // Classification
  kind:              AssetKind
  publicationStatus: PublicationStatus

  // Taxonomy dimensions
  country:         string[]   // ISO-like short codes e.g. ['US', 'UK', 'AU']
  opco:            string[]   // operating company segments
  functionGroup:   string     // e.g. 'Technology', 'Finance', 'Operations'
  industrySector:  string     // e.g. 'Banking', 'Insurance'
  serviceOffering: string     // e.g. 'Data & Analytics', 'AI Services'
  tags:            string[]   // lowercase-hyphen free-form tags

  // Non-functional requirements
  nfrs: CatalogNFRs

  // Source module that produced or registered this asset
  sourceModule: string
  /** Optional external reference URL or module asset ID */
  sourceRef?: string

  // Linked resources
  linkedResources: LinkedResource[]

  // Versioning
  currentVersion: string
  versions:       AssetVersion[]

  // Audit trail
  auditLog: AuditEntry[]

  // Certification (only approved assets have this)
  certification?: CertificationSummary

  // Timestamps
  createdAt:    string   // ISO date
  updatedAt:    string   // ISO date
  publishedAt?: string   // ISO date — when first approved

  // Usage metrics
  usageCount: number
  featured:   boolean    // pinned as featured on the Catalog home page
}

// ── Filter state shape (used by CatalogDiscoveryPage) ───────────────────────

export interface CatalogFilters {
  kinds:               Set<AssetKind>
  statuses:            Set<PublicationStatus>
  domains:             Set<string>
  countries:           Set<string>
  opcos:               Set<string>
  functionGroups:      Set<string>
  industrySectors:     Set<string>
  serviceOfferings:    Set<string>
  dataClassifications: Set<DataClassification>
  hostingTypes:        Set<HostingType>
  piiFilter:           'all' | 'yes' | 'no'
}

export type CatalogSortKey = 'updated' | 'name' | 'usage' | 'published'
