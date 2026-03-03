# DDL Spec: `governance` Schema

> **Status:** DDL-ready design — not yet a runnable migration script.
> **DB target:** PostgreSQL 15+
> **Owner:** Shared / Governance team

---

## Tables

### `governance.stage_configs`

**Purpose:** Defines the ordered stages of the global governance review pipeline. Each stage is a checkpoint that a submission must pass before reaching approval. This is configuration/reference data managed by platform administrators.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | Surrogate key |
| `code` | `VARCHAR(100)` | NO | — | UNIQUE | Machine key, e.g. `nfr_review`, `security_review`, `final_approval` |
| `name` | `VARCHAR(200)` | NO | — | — | Display label, e.g. `NFR Review` |
| `description` | `TEXT` | YES | NULL | — | What reviewers check at this stage |
| `sequence_order` | `SMALLINT` | NO | — | CHECK (`sequence_order` > 0) | Lower = earlier; parallel stages may share order value |
| `is_required` | `BOOLEAN` | NO | `true` | — | If false, stage may be skipped unless a routing rule overrides |
| `required_role_id` | `UUID` | YES | NULL | FK → `identity.roles(id)` ON DELETE SET NULL | Role required to review this stage (NULL = any reviewer) |
| `sla_hours` | `SMALLINT` | YES | NULL | CHECK (`sla_hours` > 0) | Target hours to complete stage (informational SLA) |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `required_role_id` → `identity.roles(id)` ON DELETE SET NULL

**Unique Constraints:**
- `code`

**Check Constraints:**
- `sequence_order > 0`
- `sla_hours > 0` (when not NULL)

**Recommended Indexes:**
- `(sequence_order)` — for ordered pipeline queries
- `(code)` — covered by unique constraint

**Notes:** Parallel stages (same `sequence_order`) are resolved by the application layer. Routing overrides are defined in `stage_routing_rules`.

**Seed values:**

| code | name | sequence_order | is_required |
|------|------|---------------|-------------|
| `nfr_review` | NFR Review | 10 | true |
| `technical_review` | Technical Review | 20 | true |
| `security_review` | Security Review | 30 | true |
| `data_governance_review` | Data Governance Review | 40 | true |
| `final_approval` | Final Approval | 50 | true |

---

### `governance.stage_routing_rules`

**Purpose:** Overrides stage behaviour for specific organisational or module scopes. Allows stages to be mandatory for one OpCo but optional for another, or to carry different SLA targets per region. The base `stage_configs` row defines global defaults; routing rules are additive exceptions.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `stage_config_id` | `UUID` | NO | — | FK → `governance.stage_configs(id)` ON DELETE CASCADE | |
| `scope_type` | `VARCHAR(50)` | NO | — | CHECK (see values) | Dimension being scoped: `module` \| `country` \| `opco` \| `function_group` \| `service_offering` \| `industry_sector` |
| `scope_ref_id` | `UUID` | NO | — | — | UUID of the scoping entity (no DB-level FK; polymorphic reference) |
| `override_is_required` | `BOOLEAN` | YES | NULL | — | NULL = inherit from stage_config; true/false = override |
| `override_required_role_id` | `UUID` | YES | NULL | FK → `identity.roles(id)` ON DELETE SET NULL | Override reviewer role for this scope |
| `override_sla_hours` | `SMALLINT` | YES | NULL | CHECK (`override_sla_hours` > 0) | Override SLA for this scope |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `stage_config_id` → `governance.stage_configs(id)` ON DELETE CASCADE
- `override_required_role_id` → `identity.roles(id)` ON DELETE SET NULL

**Unique Constraints:**
- `(stage_config_id, scope_type, scope_ref_id)` — one override rule per stage per scope entity

**Check Constraints:**
- `scope_type IN ('module', 'country', 'opco', 'function_group', 'service_offering', 'industry_sector')`
- `override_sla_hours > 0` (when not NULL)

