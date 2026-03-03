# Schema: `catalog`

> **Owner:** Catalog module
> **Purpose:** The published, searchable registry of approved assets. Catalog stores the promoted representation of assets that have completed governance review. It is not an authoring surface — all creation happens in source modules (FORGE, Intake, Prototype Builder, Application Builder).

---

## Design Notes

### Catalog is a Published Representation
Rows in `catalog.assets` are created by the governance promotion process, not by direct user input. Each asset traces back to its source module record via `source_module_id`, `source_entity_type`, and `source_entity_id`.

### Publication Status (4 values)
Publication status is independent of governance status:

| Status | Meaning |
|--------|---------|
| `preview` | Visible to permissioned users; initial state after first promotion |
| `ga` | Generally available; fully promoted and broadly discoverable |
| `deprecated` | Still accessible; marked for retirement; new use discouraged |
| `retired` | No longer active; archived; not shown in default search |

### NFR Denormalisation
NFR fields are denormalised from `governance.asset_submissions` onto `catalog.assets` at promotion time. This avoids joining across schemas on every catalog query. The `approved_submission_id` FK preserves the link to the governance record.

### Org Dimensions as First-Class FKs
All five org dimensions are FK columns on `catalog.assets` — not JSON, not JSONB, not free-text strings. This enables filtered queries like "all approved datasets in APAC Banking" to use index scans on FK columns.

### Asset Versions
Every significant publish or update creates a version row in `asset_versions`. The current version is tracked with `is_current = true`. Only one row per asset can be current at a time (enforced at application layer; use a partial unique index in production).

### Circular Dependency Note (`certifications`)
`governance.certifications` references `catalog.assets.id`. `catalog.assets` does **not** carry a FK back to `governance.certifications` — the latest certification is resolved by query (see [governance.md](governance.md)). This avoids a circular FK dependency between schemas.

---

## Tables

### `catalog.assets`

The primary catalog record for a published asset.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `name` | VARCHAR(300) | NOT NULL | Display name of the asset |
| `short_summary` | VARCHAR(500) | NOT NULL | One-paragraph summary for cards and search results |
| `description` | TEXT | | Full rich-text description (Markdown supported) |
| `asset_kind_term_id` | UUID | NOT NULL, FK → `metadata.taxonomy_terms.id` | Asset kind (from scheme `asset_kind`), e.g. Dataset, API, Model |
| `domain_term_id` | UUID | FK → `metadata.taxonomy_terms.id` | Business domain (from scheme `domain`) |
| `publication_status` | ENUM | NOT NULL, DEFAULT `preview` | `preview` \| `ga` \| `deprecated` \| `retired` |
| | | | **— Governance link —** |
| `approved_submission_id` | UUID | FK → `governance.asset_submissions.id` | The submission that produced this catalog entry |
| | | | **— Ownership —** |
| `owner_id` | UUID | NOT NULL, FK → `identity.users.id` | Accountable data/asset owner |
| | | | **— Org dimensions —** |
| `primary_country_id` | UUID | FK → `org.countries.id` | Country scope |
| `opco_id` | UUID | FK → `org.opcos.id` | OpCo scope |
| `function_group_id` | UUID | FK → `org.function_groups.id` | Function group scope |
| `industry_sector_id` | UUID | FK → `org.industry_sectors.id` | Industry sector scope |
| `service_offering_id` | UUID | FK → `org.service_offerings.id` | Service offering scope |
| | | | **— Source traceability —** |
| `source_module_id` | UUID | NOT NULL, FK → `platform.modules.id` | Module that authored this asset |
| `source_entity_type` | VARCHAR(100) | NOT NULL | Entity type in the source module, e.g. `dataset`, `api`, `model` |
| `source_entity_id` | UUID | NOT NULL | UUID of the entity in the source module's DB |
| | | | **— NFR fields (denormalised from approved submission) —** |
| `data_classification_term_id` | UUID | FK → `metadata.taxonomy_terms.id` | From scheme `data_classification` |
| `hosting_type_term_id` | UUID | FK → `metadata.taxonomy_terms.id` | From scheme `hosting_type` |
| `contains_pii` | BOOLEAN | NOT NULL, DEFAULT `false` | Contains personally identifiable information |
| `is_client_facing` | BOOLEAN | NOT NULL, DEFAULT `false` | Exposed to external clients |
| `sla_description` | TEXT | | SLA statement, e.g. `99.9% uptime, < 200ms p95` |
| `retention_policy` | TEXT | | Retention period or policy |
| `compliance_tag_ids` | UUID[] | | Array of `metadata.taxonomy_terms.id` from scheme `compliance_tag` |
| | | | **— Discovery signals —** |
| `usage_count` | INT | NOT NULL, DEFAULT 0 | Number of registered consumers / API calls (informational) |
| `featured` | BOOLEAN | NOT NULL, DEFAULT `false` | Pinned in featured sections on catalog home |
| | | | **— Timestamps —** |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When catalog record was first created |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last metadata update |
| `published_at` | TIMESTAMPTZ | | When first promoted to `preview` or `ga` |
| `deprecated_at` | TIMESTAMPTZ | | When status changed to `deprecated` |
| `retired_at` | TIMESTAMPTZ | | When status changed to `retired` |

