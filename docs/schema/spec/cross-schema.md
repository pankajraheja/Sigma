# Cross-Schema Analysis: SigAI Platform DDL Spec

> **Status:** DDL-ready design — companion to the per-schema spec files.

---

## Complete Cross-Schema FK Map

The table below lists every foreign key relationship that crosses a schema boundary. Intra-schema FKs are documented within each schema's spec file.

| From | Column | → | To | ON DELETE |
|------|--------|---|----|-----------|
| `governance.stage_configs` | `required_role_id` | → | `identity.roles(id)` | SET NULL |
| `governance.stage_routing_rules` | `stage_config_id` | → | `governance.stage_configs(id)` | CASCADE |
| `governance.stage_routing_rules` | `override_required_role_id` | → | `identity.roles(id)` | SET NULL |
| `governance.asset_submissions` | `source_module_id` | → | `platform.modules(id)` | RESTRICT |
| `governance.asset_submissions` | `submitted_by` | → | `identity.users(id)` | RESTRICT |
| `governance.asset_submissions` | `current_stage_id` | → | `governance.stage_configs(id)` | SET NULL |
| `governance.asset_submissions` | `resolver_id` | → | `identity.users(id)` | SET NULL |
| `governance.asset_submissions` | `primary_country_id` | → | `org.countries(id)` | SET NULL |
| `governance.asset_submissions` | `opco_id` | → | `org.opcos(id)` | SET NULL |
| `governance.asset_submissions` | `function_group_id` | → | `org.function_groups(id)` | SET NULL |
| `governance.asset_submissions` | `industry_sector_id` | → | `org.industry_sectors(id)` | SET NULL |
| `governance.asset_submissions` | `service_offering_id` | → | `org.service_offerings(id)` | SET NULL |
| `governance.submission_stage_runs` | `submission_id` | → | `governance.asset_submissions(id)` | CASCADE |
| `governance.submission_stage_runs` | `stage_id` | → | `governance.stage_configs(id)` | RESTRICT |
| `governance.submission_stage_runs` | `assignee_id` | → | `identity.users(id)` | SET NULL |
| `governance.submission_reviews` | `submission_id` | → | `governance.asset_submissions(id)` | CASCADE |
| `governance.submission_reviews` | `stage_run_id` | → | `governance.submission_stage_runs(id)` | CASCADE |
| `governance.submission_reviews` | `reviewer_id` | → | `identity.users(id)` | RESTRICT |
| `governance.publication_promotions` | `submission_id` | → | `governance.asset_submissions(id)` | RESTRICT |
| `governance.publication_promotions` | `catalog_asset_id` | → | `catalog.assets(id)` | RESTRICT |
| `governance.publication_promotions` | `promoted_by` | → | `identity.users(id)` | RESTRICT |
| `governance.certifications` | `catalog_asset_id` | → | `catalog.assets(id)` | RESTRICT |
| `governance.certifications` | `certified_by` | → | `identity.users(id)` | RESTRICT |
| `governance.certifications` | `revoked_by` | → | `identity.users(id)` | SET NULL |
| `governance.audit_trail` | `performed_by` | → | `identity.users(id)` | SET NULL |
| `catalog.assets` | `approved_submission_id` | → | `governance.asset_submissions(id)` | SET NULL |
| `catalog.assets` | `owner_id` | → | `identity.users(id)` | RESTRICT |
| `catalog.assets` | `primary_country_id` | → | `org.countries(id)` | SET NULL |
| `catalog.assets` | `opco_id` | → | `org.opcos(id)` | SET NULL |
| `catalog.assets` | `function_group_id` | → | `org.function_groups(id)` | SET NULL |
| `catalog.assets` | `industry_sector_id` | → | `org.industry_sectors(id)` | SET NULL |
| `catalog.assets` | `service_offering_id` | → | `org.service_offerings(id)` | SET NULL |
| `catalog.assets` | `source_module_id` | → | `platform.modules(id)` | RESTRICT |
| `catalog.asset_versions` | `asset_id` | → | `catalog.assets(id)` | CASCADE |
| `catalog.asset_versions` | `released_by` | → | `identity.users(id)` | RESTRICT |
| `catalog.asset_versions` | `submission_id` | → | `governance.asset_submissions(id)` | SET NULL |
| `catalog.asset_classifications` | `asset_id` | → | `catalog.assets(id)` | CASCADE |
| `catalog.asset_classifications` | `term_id` | → | `metadata.taxonomy_terms(id)` | RESTRICT |
| `catalog.asset_classifications` | `classified_by` | → | `identity.users(id)` | RESTRICT |
| `catalog.asset_tags` | `asset_id` | → | `catalog.assets(id)` | CASCADE |
| `catalog.asset_tags` | `tag_id` | → | `metadata.tags(id)` | CASCADE |
| `catalog.asset_tags` | `tagged_by` | → | `identity.users(id)` | RESTRICT |
| `catalog.asset_source_refs` | `asset_id` | → | `catalog.assets(id)` | CASCADE |
| `catalog.asset_source_refs` | `added_by` | → | `identity.users(id)` | RESTRICT |
| `identity.roles` | `(none cross-schema)` | — | — | — |
| `identity.permissions` | `module_id` | → | `platform.modules(id)` | CASCADE |
| `identity.role_permissions` | `role_id` | → | `identity.roles(id)` | CASCADE |
| `identity.role_permissions` | `permission_id` | → | `identity.permissions(id)` | CASCADE |
| `identity.role_permissions` | `granted_by` | → | `identity.users(id)` | SET NULL |
| `identity.user_roles` | `user_id` | → | `identity.users(id)` | CASCADE |
| `identity.user_roles` | `role_id` | → | `identity.roles(id)` | RESTRICT |
| `identity.user_roles` | `granted_by` | → | `identity.users(id)` | SET NULL |
| `identity.user_scope_bindings` | `user_id` | → | `identity.users(id)` | CASCADE |
| `identity.user_scope_bindings` | `role_id` | → | `identity.roles(id)` | RESTRICT |
| `identity.user_scope_bindings` | `granted_by` | → | `identity.users(id)` | SET NULL |
| `org.opcos` | `primary_country_id` | → | `org.countries(id)` | SET NULL |
| `org.service_offerings` | `function_group_id` | → | `org.function_groups(id)` | SET NULL |
| `org.service_offerings` | `industry_sector_id` | → | `org.industry_sectors(id)` | SET NULL |
| `metadata.taxonomy_terms` | `scheme_id` | → | `metadata.concept_schemes(id)` | RESTRICT |
| `metadata.metadata_definitions` | `concept_scheme_id` | → | `metadata.concept_schemes(id)` | RESTRICT |
| `metadata.metadata_definitions` | `module_id` | → | `platform.modules(id)` | CASCADE |
| `metadata.metadata_picklist_values` | `definition_id` | → | `metadata.metadata_definitions(id)` | CASCADE |
| `metadata.metadata_picklist_values` | `term_id` | → | `metadata.taxonomy_terms(id)` | CASCADE |
| `platform.linked_resources` | `added_by` | → | `identity.users(id)` | SET NULL |

