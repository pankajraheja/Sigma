# DDL Spec: `catalog` Schema

> **Status:** DDL-ready design — not yet a runnable migration script.
> **DB target:** PostgreSQL 15+
> **Owner:** Catalog module

---

## Design Principles

- Catalog stores the **published, searchable representation** of approved assets only. It is not an authoring surface.
- Every `catalog.asset` row is created by the governance promotion process, tracing back to a source module entity via `(source_module_id, source_entity_type, source_entity_id)`.
- NFR fields on `catalog.assets` are **denormalised copies** from `governance.asset_submissions`, set at promotion time. The FK `approved_submission_id` preserves the authoritative source.
- Publication status (`preview` → `ga` → `deprecated` → `retired`) is governed exclusively by `governance.publication_promotions`; it is never written directly by catalog users.
- Org dimensions are first-class FK columns — not JSONB, not arrays, not free text.

---

## Tables

### `catalog.assets`

**Purpose:** Primary catalog record for a published asset. Created when governance promotes an approved submission. All NFR fields are denormalised from the approved submission for efficient catalog queries without cross-schema joins.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `name` | `VARCHAR(300)` | NO | — | — | Display name of the asset |
| `short_summary` | `VARCHAR(500)` | NO | — | — | One-paragraph summary for cards and search results |
| `description` | `TEXT` | YES | NULL | — | Full description; Markdown supported |
| | | | | | **─── Classification ───** |
| `asset_kind` | `VARCHAR(30)` | NO | — | CHECK (see values) | `dataset` \| `api` \| `report` \| `model` \| `dashboard` \| `pipeline` \| `template` \| `skill` \| `connector` |
| `domain` | `VARCHAR(100)` | YES | NULL | — | Business domain label, e.g. `risk_compliance`, `ai_data_services`. References `metadata.taxonomy_terms.code` (scheme `domain`) but stored as denormalised string for search performance |
| `publication_status` | `VARCHAR(20)` | NO | `'preview'` | CHECK (see values) | `preview` \| `ga` \| `deprecated` \| `retired` |
| | | | | | **─── Governance Link ───** |
| `approved_submission_id` | `UUID` | YES | NULL | FK → `governance.asset_submissions(id)` ON DELETE SET NULL | Submission that produced this catalog entry; NULL only for manually seeded records |
| | | | | | **─── Ownership ───** |
| `owner_id` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | Accountable data/asset owner |
| | | | | | **─── Org Dimensions ───** |
| `primary_country_id` | `UUID` | YES | NULL | FK → `org.countries(id)` ON DELETE SET NULL | Country scope |
| `opco_id` | `UUID` | YES | NULL | FK → `org.opcos(id)` ON DELETE SET NULL | OpCo scope |
| `function_group_id` | `UUID` | YES | NULL | FK → `org.function_groups(id)` ON DELETE SET NULL | Function group scope |
| `industry_sector_id` | `UUID` | YES | NULL | FK → `org.industry_sectors(id)` ON DELETE SET NULL | Industry sector scope |
| `service_offering_id` | `UUID` | YES | NULL | FK → `org.service_offerings(id)` ON DELETE SET NULL | Service offering scope |
| | | | | | **─── Source Traceability ───** |
| `source_module_id` | `UUID` | NO | — | FK → `platform.modules(id)` ON DELETE RESTRICT | Module that authored this asset |
| `source_entity_type` | `VARCHAR(100)` | NO | — | — | Source entity type, e.g. `dataset`, `api`, `model` |
| `source_entity_id` | `UUID` | NO | — | — | UUID of the record in the source module's own DB (soft reference; no cross-DB FK) |
| | | | | | **─── NFR Fields (denormalised from approved submission) ───** |
| `data_classification` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `public` \| `internal` \| `confidential` \| `restricted` |
| `hosting_type` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `cloud` \| `on_premise` \| `hybrid` \| `saas` |
| `audience_type` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `internal` \| `external` \| `partner` \| `cross_entity` |
| `business_criticality` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `low` \| `medium` \| `high` \| `critical` |
| `data_residency` | `VARCHAR(10)` | YES | NULL | — | ISO-3166-1 alpha-2 country code or `'global'` |
| `contains_pii` | `BOOLEAN` | NO | `false` | — | Asset contains personally identifiable information |
| `is_client_facing` | `BOOLEAN` | NO | `false` | — | Exposed to external clients |
| `retention_requirement` | `VARCHAR(300)` | YES | NULL | — | e.g. `7 years (SOX)`, `3 years (GDPR Art.17)` |
| `sla_description` | `TEXT` | YES | NULL | — | e.g. `99.9% uptime, p95 < 200ms` |
| `compliance_tags` | `TEXT[]` | YES | NULL | — | Array of compliance tag codes, e.g. `{'gdpr','sox','pci_dss'}` |
| | | | | | **─── Discovery Signals ───** |
| `usage_count` | `INT` | NO | `0` | CHECK (`usage_count` >= 0) | Registered consumer / API call count (informational; updated by event) |
| `featured` | `BOOLEAN` | NO | `false` | — | Pinned in featured sections on catalog home |
| | | | | | **─── Timestamps ───** |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | When catalog record was first created |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | Last metadata update |
| `published_at` | `TIMESTAMPTZ` | YES | NULL | — | When first promoted to `preview` or `ga` |
| `deprecated_at` | `TIMESTAMPTZ` | YES | NULL | — | When status changed to `deprecated` |
| `retired_at` | `TIMESTAMPTZ` | YES | NULL | — | When status changed to `retired` |