**Unique constraint:** `(source_module_id, source_entity_type, source_entity_id)` — one catalog record per source entity.

**Indexes:** `publication_status`, `asset_kind_term_id`, `domain_term_id`, `owner_id`, `primary_country_id`, `opco_id`, `function_group_id`, `industry_sector_id`, `featured`, `updated_at`, `usage_count`

---

### `catalog.asset_versions`

Version history for a catalog asset. Each significant governance approval or metadata update that changes the asset's content creates a new version row.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `asset_id` | UUID | NOT NULL, FK → `catalog.assets.id` | |
| `version` | VARCHAR(50) | NOT NULL | Semantic or sequential version string, e.g. `1.0.0`, `2.1.3`, `v3` |
| `released_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `released_by` | UUID | NOT NULL, FK → `identity.users.id` | |
| `change_summary` | TEXT | | Human-readable description of what changed in this version |
| `is_current` | BOOLEAN | NOT NULL, DEFAULT `false` | True for the currently active version; managed by application layer |
| `submission_id` | UUID | FK → `governance.asset_submissions.id` | The submission that produced this version (if applicable) |

**Unique constraint:** `(asset_id, version)`

**Partial unique index (recommended):** `(asset_id) WHERE is_current = true` — enforces at most one current version per asset at DB level.

**Indexes:** `asset_id`, `released_at`

---

### `catalog.asset_classifications`

Multi-value taxonomy term associations for an asset. Supports attaching multiple controlled vocabulary terms from any concept scheme beyond the core NFR fields that are denormalised directly on `catalog.assets`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `asset_id` | UUID | NOT NULL, FK → `catalog.assets.id` | |
| `term_id` | UUID | NOT NULL, FK → `metadata.taxonomy_terms.id` | |
| `classified_by` | UUID | NOT NULL, FK → `identity.users.id` | |
| `classified_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique constraint:** `(asset_id, term_id)`

**Indexes:** `asset_id`, `term_id`

**Use cases:**
- Attaching multiple compliance tags (beyond the array on `catalog.assets`)
- Additional domain sub-classifications
- Regulatory jurisdiction terms
- Custom taxonomy terms added by module administrators

---

### `catalog.asset_tags`

Junction table linking assets to informal user-contributed tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `asset_id` | UUID | NOT NULL, FK → `catalog.assets.id` | |
| `tag_id` | UUID | NOT NULL, FK → `metadata.tags.id` | |
| `tagged_by` | UUID | NOT NULL, FK → `identity.users.id` | Who added this tag to this asset |
| `tagged_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Primary key:** `(asset_id, tag_id)`

**Indexes:** `asset_id`, `tag_id`

---

### `catalog.asset_source_refs`

Source traceability references beyond the primary `source_entity_id`. Records the specific artefacts, repositories, or systems that the asset was built from or represents.

This table is distinct from `platform.linked_resources`:
- `asset_source_refs` = **where the asset was authored** (traceability)
- `platform.linked_resources` = **informational external links** (documentation, runbooks)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `asset_id` | UUID | NOT NULL, FK → `catalog.assets.id` | |
| `ref_type` | VARCHAR(100) | NOT NULL | Type of source reference, e.g. `forge_asset_id`, `github_repo`, `confluence_page`, `dbt_model`, `jira_epic` |
| `ref_value` | TEXT | NOT NULL | The reference value, e.g. a UUID, a repo path, a Confluence URL |
| `label` | VARCHAR(300) | | Human-readable label for this reference |
| `href` | TEXT | | Resolved URL (if applicable) |
| `is_primary` | BOOLEAN | NOT NULL, DEFAULT `false` | True for the canonical primary source reference |
| `added_by` | UUID | NOT NULL, FK → `identity.users.id` | |
| `added_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `asset_id`, `ref_type`