---

## Soft / Polymorphic References (Not DB-Level FKs)

These references cross entity boundaries where a DB FK cannot be enforced. Application layer is responsible for validation.

| Table | Column(s) | Resolves to | Discriminator |
|-------|-----------|-------------|---------------|
| `identity.user_scope_bindings` | `scope_ref_id` | `platform.modules.id` \| `org.countries.id` \| `org.opcos.id` \| `org.function_groups.id` | `scope_type` |
| `governance.stage_routing_rules` | `scope_ref_id` | `platform.modules.id` \| `org.countries.id` \| `org.opcos.id` \| `org.function_groups.id` \| `org.industry_sectors.id` \| `org.service_offerings.id` | `scope_type` |
| `platform.linked_resources` | `entity_id` | Any entity table | `entity_type` |
| `governance.audit_trail` | `entity_id` | Any entity table | `entity_type` |
| `catalog.assets` | `source_entity_id` | Source module's DB entity | `source_entity_type` |
| `governance.asset_submissions` | `source_entity_id` | Source module's DB entity | `source_entity_type` |

---

## Shared Backbone vs Module-Specific

### Shared Backbone
These schemas are cross-cutting concerns owned by the platform. They must be stable before any module is built.

| Schema | What it owns |
|--------|-------------|
| `identity` | All users, roles, permissions, and access control. Zero module-specific content. |
| `org` | All organisational reference data. Modules reference, never write, to this schema. |
| `metadata` | All taxonomy, controlled vocabularies, tags, and metadata attribute definitions. Modules extend by registering new definitions, not new tables. |
| `platform` | Module registry and universal linked-resource pattern. |
| `governance` | Submission pipeline, review, certification, promotion, and audit trail. Shared by all modules that need governance approval. |