**Primary Key:** `id`

**Foreign Keys:**
- `approved_submission_id` → `governance.asset_submissions(id)` ON DELETE SET NULL
- `owner_id` → `identity.users(id)` ON DELETE RESTRICT
- `primary_country_id` → `org.countries(id)` ON DELETE SET NULL
- `opco_id` → `org.opcos(id)` ON DELETE SET NULL
- `function_group_id` → `org.function_groups(id)` ON DELETE SET NULL
- `industry_sector_id` → `org.industry_sectors(id)` ON DELETE SET NULL
- `service_offering_id` → `org.service_offerings(id)` ON DELETE SET NULL
- `source_module_id` → `platform.modules(id)` ON DELETE RESTRICT

**Unique Constraints:**
- `(source_module_id, source_entity_type, source_entity_id)` — one catalog record per source entity

**Check Constraints:**
- `asset_kind IN ('dataset', 'api', 'report', 'model', 'dashboard', 'pipeline', 'template', 'skill', 'connector')`
- `publication_status IN ('preview', 'ga', 'deprecated', 'retired')`
- `data_classification IN ('public', 'internal', 'confidential', 'restricted')`
- `hosting_type IN ('cloud', 'on_premise', 'hybrid', 'saas')`
- `audience_type IN ('internal', 'external', 'partner', 'cross_entity')`
- `business_criticality IN ('low', 'medium', 'high', 'critical')`
- `usage_count >= 0`
- `(deprecated_at IS NULL) OR (publication_status IN ('deprecated', 'retired'))` — timestamp requires matching status
- `(retired_at IS NULL) OR (publication_status = 'retired')`

**Recommended Indexes:**
- `(publication_status)` — filter active / available assets
- `(asset_kind)` — kind-based browsing
- `(owner_id)` — my assets view
- `(opco_id)`, `(primary_country_id)`, `(function_group_id)`, `(industry_sector_id)` — org-scoped discovery
- `(contains_pii)`, `(data_classification)` — governance / compliance filtering
- `(featured)` — featured section queries
- `(updated_at DESC)` — recency ordering
- `(usage_count DESC)` — popularity ordering
- GIN index on `compliance_tags` — for array containment queries: `compliance_tags @> ARRAY['gdpr']`
- Full-text index on `(name, short_summary, description)` — semantic search (use `tsvector` generated column or separate FTS table)

**Notes:** `domain` is stored as a VARCHAR code (not a FK to `metadata.taxonomy_terms`) to allow high-performance catalog queries without a join. The code should match a term in scheme `domain`. `compliance_tags` is a TEXT array rather than a junction table; add a GIN index for `@>` containment queries.

---

### `catalog.asset_versions`

