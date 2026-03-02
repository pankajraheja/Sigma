// ---------------------------------------------------------------------------
// metadataRules.ts
//
// Rules governing asset metadata requirements across the gateway platform.
// Every asset registered in the catalog must conform to these rules.
// Used by the Metadata Schema panel, validation logic, and future form builders.
// ---------------------------------------------------------------------------

/** Fields that every registered asset must provide (enforced at ingestion). */
export const REQUIRED_METADATA_FIELDS = [
  'name',
  'owner',
  'domain',
] as const

export type RequiredMetadataField = (typeof REQUIRED_METADATA_FIELDS)[number]

/** Fields that are optional but strongly recommended. */
export const RECOMMENDED_METADATA_FIELDS = [
  'description',
  'status',
  'tags',
] as const

/** Maximum number of tags an asset may carry (enforced by the Tags standard). */
export const MAX_TAGS_PER_ASSET = 20

/** Maximum tag label length in characters. */
export const MAX_TAG_LENGTH = 64

/** Tag format rule: lowercase, hyphens only, no spaces. */
export const TAG_FORMAT_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Allowed asset status values (maps to ModuleStatus for platform modules). */
export const ASSET_STATUSES = ['active', 'deprecated', 'draft', 'archived'] as const

export type AssetStatus = (typeof ASSET_STATUSES)[number]
