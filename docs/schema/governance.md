# Schema: `governance`

> **Owner:** Shared / Governance
> **Purpose:** Manages the end-to-end submission, review, approval, certification, and promotion pipeline for assets moving from source modules into the Catalog. Governance status is explicitly distinct from source-module status and from Catalog publication status.

---

## Design Notes

### Status Separation
Three status axes are independent:
1. **Source-module status** — owned by FORGE, Intake, etc. (not in this schema)
2. **Governance status** — owned by `governance.asset_submissions` (`pending` → `in_review` → `approved` / `rejected` / `withdrawn`)
3. **Catalog publication status** — owned by `catalog.assets` (`preview` → `ga` → `deprecated` → `retired`)

### Stage-Based Review Pipeline
The governance pipeline is configurable via `stage_configs`. Each submission goes through one or more stage runs (`submission_stage_runs`). Each stage can have one or more reviews (`submission_reviews`). The pipeline is sequential; stages are ordered by `stage_configs.sequence_order`.

### NFR Fields on Submissions
NFR fields are captured on `asset_submissions` as governance inputs during the review process. When a submission is approved and the asset is promoted to Catalog, these NFR values are denormalised onto `catalog.assets` for efficient querying. The submission remains the authoritative record of what was reviewed.

### Certifications
A certification is issued by a designated certifier after approval. It is a governance act — it asserts that an asset meets a named standard. The certification references the catalog asset (not the submission), as it applies to the published artefact.

### Audit Trail
`audit_trail` is a generic append-only log. It records any significant state change on any platform entity. It is write-once — rows are never updated or deleted.

---

## Tables

### `governance.stage_configs`

Defines the ordered stages of the review pipeline. This is reference/configuration data managed by platform administrators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | e.g. `nfr_review`, `technical_review`, `security_review`, `data_governance_review`, `final_approval` |
| `name` | VARCHAR(200) | NOT NULL | e.g. `NFR Review`, `Technical Review` |
| `description` | TEXT | | What reviewers check at this stage |
| `sequence_order` | INT | NOT NULL | Lower = earlier in pipeline; uniqueness not enforced (parallel stages can share order) |
| `is_required` | BOOLEAN | NOT NULL, DEFAULT `true` | If false, this stage can be skipped |
| `required_role_id` | UUID | FK → `identity.roles.id` | If set, only users with this role may review at this stage |
| `sla_hours` | INT | | Target SLA in hours for this stage (informational) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Seed stage configs:**

| code | name | sequence_order |
|------|------|---------------|
| `nfr_review` | NFR Review | 10 |
| `technical_review` | Technical Review | 20 |
| `security_review` | Security Review | 30 |
| `data_governance_review` | Data Governance Review | 40 |
| `final_approval` | Final Approval | 50 |

---

### `governance.asset_submissions`