**Purpose:** Version history for a catalog asset. Each significant governance approval or content change creates a new version row. The active version is tracked by `is_current = true`.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `asset_id` | `UUID` | NO | — | FK → `catalog.assets(id)` ON DELETE CASCADE | |
| `version` | `VARCHAR(50)` | NO | — | — | Semantic or sequential version string, e.g. `1.0.0`, `2.1.3`, `v3` |
| `released_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `released_by` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | |
| `change_summary` | `TEXT` | YES | NULL | — | Human-readable description of what changed |
| `is_current` | `BOOLEAN` | NO | `false` | — | True for the active version. Managed by application layer; use partial unique index |
| `submission_id` | `UUID` | YES | NULL | FK → `governance.asset_submissions(id)` ON DELETE SET NULL | Submission that produced this version (if applicable) |

**Primary Key:** `id`

**Foreign Keys:**
- `asset_id` → `catalog.assets(id)` ON DELETE CASCADE
- `released_by` → `identity.users(id)` ON DELETE RESTRICT
- `submission_id` → `governance.asset_submissions(id)` ON DELETE SET NULL

**Unique Constraints:**
- `(asset_id, version)` — one record per version string per asset

**Recommended Indexes:**
- `(asset_id, released_at DESC)` — version history for an asset
- Partial unique index: `(asset_id) WHERE is_current = true` — enforces at most one current version per asset at DB level

**Notes:** When a new version is made current, the application must atomically set `is_current = false` on the previous current version and `is_current = true` on the new one. Use a transaction with `SELECT FOR UPDATE` or a DB trigger.

---

### `catalog.asset_classifications`

**Purpose:** Multi-value taxonomy term associations for a catalog asset. Used for controlled-vocabulary tags beyond the core fields denormalised onto `catalog.assets`. Allows assets to carry multiple terms from any concept scheme (e.g. multiple compliance tags, regulatory jurisdiction terms).

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `asset_id` | `UUID` | NO | — | FK → `catalog.assets(id)` ON DELETE CASCADE | |
| `term_id` | `UUID` | NO | — | FK → `metadata.taxonomy_terms(id)` ON DELETE RESTRICT | The classification term |
| `classified_by` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | Who added this classification |
| `classified_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `asset_id` → `catalog.assets(id)` ON DELETE CASCADE
- `term_id` → `metadata.taxonomy_terms(id)` ON DELETE RESTRICT
- `classified_by` → `identity.users(id)` ON DELETE RESTRICT

**Unique Constraints:**
- `(asset_id, term_id)` — one classification per term per asset

**Recommended Indexes:**
- `(asset_id)` — all classifications for an asset
- `(term_id)` — all assets classified under a term (reverse lookup)

---

### `catalog.asset_tags`

**Purpose:** Junction table linking catalog assets to informal, user-contributed tags. Tags are lightweight and free-form (not controlled vocabulary). The `metadata.tags` table holds the canonical tag record; this table holds the asset-to-tag association.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `asset_id` | `UUID` | NO | — | PK (composite), FK → `catalog.assets(id)` ON DELETE CASCADE | |
| `tag_id` | `UUID` | NO | — | PK (composite), FK → `metadata.tags(id)` ON DELETE CASCADE | |
| `tagged_by` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | Who applied this tag |
| `tagged_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `(asset_id, tag_id)`

**Foreign Keys:**
- `asset_id` → `catalog.assets(id)` ON DELETE CASCADE
- `tag_id` → `metadata.tags(id)` ON DELETE CASCADE
- `tagged_by` → `identity.users(id)` ON DELETE RESTRICT

**Recommended Indexes:**
- `(tag_id)` — all assets with a given tag (reverse lookup for tag browsing)

---

### `catalog.asset_source_refs`

**Purpose:** Source traceability references for a catalog asset, beyond the primary `(source_module_id, source_entity_type, source_entity_id)` on `catalog.assets`. Records secondary or supplementary source pointers such as Git repositories, DBT models, Confluence data dictionaries, or JIRA epics that the asset was built from.

This is distinct from `platform.linked_resources`:
- `asset_source_refs` — **where the asset was authored** (traceability; creation-time references)
- `platform.linked_resources` — **informational external links** attached to the published record (documentation, runbooks)

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `asset_id` | `UUID` | NO | — | FK → `catalog.assets(id)` ON DELETE CASCADE | |
| `ref_type` | `VARCHAR(100)` | NO | — | — | Type of reference, e.g. `forge_asset_id`, `github_repo`, `dbt_model`, `confluence_page`, `jira_epic`, `snowflake_table` |
| `ref_value` | `TEXT` | NO | — | — | The reference value: a UUID, a path, a URL, an identifier |
| `label` | `VARCHAR(300)` | YES | NULL | — | Human-readable label for this reference |
| `href` | `TEXT` | YES | NULL | — | Resolved URL if applicable |
| `is_primary` | `BOOLEAN` | NO | `false` | — | True for the canonical primary source reference for this asset |
| `added_by` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | |
| `added_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `asset_id` → `catalog.assets(id)` ON DELETE CASCADE
- `added_by` → `identity.users(id)` ON DELETE RESTRICT

**Unique Constraints:** None — multiple refs of the same type are allowed.

**Recommended Indexes:**
- `(asset_id)` — all refs for an asset
- `(ref_type, ref_value)` — reverse lookup: find catalog assets linked to a specific source ref
- Partial unique index: `(asset_id) WHERE is_primary = true` — enforce at most one primary ref per asset

**Notes:** `is_primary` should be managed atomically: set the new primary to true, then set the previous primary to false in a transaction. `ref_type` is intentionally free-form (no CHECK constraint) to allow new source systems to be registered without schema changes.
