// ---------------------------------------------------------------------------
// Domain types — mirror the PostgreSQL schema for catalog.* and related tables
// ---------------------------------------------------------------------------

export type GovernanceStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type PublicationStatus = 'preview' | 'ga' | 'deprecated' | 'retired';

// ---------------------------------------------------------------------------
// catalog.assets
// ---------------------------------------------------------------------------

export interface CatalogAsset {
  id: string;
  name: string;
  short_summary: string | null;
  description: string | null;
  asset_kind: string;
  publication_status: PublicationStatus;
  published_at: string | null;
  deprecated_at: string | null;
  retired_at: string | null;

  // Source traceability (soft FK into source module's own DB)
  source_module_id: string;
  source_entity_type: string;
  source_entity_id: string;

  // Ownership (deferred FK → identity.users)
  owner_id: string;

  // Org dimensions (nullable FKs)
  primary_country_id: string | null;
  opco_id: string | null;
  function_group_id: string | null;
  industry_sector_id: string | null;
  service_offering_id: string | null;

  // NFR metadata — informational only, never used for access control
  data_classification: string | null;
  hosting_type: string | null;
  audience_type: string | null;
  business_criticality: string | null;
  data_residency: string | null;
  contains_pii: boolean;
  is_client_facing: boolean;
  retention_requirement: string | null;
  sla_description: string | null;
  compliance_tags: string[];
  domain: string | null;
  approved_submission_id: string | null;
  usage_count: number;
  featured: boolean;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// catalog.asset_versions
// ---------------------------------------------------------------------------

export interface AssetVersion {
  id: string;
  asset_id: string;
  version: string;
  is_current: boolean;
  change_summary: string | null;
  released_at: string | null;
  released_by: string | null;
  submission_id: string | null;
}

// ---------------------------------------------------------------------------
// catalog.asset_source_refs
// ---------------------------------------------------------------------------

export type SourceRefType =
  | 'forge_asset_id'
  | 'github_repo'
  | 'dbt_model'
  | 'confluence_page'
  | 'jira_project'
  | 'other';

export interface AssetSourceRef {
  id: string;
  asset_id: string;
  ref_type: SourceRefType;
  ref_value: string;
  label: string | null;
  href: string | null;
  is_primary: boolean;
  added_by: string | null;
  added_at: string;
}

// ---------------------------------------------------------------------------
// governance.publication_promotions  (read-only in catalog service)
// ---------------------------------------------------------------------------

export interface PublicationPromotion {
  id: string;
  catalog_asset_id: string;
  from_status: PublicationStatus | null;
  to_status: PublicationStatus;
  promoted_by: string;
  promoted_at: string;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// metadata.taxonomy_terms  (read-only in catalog service)
// ---------------------------------------------------------------------------

export interface TaxonomyTerm {
  id: string;
  scheme_code: string;
  code: string;
  label: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// metadata.tags  (read-only in catalog service)
// ---------------------------------------------------------------------------

export interface Tag {
  id: string;
  label: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// catalog.assets — similarity-ranked view (extends CatalogAsset with score)
// ---------------------------------------------------------------------------

export interface SimilarAsset extends CatalogAsset {
  // Total heuristic signal score. Higher = more signals in common.
  // TODO (Phase 2): replaced by pgvector cosine distance when embeddings exist.
  similarity_score: number;
}

// ---------------------------------------------------------------------------
// catalog.asset_classifications  (join with metadata.taxonomy_terms)
// ---------------------------------------------------------------------------

export interface AssetClassification {
  id: string;
  asset_id: string;
  term_id: string;
  scheme_code: string;
  classified_by: string;
  classified_at: string;
  // Denormalized from JOIN metadata.taxonomy_terms
  term_label: string;
  term_code: string;
}

// ---------------------------------------------------------------------------
// catalog.asset_tags  (join with metadata.tags)
// ---------------------------------------------------------------------------

export interface AssetTag {
  asset_id: string;
  tag_id: string;
  tagged_by: string;
  tagged_at: string;
  // Denormalized from JOIN metadata.tags
  tag_label: string;
}

// ---------------------------------------------------------------------------
// governance.asset_submissions  (read-only — for published-asset lookup)
// ---------------------------------------------------------------------------

export interface AssetSubmissionSummary {
  id: string;
  governance_status: GovernanceStatus;
  source_entity_id: string;
  source_entity_type: string;
  source_module_id: string;
  resolved_at: string | null;
}