### Module-Specific
These schemas are owned by a single module. Other modules do not write to them.

| Schema | Owning module | What it owns |
|--------|--------------|-------------|
| `catalog` | Catalog | Published asset registry. Created by governance promotion, not by direct user authoring. |
| `forge.*` *(future)* | FORGE | Authoring entities (datasets, models, skills, connectors in draft/review state). FORGE-internal lifecycle. |
| `intake.*` *(future)* | Intake | Intake request entities and their internal review workflow. |
| `prototype_builder.*` *(future)* | Prototype Builder | Prototype artefacts and their FORGE-submission state. |
| `app_builder.*` *(future)* | Application Builder | Application definitions and deployment records. |

**Rule:** Module-specific schemas own their authoring tables. They submit to `governance` for promotion to `catalog`. They reference `identity`, `org`, `metadata`, and `platform` for shared reference data but do not write to those schemas.

---

## Design Risks and Open Decisions

The following are unresolved design questions to review before writing migration scripts.

---

### Risk 1 — NFR Fields: Direct Columns vs Taxonomy FK

**Decision:** Core NFR fields (`data_classification`, `hosting_type`, `audience_type`, `business_criticality`) are modelled as `VARCHAR` with CHECK constraints on both `governance.asset_submissions` and `catalog.assets`.

**Risk:** Adding a new value (e.g. a new data classification tier) requires an `ALTER TABLE` to update the CHECK constraint and a coordinated frontend deploy. This couples the DB schema to vocabulary evolution.

**Alternative:** Store NFR fields as FK references to `metadata.taxonomy_terms`. This makes vocabulary extension migration-free but requires joins on every catalog query and makes the schema harder to reason about for analysts.

**Recommendation before scripting:** Decide whether the NFR vocabulary is truly closed (CHECK constraint is fine) or expected to grow (use taxonomy_term FK). If taxonomy FK, remove the CHECK constraints from the spec and add `_term_id UUID FK metadata.taxonomy_terms(id)` columns instead.

---

### Risk 2 — `compliance_tags` as `TEXT[]` vs Junction Table

**Decision:** `compliance_tags` is stored as `TEXT[]` on `governance.asset_submissions` and `catalog.assets`.

**Risk:** Array columns have limited referential integrity (no FK to `metadata.taxonomy_terms`), and array equality operators behave differently from join-based queries. Containment queries require a GIN index. Invalid tag codes can be inserted without DB-level validation.

**Alternative:** A junction table `catalog.asset_compliance_tags(asset_id, term_id)` with proper FKs to `metadata.taxonomy_terms`. This is normalised, refintegrally safe, and easier to query with standard JOINs.

**Recommendation:** If compliance tags will be used heavily in search filters, consider the junction table. For now, document that the application must validate tag codes against `metadata.taxonomy_terms` before insert and maintain the GIN index.

---

### Risk 3 — NFR Denormalisation Drift

**Decision:** NFR fields on `catalog.assets` are denormalised copies of fields from `governance.asset_submissions`, written at promotion time.