The central record for each governance submission. Created when a source module contributor submits an asset for review.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `source_module_id` | UUID | NOT NULL, FK → `platform.modules.id` | Which module the asset originates from |
| `source_entity_type` | VARCHAR(100) | NOT NULL | Source module's entity type, e.g. `dataset`, `api`, `model`, `report` |
| `source_entity_id` | UUID | NOT NULL | UUID of the entity in the source module's own DB |
| `submitted_by` | UUID | NOT NULL, FK → `identity.users.id` | Who submitted for review |
| `submitted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `governance_status` | ENUM | NOT NULL, DEFAULT `pending` | `pending` \| `in_review` \| `approved` \| `rejected` \| `withdrawn` |
| `current_stage_id` | UUID | FK → `governance.stage_configs.id` | Active stage (NULL if pending or resolved) |
| `resolved_at` | TIMESTAMPTZ | | When governance reached a final decision (approved/rejected/withdrawn) |
| `resolver_id` | UUID | FK → `identity.users.id` | Who made the final decision |
| `notes` | TEXT | | Submission rationale or cover note from submitter |
| | | | **— NFR fields (governance inputs) —** |
| `data_classification_term_id` | UUID | FK → `metadata.taxonomy_terms.id` | Proposed data classification (from scheme `data_classification`) |
| `hosting_type_term_id` | UUID | FK → `metadata.taxonomy_terms.id` | Proposed hosting type (from scheme `hosting_type`) |
| `contains_pii` | BOOLEAN | NOT NULL, DEFAULT `false` | Whether the asset contains personally identifiable information |
| `is_client_facing` | BOOLEAN | NOT NULL, DEFAULT `false` | Whether the asset is exposed to external clients |
| `sla_description` | TEXT | | Free-text SLA commitment, e.g. `99.9% availability, < 200ms p95` |
| `retention_policy` | TEXT | | Data retention period or policy statement |
| `compliance_tag_ids` | UUID[] | | Array of `metadata.taxonomy_terms.id` from scheme `compliance_tag` |
| | | | **— Org scope —** |
| `primary_country_id` | UUID | FK → `org.countries.id` | Country scope of submission |
| `opco_id` | UUID | FK → `org.opcos.id` | OpCo scope |
| `function_group_id` | UUID | FK → `org.function_groups.id` | Function group scope |
| `industry_sector_id` | UUID | FK → `org.industry_sectors.id` | Industry sector scope |
| `service_offering_id` | UUID | FK → `org.service_offerings.id` | Service offering scope |

**Indexes:** `source_module_id`, `source_entity_id`, `governance_status`, `submitted_by`

**Note on `compliance_tag_ids`:** Stored as `UUID[]` (array) for simplicity. Alternatively this could be a junction table `submission_compliance_tags(submission_id, term_id)`. The array approach is preferred here for read performance and simpler queries on small sets.

---

### `governance.submission_stage_runs`

Tracks the execution of each stage for a given submission. One row per stage per submission.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `submission_id` | UUID | NOT NULL, FK → `governance.asset_submissions.id` | |
| `stage_id` | UUID | NOT NULL, FK → `governance.stage_configs.id` | |
| `status` | ENUM | NOT NULL, DEFAULT `pending` | `pending` \| `in_progress` \| `passed` \| `failed` \| `skipped` |
| `started_at` | TIMESTAMPTZ | | When this stage run was activated |
| `completed_at` | TIMESTAMPTZ | | When this stage run reached a terminal status |
| `assignee_id` | UUID | FK → `identity.users.id` | Reviewer assigned to this stage run |
| `notes` | TEXT | | Stage-level reviewer notes |

**Unique constraint:** `(submission_id, stage_id)`

**Indexes:** `submission_id`, `stage_id`, `status`

---

### `governance.submission_reviews`

Individual review decisions recorded within a stage run. A stage may allow multiple reviews (e.g. one reviewer can request changes, another approves).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `submission_id` | UUID | NOT NULL, FK → `governance.asset_submissions.id` | |
| `stage_run_id` | UUID | NOT NULL, FK → `governance.submission_stage_runs.id` | |
| `reviewer_id` | UUID | NOT NULL, FK → `identity.users.id` | |
| `reviewed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `decision` | ENUM | NOT NULL | `approve` \| `reject` \| `request_changes` \| `defer` |
| `comments` | TEXT | | Review comments, required when decision is `reject` or `request_changes` |

**Indexes:** `submission_id`, `stage_run_id`, `reviewer_id`

---

### `governance.publication_promotions`

Records each promotion event that changes a catalog asset's publication status. Created by governance when an approved submission results in a Catalog entry or status change.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `submission_id` | UUID | NOT NULL, FK → `governance.asset_submissions.id` | The approved submission driving this promotion |
| `catalog_asset_id` | UUID | NOT NULL, FK → `catalog.assets.id` | The catalog asset being promoted |
| `promoted_by` | UUID | NOT NULL, FK → `identity.users.id` | Who executed the promotion |
| `promoted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `from_status` | ENUM | | Previous publication status (NULL if this is the first publication) |
| `to_status` | ENUM | NOT NULL | `preview` \| `ga` \| `deprecated` \| `retired` |
| `notes` | TEXT | | Reason for this promotion or deprecation |

**Indexes:** `submission_id`, `catalog_asset_id`

**Note on `from_status` / `to_status` enum values:** `preview` \| `ga` \| `deprecated` \| `retired` — mirrors `catalog.assets.publication_status`.

---

### `governance.certifications`

Certification records issued against published catalog assets. A certification asserts that an asset meets a named quality or compliance standard at a point in time.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `catalog_asset_id` | UUID | NOT NULL, FK → `catalog.assets.id` | Asset being certified |
| `certified_by` | UUID | NOT NULL, FK → `identity.users.id` | Certifier (must hold `governance_certifier` role) |
| `certified_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `valid_until` | TIMESTAMPTZ | | Expiry date (NULL = no expiry) |
| `standard` | VARCHAR(200) | NOT NULL | Name of the standard, e.g. `ISO 27001`, `SOC 2 Type II`, `Internal Gold Standard` |
| `score` | SMALLINT | | Optional numeric score 0–100 |
| `notes` | TEXT | | Certification notes or conditions |