**Note:** The `(source_module_id, source_entity_type, source_entity_id)` unique constraint on `catalog.assets` already records the canonical source. `asset_source_refs` captures additional secondary or supplementary source references (e.g. a model published to Catalog that also has a DBT model path and a Confluence data dictionary page).

---

## Key Relationships

```
catalog.assets >── metadata.taxonomy_terms (asset_kind_term_id, domain_term_id, data_classification_term_id, hosting_type_term_id)
catalog.assets >── identity.users (owner_id)
catalog.assets >── org.countries (primary_country_id)
catalog.assets >── org.opcos (opco_id)
catalog.assets >── org.function_groups (function_group_id)
catalog.assets >── org.industry_sectors (industry_sector_id)
catalog.assets >── org.service_offerings (service_offering_id)
catalog.assets >── platform.modules (source_module_id)
catalog.assets >── governance.asset_submissions (approved_submission_id)

catalog.assets ──< asset_versions
catalog.assets ──< asset_classifications >── metadata.taxonomy_terms
catalog.assets ──< asset_tags >── metadata.tags
catalog.assets ──< asset_source_refs

governance.certifications >── catalog.assets  (certification → asset; not reversed)
governance.publication_promotions >── catalog.assets
```

---

## Example Asset Lifecycle

```
1. Contributor in FORGE creates a "Customer 360 Dataset" (source entity).
   FORGE internal status: draft → submitted

2. Contributor submits to governance.
   governance.asset_submissions created:
     source_module_id  = forge module UUID
     source_entity_type = 'dataset'
     source_entity_id  = FORGE dataset UUID
     governance_status = 'pending'
     nfrs: data_classification=Confidential, contains_pii=true, ...

3. Governance runs 5 stage pipeline.
   submission_stage_runs × 5 created.
   submission_reviews recorded at each stage.
   governance_status → 'in_review' → 'approved'

4. Governance promotes to Catalog.
   catalog.assets created:
     publication_status = 'preview'
     source traceability fields copied from submission
     NFR fields denormalised from approved submission
   governance.publication_promotions row created.
   catalog.asset_versions v1.0.0 created (is_current = true).

5. Governance promotes to GA.
   catalog.assets.publication_status → 'ga'
   publication_promotions row created (preview → ga).

6. Governance certifier issues certification.
   governance.certifications row created.
   Asset is now: GA + certified.

7. New version submitted from FORGE, governance approves.
   catalog.asset_versions v2.0.0 created (is_current = true).
   v1.0.0 is_current → false.

8. Asset deprecated.
   catalog.assets.publication_status → 'deprecated'.
   publication_promotions row created (ga → deprecated).
```

---

## What is Shared vs Module-Owned

| Concern | Owner |
|---------|-------|
| Published asset records | `catalog` — module-owned |
| Version history | `catalog` — module-owned |
| Classification associations | `catalog` — module-owned |
| Tag associations | `catalog` — module-owned (tags themselves in `metadata`) |
| Source references | `catalog` — module-owned |
| NFR field values | Captured in `governance`; denormalised to `catalog` at promotion |
| Org dimension FKs | `org` tables — shared reference data |
| Taxonomy term FKs | `metadata` tables — shared reference data |
| Certification records | `governance` — shared |
| Promotion events | `governance` — shared |
| Authoring / drafting | Source modules — NOT in catalog schema |