**Risk:** If a re-submission is approved with updated NFR values (e.g. classification changed from `internal` to `confidential`), a new promotion must be created to update `catalog.assets`. If the promotion step is skipped or fails silently, the catalog record will show stale NFR values while the governance record is correct.

**Recommendation:**
- The promotion service must be transactional: update `catalog.assets` NFR fields and insert `publication_promotions` in the same transaction.
- Add an `nfr_synced_at TIMESTAMPTZ` column to `catalog.assets` to record when NFRs were last synced from governance. Allows a health-check query to detect drift.
- Consider a DB trigger that prevents direct updates to NFR columns on `catalog.assets` — they should only be written by the promotion service.

---

### Risk 4 — Circular Dependency: `governance.certifications` ↔ `catalog.assets`

**Decision:** `governance.certifications.catalog_asset_id → catalog.assets.id` (one direction only). `catalog.assets` does not carry a `current_certification_id` FK back to `governance.certifications`.

**Risk:** Resolving the current active certification always requires a query rather than a single FK lookup. For high-traffic catalog pages, this is an extra query per asset card.

**Alternatives:**
- Add a nullable `current_certification_id UUID` to `catalog.assets`, accepted as a deferred FK (set in a second step after the certification row exists). This breaks the circular dependency by making the back-reference optional and application-managed.
- Materialise the certification summary in a separate `catalog.asset_certification_summaries` table updated by trigger.

**Recommendation:** Accept the query pattern for now. If profiling shows this is a hot path, materialise with a generated column or a lightweight cache table.

---

### Risk 5 — `source_entity_id` Across Database Boundaries

**Decision:** `catalog.assets.source_entity_id` and `governance.asset_submissions.source_entity_id` are UUID columns referencing records in source modules' own databases. No DB-level FK is possible across database boundaries.

**Risk:** A source module may delete, archive, or replace a source entity without notifying catalog or governance. The `source_entity_id` on catalog records would then be a dangling reference with no DB-enforced constraint to catch it.

**Recommendation:**
- Source modules must publish a domain event (e.g. `source.entity.deleted`) when a source entity is removed.
- Governance and catalog must subscribe and decide whether to flag, hide, or retire affected catalog assets.
- Consider adding a `source_entity_status VARCHAR(20)` column to `catalog.assets` (e.g. `reachable`, `deleted`, `unknown`) updated by an async reconciliation job.

---

### Risk 6 — Multi-Country / Multi-OpCo Assets

**Decision:** `catalog.assets` carries a single `primary_country_id` and a single `opco_id`.

**Risk:** A global dataset (e.g. "Employee Directory — Global") is legitimately relevant to multiple countries and multiple OpCos. A single FK cannot represent this. Discovery filters for "show me assets available in APAC" would miss a global asset that doesn't have an APAC country FK.

**Alternatives:**
- Add a `catalog.asset_org_scope` junction table: `(asset_id, scope_type, scope_ref_id)` for multi-valued org scoping.
- Use a special sentinel `primary_country_id → org.countries.id` for a "GLOBAL" country record (exists in seed data as `iso_alpha2 = 'XX'`).
- Store a `countries UUID[]` array for multi-country assets (partial normalisation).

**Recommendation:** Reserve the single FK model for now. Introduce a `catalog.asset_org_scopes` junction table when a concrete multi-country use case is confirmed. Do not prematurely normalise.

---

### Risk 7 — Stage Routing Rules Resolution Order

**Decision:** `governance.stage_routing_rules` provides scope-specific overrides for stage behaviour. When multiple rules match a submission (e.g. one rule for `country = GB`, another for `opco = UK_BANKING`), the resolution order is not defined at the DB level.

**Risk:** Ambiguous or conflicting routing rules can produce unpredictable pipeline behaviour. There is no DB constraint preventing two conflicting rules for the same submission.

**Recommendation:** Define and document the resolution priority before scripting:
1. `module` scope (most specific)
2. `opco` scope
3. `function_group` scope
4. `industry_sector` scope
5. `country` scope
6. `service_offering` scope
7. Stage config default (least specific)