**Recommended Indexes:**
- `(stage_config_id)` — for stage pipeline assembly
- `(scope_type, scope_ref_id)` — for scope-based lookups

**Notes:** Resolution order — routing rules take precedence over `stage_configs` defaults. When multiple routing rules match a submission (e.g., one for country + one for opco), the most-specific rule wins. Specificity order is an application-layer decision; recommended: `module > opco > function_group > industry_sector > country > service_offering`. `scope_ref_id` is a soft polymorphic reference enforced by the application.

---

### `governance.asset_submissions`

**Purpose:** Central record for each governance submission. Created when a source-module contributor submits an asset for review. Owns the governance lifecycle, the NFR declarations, and the org-scope context of the submitted asset. This is distinct from the source module's internal asset status.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `source_module_id` | `UUID` | NO | — | FK → `platform.modules(id)` ON DELETE RESTRICT | Source module that owns the asset |
| `source_entity_type` | `VARCHAR(100)` | NO | — | — | Entity type in source module, e.g. `dataset`, `api`, `model`, `report` |
| `source_entity_id` | `UUID` | NO | — | — | UUID of the entity in the source module's own DB (soft reference; no cross-DB FK) |
| `submitted_by` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | Who submitted |
| `submitted_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `governance_status` | `VARCHAR(20)` | NO | `'pending'` | CHECK (see values) | `pending` \| `in_review` \| `approved` \| `rejected` \| `withdrawn` |
| `current_stage_id` | `UUID` | YES | NULL | FK → `governance.stage_configs(id)` ON DELETE SET NULL | Active stage (NULL if not yet started or resolved) |
| `resolved_at` | `TIMESTAMPTZ` | YES | NULL | — | When final governance decision was recorded |
| `resolver_id` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | Who made the final governance decision |
| `submission_notes` | `TEXT` | YES | NULL | — | Cover note from submitter |
| `resolver_notes` | `TEXT` | YES | NULL | — | Notes from final resolver |
| | | | | | **─── NFR Fields ───** |
| `data_classification` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `public` \| `internal` \| `confidential` \| `restricted` |
| `hosting_type` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `cloud` \| `on_premise` \| `hybrid` \| `saas` |
| `audience_type` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `internal` \| `external` \| `partner` \| `cross_entity` |
| `business_criticality` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | `low` \| `medium` \| `high` \| `critical` |
| `data_residency` | `VARCHAR(10)` | YES | NULL | — | ISO-3166-1 alpha-2 country code or `'global'`; where data must be stored/processed |
| `contains_pii` | `BOOLEAN` | NO | `false` | — | Asset contains personally identifiable information |
| `is_client_facing` | `BOOLEAN` | NO | `false` | — | Asset is exposed to external clients |
| `retention_requirement` | `VARCHAR(300)` | YES | NULL | — | Free-text retention period, e.g. `7 years (SOX)`, `3 years (GDPR Art.17)` |
| `sla_description` | `TEXT` | YES | NULL | — | SLA commitment, e.g. `99.9% uptime, p95 < 200ms` |
| `compliance_tags` | `TEXT[]` | YES | NULL | — | Array of compliance tag codes, e.g. `{'gdpr','pci_dss','sox'}` |
| | | | | | **─── Org Scope ───** |
| `primary_country_id` | `UUID` | YES | NULL | FK → `org.countries(id)` ON DELETE SET NULL | Country scope of this submission |
| `opco_id` | `UUID` | YES | NULL | FK → `org.opcos(id)` ON DELETE SET NULL | OpCo scope |
| `function_group_id` | `UUID` | YES | NULL | FK → `org.function_groups(id)` ON DELETE SET NULL | Function group scope |
| `industry_sector_id` | `UUID` | YES | NULL | FK → `org.industry_sectors(id)` ON DELETE SET NULL | Industry sector scope |
| `service_offering_id` | `UUID` | YES | NULL | FK → `org.service_offerings(id)` ON DELETE SET NULL | Service offering scope |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `source_module_id` → `platform.modules(id)` ON DELETE RESTRICT
- `submitted_by` → `identity.users(id)` ON DELETE RESTRICT
- `current_stage_id` → `governance.stage_configs(id)` ON DELETE SET NULL
- `resolver_id` → `identity.users(id)` ON DELETE SET NULL
- `primary_country_id` → `org.countries(id)` ON DELETE SET NULL
- `opco_id` → `org.opcos(id)` ON DELETE SET NULL
- `function_group_id` → `org.function_groups(id)` ON DELETE SET NULL
- `industry_sector_id` → `org.industry_sectors(id)` ON DELETE SET NULL
- `service_offering_id` → `org.service_offerings(id)` ON DELETE SET NULL

**Unique Constraints:** None — a source entity may be resubmitted after rejection or withdrawal. Multiple historical submissions for the same `(source_module_id, source_entity_type, source_entity_id)` are permitted; only one should be in a non-terminal status at any time (enforced at application layer or via partial unique index: UNIQUE `(source_module_id, source_entity_type, source_entity_id) WHERE governance_status NOT IN ('approved','rejected','withdrawn')`).

**Check Constraints:**
- `governance_status IN ('pending', 'in_review', 'approved', 'rejected', 'withdrawn')`
- `data_classification IN ('public', 'internal', 'confidential', 'restricted')`
- `hosting_type IN ('cloud', 'on_premise', 'hybrid', 'saas')`
- `audience_type IN ('internal', 'external', 'partner', 'cross_entity')`
- `business_criticality IN ('low', 'medium', 'high', 'critical')`
- `(resolved_at IS NULL) OR (governance_status IN ('approved', 'rejected', 'withdrawn'))` — resolved_at must accompany a terminal status

**Recommended Indexes:**
- `(governance_status)` — filter active/pending submissions
- `(source_module_id, source_entity_type, source_entity_id)` — source traceability lookups
- `(submitted_by)` — user-scoped submission lists
- `(opco_id)`, `(primary_country_id)`, `(function_group_id)` — org-scoped dashboards
- `(submitted_at DESC)` — recency ordering
- Partial index: `(source_module_id, source_entity_type, source_entity_id) WHERE governance_status NOT IN ('approved','rejected','withdrawn')` — enforce one active submission per source entity

**Notes:** NFR fields are governance *inputs* — descriptive declarations made by the submitter and validated by reviewers. They are not access-control rules. When a submission is approved, these NFR values are denormalised onto `catalog.assets` via the promotion process.

---

### `governance.submission_stage_runs`

**Purpose:** Tracks execution of each pipeline stage for a submission. One row per stage per submission. Created when the governance pipeline is initialised for a new submission.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `submission_id` | `UUID` | NO | — | FK → `governance.asset_submissions(id)` ON DELETE CASCADE | |
| `stage_id` | `UUID` | NO | — | FK → `governance.stage_configs(id)` ON DELETE RESTRICT | |
| `status` | `VARCHAR(20)` | NO | `'pending'` | CHECK (see values) | `pending` \| `in_progress` \| `passed` \| `failed` \| `skipped` |
| `started_at` | `TIMESTAMPTZ` | YES | NULL | — | When stage became `in_progress` |
| `completed_at` | `TIMESTAMPTZ` | YES | NULL | — | When stage reached a terminal status |
| `assignee_id` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | Assigned reviewer |
| `stage_notes` | `TEXT` | YES | NULL | — | Reviewer notes for this stage run |

**Primary Key:** `id`

**Foreign Keys:**
- `submission_id` → `governance.asset_submissions(id)` ON DELETE CASCADE
- `stage_id` → `governance.stage_configs(id)` ON DELETE RESTRICT
- `assignee_id` → `identity.users(id)` ON DELETE SET NULL

**Unique Constraints:**
- `(submission_id, stage_id)` — one run per stage per submission

**Check Constraints:**
- `status IN ('pending', 'in_progress', 'passed', 'failed', 'skipped')`
- `(completed_at IS NULL) OR (status IN ('passed', 'failed', 'skipped'))` — completion requires terminal status
- `(started_at IS NULL) OR (started_at <= completed_at OR completed_at IS NULL)`

**Recommended Indexes:**
- `(submission_id)` — all stages for a submission
- `(stage_id, status)` — stage-level dashboard views
- `(assignee_id, status)` — reviewer workqueue

---

### `governance.submission_reviews`

**Purpose:** Individual review decisions recorded within a stage run. A stage run may accumulate multiple review records (e.g. initial `request_changes`, then subsequent `approve`). The stage run's terminal status is determined by application logic over the set of review records.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `submission_id` | `UUID` | NO | — | FK → `governance.asset_submissions(id)` ON DELETE CASCADE | Denormalised for fast submission-level queries |
| `stage_run_id` | `UUID` | NO | — | FK → `governance.submission_stage_runs(id)` ON DELETE CASCADE | |
| `reviewer_id` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | |
| `reviewed_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `decision` | `VARCHAR(20)` | NO | — | CHECK (see values) | `approve` \| `reject` \| `request_changes` \| `defer` |
| `comments` | `TEXT` | YES | NULL | — | Required by application when decision is `reject` or `request_changes` |