**Indexes:** `catalog_asset_id`, `certified_at`

**Relationship note:** `catalog.assets` does not carry a FK back to `governance.certifications` to avoid circular dependency. The current/latest certification for an asset is resolved at query time:
```sql
SELECT * FROM governance.certifications
WHERE catalog_asset_id = :asset_id
ORDER BY certified_at DESC
LIMIT 1;
```

---

### `governance.audit_trail`

Append-only log of all significant state changes across the platform. Never updated or deleted — insert only.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `entity_type` | VARCHAR(100) | NOT NULL | e.g. `catalog.asset`, `governance.submission`, `identity.user` |
| `entity_id` | UUID | NOT NULL | UUID of the affected entity |
| `action` | VARCHAR(100) | NOT NULL | e.g. `submitted`, `stage_started`, `approved`, `promoted_to_ga`, `deprecated`, `certified`, `tag_added` |
| `performed_by` | UUID | FK → `identity.users.id` | NULL for system-generated events |
| `performed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `before_state` | JSONB | | Snapshot of relevant fields before the action |
| `after_state` | JSONB | | Snapshot of relevant fields after the action |
| `metadata` | JSONB | | Additional context (e.g. IP address, user agent, request ID) |

**Indexes:** `entity_type`, `entity_id`, `performed_at`, `performed_by`

**Design principle:** `before_state` and `after_state` are intentionally partial snapshots — capture only the fields relevant to the action, not the full entity. This keeps storage manageable while preserving meaningful diff data for review.

---

## Key Relationships

```
stage_configs ──< submission_stage_runs
asset_submissions ──< submission_stage_runs
asset_submissions ──< submission_reviews
submission_stage_runs ──< submission_reviews
asset_submissions ──< publication_promotions
catalog.assets ──< publication_promotions
catalog.assets ──< certifications
identity.users → asset_submissions (submitted_by, resolver_id)
identity.users → submission_reviews (reviewer_id)
identity.users → publication_promotions (promoted_by)
identity.users → certifications (certified_by)
platform.modules → asset_submissions (source_module_id)
org.* → asset_submissions (org dimension FKs)
metadata.taxonomy_terms → asset_submissions (NFR term FKs)
```

---

## Governance Pipeline Flow

```
Source Module                Governance                   Catalog
─────────────────────────────────────────────────────────────────
Asset authored
  │
  ▼
[Submit for review] ──────► asset_submissions (pending)
                                    │
                                    ▼
                        submission_stage_runs × N
                                    │
                       ┌───────────┼───────────┐
                       ▼           ▼           ▼
                    Stage 1     Stage 2    Stage N
                  (nfr_review) (tech)    (final)
                       │                       │
                 submission_reviews      submission_reviews
                       │                       │
                       └───────────┬───────────┘
                                   │ all stages passed
                                   ▼
                        governance_status = approved
                                   │
                                   ▼
                        publication_promotions ─────────────► catalog.assets (preview)
                                                                      │
                                                                      ▼ (promote to GA)
                                                             catalog.assets (ga)
                                                                      │
                                                             governance.certifications
```

---

## What is Shared vs Module-Owned

| Concern | Owner |
|---------|-------|
| Stage pipeline configuration | `governance` — shared |
| Submission records | `governance` — shared |
| Stage runs and reviews | `governance` — shared |
| Promotion decisions | `governance` — shared |
| Certifications | `governance` — shared |
| Audit trail | `governance` — shared |
| Source module internal status | Source module — NOT in this schema |
| Source module authoring workflow | Source module — NOT in this schema |