If two rules of the same `scope_type` match, raise an application-level error and require an administrator to resolve the conflict. Consider adding a `priority` column to `stage_routing_rules` for explicit ordering.

---

### Risk 8 — `is_current` Concurrency on `catalog.asset_versions`

**Decision:** `is_current BOOLEAN` on `catalog.asset_versions` flags the active version. A partial unique index `(asset_id) WHERE is_current = true` enforces at most one current version per asset.

**Risk:** Concurrent promotions (two governance processes running simultaneously for the same asset) could race to set `is_current = true`. Without serialisation, both could succeed momentarily before the partial unique index catches the violation.

**Recommendation:**
- Serialise all version transitions through an application-level lock (e.g. an advisory lock on the `asset_id`).
- Or use a DB-level serialisable transaction: `SELECT id FROM catalog.assets WHERE id = :asset_id FOR UPDATE` before updating `is_current`.
- The partial unique index is a safety net, not the primary concurrency mechanism.

---

### Risk 9 — `governance.audit_trail` Storage Growth

**Decision:** `audit_trail` is append-only with JSONB `before_state` and `after_state` columns. It covers all entity types platform-wide.

**Risk:** At scale, this table will grow very large. JSONB snapshots can be large. Without partitioning and archival, query performance on `(entity_type, entity_id)` will degrade over time.

**Recommendation before scripting:**
- Partition by `performed_at` (range partitioning by month or quarter) from day one. This is much easier to add in the initial DDL than to retrofit later.
- Define a retention policy: e.g. JSONB snapshots (`before_state`, `after_state`) are truncated after 24 months; the core event record (`entity_type`, `entity_id`, `action`, `performed_by`, `performed_at`) is retained indefinitely.
- Consider a separate `audit_trail_archive` table (or object storage) for aged-out rows.

---

### Risk 10 — `platform.linked_resources.entity_type` CHECK Constraint Maintenance

**Decision:** `linked_resources.entity_type` has a CHECK constraint enumerating valid entity type strings. This prevents arbitrary strings from being inserted.

**Risk:** Every time a new entity type is added (e.g. `intake.request`, `forge.asset`), the CHECK constraint must be altered with a migration. This couples the platform schema to module schema evolution.

**Alternatives:**
- Remove the CHECK constraint and rely on application-layer validation of `entity_type`. Accept that the DB will not enforce the value set.
- Replace the CHECK constraint with a lookup table `platform.entity_types(code)` and a FK on `linked_resources.entity_type` (normalised, migration-free for new types, but requires an extra table and FK).
- Keep the CHECK constraint but manage it as a deliberately maintained "extension point" with a documented process for adding new entity types.

**Recommendation:** Use a lookup table `platform.entity_types(code VARCHAR(100) PK)` and a FK. This is migration-free for adding new entity types (just `INSERT` a row) while maintaining DB-level integrity.

---

## Summary: Decisions Required Before Scripting

| # | Decision | Impact |
|---|----------|--------|
| 1 | NFR fields as CHECK-constrained VARCHAR vs. taxonomy_term FK | Vocabulary extensibility |
| 2 | `compliance_tags` as TEXT[] vs. normalised junction table | Search performance, referential integrity |
| 3 | NFR denormalisation sync mechanism (trigger, event, or service) | Data correctness |
| 4 | `current_certification_id` back-reference on `catalog.assets` | Query performance |
| 5 | Source entity deletion event handling and `source_entity_status` column | Data consistency |
| 6 | Single vs. multi-valued org scoping on `catalog.assets` | Discovery coverage |
| 7 | Stage routing resolution priority and conflict rules | Pipeline correctness |
| 8 | `is_current` concurrency serialisation strategy | Version integrity |
| 9 | `audit_trail` partitioning and retention policy | Storage and performance at scale |
| 10 | `entity_type` CHECK constraint vs. lookup table FK | Schema maintainability |
