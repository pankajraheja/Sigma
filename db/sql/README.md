# SigAI Platform — SQL DDL Files

> **Target database:** PostgreSQL 16
> **Status:** Initial DDL — governance and catalog schemas only.
> Identity, full metadata, full platform, and FORGE/Intake module schemas are in future migrations.

---

## Execution Order

Run files in the numbered sequence. Each file depends on all lower-numbered files being applied first.

```
psql -d <your_database> \
  -f 001_init_extensions.sql \
  -f 002_create_schemas.sql \
  -f 003_org_reference_minimal.sql \
  -f 004_metadata_reference_minimal.sql \
  -f 010_governance_core.sql \
  -f 020_catalog_core.sql
```

Or with `\i` inside a `psql` session:
```sql
\i db/sql/001_init_extensions.sql
\i db/sql/002_create_schemas.sql
\i db/sql/003_org_reference_minimal.sql
\i db/sql/004_metadata_reference_minimal.sql
\i db/sql/010_governance_core.sql
\i db/sql/020_catalog_core.sql
```

---

## File Manifest

| File | What it creates | Run order |
|------|-----------------|-----------|
| `001_init_extensions.sql` | PostgreSQL extensions: `pgcrypto`, `citext`, `pg_trgm` | 1 |
| `002_create_schemas.sql` | Schema namespaces + `platform.set_updated_at()` trigger function | 2 |
| `003_org_reference_minimal.sql` | `platform.modules` stub + all five `org.*` reference tables | 3 |
| `004_metadata_reference_minimal.sql` | `metadata.taxonomy_terms` stub + `metadata.tags` stub | 4 |
| `010_governance_core.sql` | All `governance.*` tables + indexes + triggers | 5 |
| `020_catalog_core.sql` | All `catalog.*` tables + indexes + triggers + deferred FK closure | 6 |

---

## What Each File Creates

### `001_init_extensions.sql`
- `pgcrypto` — provides `gen_random_uuid()` for all UUID primary keys
- `citext` — case-insensitive text (reserved for email fields in identity migration)
- `pg_trgm` — trigram similarity for GIN-backed ILIKE search on tag labels and asset names

### `002_create_schemas.sql`
Six schema namespaces:

| Schema | Purpose |
|--------|---------|
| `platform` | Shared utilities; `set_updated_at()` trigger function lives here |
| `org` | Organisational reference data |
| `metadata` | Taxonomy, controlled vocabularies, tags |
| `identity` | Users, roles, permissions *(placeholder; tables in future migration)* |
| `governance` | Submission pipeline, reviews, promotion, audit |
| `catalog` | Published asset registry |

### `003_org_reference_minimal.sql`
Minimal stub tables needed as FK targets by governance and catalog:

| Table | Purpose |
|-------|---------|
| `platform.modules` | Module registry stub — FK target for `source_module_id` |
| `org.countries` | ISO 3166-1 country list |
| `org.opcos` | Operating companies (supports parent-child hierarchy) |
| `org.function_groups` | Functional groupings (e.g. Risk Management, AI & Data Services) |
| `org.industry_sectors` | Industry sector classification (supports sub-sector hierarchy) |
| `org.service_offerings` | Specific products/services anchored to function groups and sectors |

Includes seed data for `platform.modules` (7 modules).

### `004_metadata_reference_minimal.sql`
Minimal stubs needed as FK targets by `catalog.asset_classifications` and `catalog.asset_tags`:

| Table | Purpose |
|-------|---------|
| `metadata.taxonomy_terms` | Controlled vocabulary values — FK target for `asset_classifications.term_id` |
| `metadata.tags` | User-contributed informal labels — FK target for `asset_tags.tag_id` |

Includes seed taxonomy terms for `asset_kind`, `domain`, and `compliance_tag` schemes.

### `010_governance_core.sql`
All governance tables:

| Table | Purpose |
|-------|---------|
| `governance.stage_configs` | Configurable pipeline stage definitions (seed: 5 stages) |
| `governance.asset_submissions` | Central submission record; owns governance lifecycle + NFR declarations |
| `governance.submission_stage_runs` | Per-stage execution tracking per submission |
| `governance.submission_reviews` | Individual reviewer decisions within a stage run |
| `governance.publication_promotions` | Immutable record of every catalog publication status change |
| `governance.audit_trail` | Append-only platform-wide event log |

**Note:** `governance.publication_promotions.catalog_asset_id` column is created here as `UUID NOT NULL` without a FK constraint (catalog does not yet exist). The FK is added by `020_catalog_core.sql`.

### `020_catalog_core.sql`
All catalog tables + FK closure:

| Table | Purpose |
|-------|---------|
| `catalog.assets` | Primary published asset record |
| `catalog.asset_versions` | Version history per asset |
| `catalog.asset_classifications` | Controlled-vocabulary taxonomy associations |
| `catalog.asset_tags` | User-contributed tag associations |
| `catalog.asset_source_refs` | Source traceability references (GitHub, DBT, Confluence, etc.) |

Closes the deferred FK via:
```sql
ALTER TABLE governance.publication_promotions
  ADD CONSTRAINT fk_promotions_catalog_asset
    FOREIGN KEY (catalog_asset_id) REFERENCES catalog.assets(id) ON DELETE RESTRICT;
```

---

## How This Supports the Platform Backbone

The platform backbone is a sequential pipeline:

```
Source Module (FORGE / Intake / Prototype Builder / App Builder)
  │
  │  Author asset internally (source module's own DB — not in this DDL)
  │
  ▼
governance.asset_submissions
  ├── governance_status: pending → in_review
  │
  ├── governance.submission_stage_runs  (one row per stage per submission)
  │     ├── NFR Review     (sequence_order = 10)
  │     ├── Technical Review (20)
  │     ├── Security Review  (30)
  │     ├── Data Governance  (40)
  │     └── Final Approval   (50)
  │
  ├── governance.submission_reviews     (one or more per stage run)
  │     └── decision: approve | reject | request_changes | defer
  │
  └── governance_status: approved
        │
        ▼
  governance.publication_promotions
        ├── to_status: 'preview'   ──► catalog.assets (created, publication_status = 'preview')
        └── to_status: 'ga'        ──► catalog.assets (publication_status = 'ga')
                                              │
                                              │  (discoverable in catalog search)
                                              │
                              ┌───────────────┴─────────────────────┐
                              │                                     │
                    catalog.asset_versions            governance.certifications
                    (version history)                 (future migration — governance schema)
                              │
                    catalog.asset_classifications
                    catalog.asset_tags
                    catalog.asset_source_refs

  All events written throughout → governance.audit_trail
```

### Key lifecycle rules enforced by this DDL

| Rule | Enforcement |
|------|-------------|
| One active submission per source entity | Partial unique index on `governance.asset_submissions` where `governance_status NOT IN ('approved','rejected','withdrawn')` |
| NFRs are informational, not access-control | No RLS policies or access-control logic on NFR columns — they are plain data columns |
| One catalog record per source entity | Unique constraint on `catalog.assets (source_module_id, source_entity_type, source_entity_id)` |
| One current version per asset | Partial unique index on `catalog.asset_versions (asset_id) WHERE is_current = TRUE` |
| Publication status is a controlled value | CHECK constraint: `publication_status IN ('preview', 'ga', 'deprecated', 'retired')` |
| Governance status is a controlled value | CHECK constraint: `governance_status IN ('pending', 'in_review', 'approved', 'rejected', 'withdrawn')` |
| Deprecated/retired timestamps match status | CHECK constraints on `deprecated_at` and `retired_at` |
| A promotion must change the status | CHECK constraint: `from_status IS DISTINCT FROM to_status` |
| Audit trail is append-only | Application convention; no DB mechanism prevents UPDATE — documented in architecture |

---

## Discoverability: What "GA only" Means

By design, only assets with `publication_status IN ('ga', 'preview')` are shown in catalog search and browse. This is enforced at the application/API layer, not by a DB row-level constraint. The DDL provides partial indexes to make these filtered queries efficient:

```sql
-- Catalog search query should always include this predicate:
WHERE publication_status IN ('ga', 'preview')

-- Or for fully promoted (GA only):
WHERE publication_status = 'ga'
```

The partial index `idx_catalog_assets_discoverable` covers `(updated_at DESC) WHERE publication_status IN ('ga', 'preview')` — planner will use this for time-ordered discovery feeds.

---

## Deferred FKs (to be added in future migrations)

The following FK constraints are noted inline in the SQL files but not yet enforced. They will be added as `ALTER TABLE ... ADD CONSTRAINT` statements in the corresponding schema migrations:

| Column | Future FK |
|--------|-----------|
| `governance.stage_configs.required_role_id` | → `identity.roles(id)` ON DELETE SET NULL |
| `governance.asset_submissions.submitted_by` | → `identity.users(id)` ON DELETE RESTRICT |
| `governance.asset_submissions.resolver_id` | → `identity.users(id)` ON DELETE SET NULL |
| `governance.submission_stage_runs.assignee_id` | → `identity.users(id)` ON DELETE SET NULL |
| `governance.submission_reviews.reviewer_id` | → `identity.users(id)` ON DELETE RESTRICT |
| `governance.publication_promotions.promoted_by` | → `identity.users(id)` ON DELETE RESTRICT |
| `governance.audit_trail.performed_by` | → `identity.users(id)` ON DELETE SET NULL |
| `catalog.assets.owner_id` | → `identity.users(id)` ON DELETE RESTRICT |
| `catalog.asset_versions.released_by` | → `identity.users(id)` ON DELETE RESTRICT |
| `catalog.asset_classifications.classified_by` | → `identity.users(id)` ON DELETE RESTRICT |
| `catalog.asset_tags.tagged_by` | → `identity.users(id)` ON DELETE RESTRICT |
| `catalog.asset_source_refs.added_by` | → `identity.users(id)` ON DELETE RESTRICT |

---

## Planned Future Migrations

| File (planned) | What it adds |
|----------------|-------------|
| `005_identity_core.sql` | `identity.users`, `identity.roles`, `identity.permissions`, `identity.role_permissions`, `identity.user_roles`, `identity.user_scope_bindings` + deferred FKs listed above |
| `006_platform_full.sql` | Full `platform.modules` columns + `platform.linked_resources` |
| `007_metadata_full.sql` | `metadata.concept_schemes`, full `metadata.taxonomy_terms` with FK + hierarchy, `metadata.metadata_definitions`, `metadata.metadata_picklist_values` |
| `011_governance_certifications.sql` | `governance.certifications` + `governance.stage_routing_rules` |
| `021_catalog_full_text.sql` | Full-text search tuning, additional tsvector configuration languages |

---

## Notes on Partitioning

`governance.audit_trail` will grow unboundedly in production. Before deploying to production, convert it to a range-partitioned table by `performed_at` (monthly or quarterly). This is substantially easier when declared at table creation time. See [docs/schema/spec/cross-schema.md](../../docs/schema/spec/cross-schema.md) — Design Risk 9 for the full recommendation.

---

## Design Reference

Full field-level specifications, cross-schema FK map, and design risks are documented in:

```
docs/schema/spec/
  governance.md
  catalog.md
  identity.md
  org.md
  metadata.md
  platform.md
  cross-schema.md
```