**Primary Key:** `id`

**Foreign Keys:**
- `submission_id` → `governance.asset_submissions(id)` ON DELETE CASCADE
- `stage_run_id` → `governance.submission_stage_runs(id)` ON DELETE CASCADE
- `reviewer_id` → `identity.users(id)` ON DELETE RESTRICT

**Unique Constraints:** None — a reviewer may submit multiple reviews on a stage run (e.g. re-review after changes).

**Check Constraints:**
- `decision IN ('approve', 'reject', 'request_changes', 'defer')`

**Recommended Indexes:**
- `(submission_id)` — all reviews for a submission
- `(stage_run_id)` — reviews within a stage
- `(reviewer_id, reviewed_at DESC)` — reviewer activity history

---

### `governance.publication_promotions`

**Purpose:** Records each event that changes a catalog asset's publication status. Governance creates a row here whenever an approved submission results in a new catalog entry or a status change (preview → ga → deprecated → retired).

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `submission_id` | `UUID` | NO | — | FK → `governance.asset_submissions(id)` ON DELETE RESTRICT | Approved submission driving this promotion |
| `catalog_asset_id` | `UUID` | NO | — | FK → `catalog.assets(id)` ON DELETE RESTRICT | Target catalog asset |
| `promoted_by` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | |
| `promoted_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `from_status` | `VARCHAR(20)` | YES | NULL | CHECK (see values) | Previous publication status (NULL if first publication) |
| `to_status` | `VARCHAR(20)` | NO | — | CHECK (see values) | New publication status |
| `notes` | `TEXT` | YES | NULL | — | Reason for promotion/deprecation |

**Primary Key:** `id`

**Foreign Keys:**
- `submission_id` → `governance.asset_submissions(id)` ON DELETE RESTRICT
- `catalog_asset_id` → `catalog.assets(id)` ON DELETE RESTRICT
- `promoted_by` → `identity.users(id)` ON DELETE RESTRICT

**Check Constraints:**
- `from_status IN ('preview', 'ga', 'deprecated', 'retired')` (when not NULL)
- `to_status IN ('preview', 'ga', 'deprecated', 'retired')`
- `from_status IS DISTINCT FROM to_status` — promotion must change status

**Recommended Indexes:**
- `(catalog_asset_id, promoted_at DESC)` — full promotion history for an asset
- `(submission_id)` — which promotions resulted from a submission

---

### `governance.certifications`

**Purpose:** Certification records issued by authorised certifiers against published catalog assets. A certification asserts that an asset meets a named standard at a point in time. This is a governance act; it applies to the published catalogue representation, not the source-module entity.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `catalog_asset_id` | `UUID` | NO | — | FK → `catalog.assets(id)` ON DELETE RESTRICT | Asset being certified |
| `certified_by` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE RESTRICT | Issuing certifier |
| `certified_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `valid_until` | `TIMESTAMPTZ` | YES | NULL | — | Expiry date (NULL = no defined expiry) |
| `standard` | `VARCHAR(200)` | NO | — | — | Standard name, e.g. `ISO 27001`, `SOC 2 Type II`, `Internal Gold Standard` |
| `score` | `SMALLINT` | YES | NULL | CHECK (`score` BETWEEN 0 AND 100) | Optional numeric quality score |
| `notes` | `TEXT` | YES | NULL | — | Conditions, scope, or caveats |
| `is_revoked` | `BOOLEAN` | NO | `false` | — | True if this certification was revoked before `valid_until` |
| `revoked_at` | `TIMESTAMPTZ` | YES | NULL | — | When revoked (NULL if not revoked) |
| `revoked_by` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | |

**Primary Key:** `id`

**Foreign Keys:**
- `catalog_asset_id` → `catalog.assets(id)` ON DELETE RESTRICT
- `certified_by` → `identity.users(id)` ON DELETE RESTRICT
- `revoked_by` → `identity.users(id)` ON DELETE SET NULL

**Check Constraints:**
- `score BETWEEN 0 AND 100` (when not NULL)
- `(is_revoked = false) OR (revoked_at IS NOT NULL)` — revoked must have a date
- `(valid_until IS NULL) OR (valid_until > certified_at)`

**Recommended Indexes:**
- `(catalog_asset_id, certified_at DESC)` — latest certification per asset
- `(catalog_asset_id) WHERE is_revoked = false AND (valid_until IS NULL OR valid_until > now())` — active certifications

**Notes:** `catalog.assets` does not carry a FK back to this table to avoid a circular dependency. The active certification for an asset is resolved at query time. There is no `certification_id` column on `catalog.assets`.

---

### `governance.audit_trail`

**Purpose:** Append-only log of all significant state changes across the platform. Records who did what to which entity and when. Never updated or deleted — insert-only. Serves compliance, debugging, and operational review requirements.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `entity_type` | `VARCHAR(100)` | NO | — | — | Dotted entity path, e.g. `catalog.asset`, `governance.submission`, `identity.user` |
| `entity_id` | `UUID` | NO | — | — | UUID of the affected entity (soft reference; no FK) |
| `action` | `VARCHAR(100)` | NO | — | — | Past-tense verb, e.g. `submitted`, `stage_started`, `approved`, `promoted_to_ga`, `certified`, `deprecated`, `tag_added` |
| `performed_by` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | NULL for system-initiated events |
| `performed_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `before_state` | `JSONB` | YES | NULL | — | Partial snapshot of relevant fields before the action |
| `after_state` | `JSONB` | YES | NULL | — | Partial snapshot of relevant fields after the action |
| `metadata` | `JSONB` | YES | NULL | — | Additional context: `request_id`, `ip_address`, `user_agent`, `trace_id` |

**Primary Key:** `id`

**Foreign Keys:**
- `performed_by` → `identity.users(id)` ON DELETE SET NULL

**Unique Constraints:** None — insert-only; no deduplication.

**Check Constraints:** None — intentionally permissive for flexibility.

**Recommended Indexes:**
- `(entity_type, entity_id)` — entity-scoped audit history (most common query)
- `(performed_by, performed_at DESC)` — user activity timeline
- `(performed_at DESC)` — global time-ordered audit log
- GIN index on `before_state` and `after_state` — for JSONB field searches in audit queries

**Notes:** `before_state` and `after_state` should contain only the fields relevant to the action — not full entity snapshots — to keep storage manageable. `metadata` captures operational context (tracing, IP). This table is the single audit source across all schemas; source modules should write audit events here via a shared audit service, not into separate per-module logs.
