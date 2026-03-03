# SigAI Platform — Governance + Catalog Backbone Smoke Test

Validates the core platform flow end-to-end using plain SQL:

```
FORGE workflow → governance submission → stage review → approval → promotion → catalog asset
```

No application code. No migrations tooling. SQL only.

---

## Prerequisites

The DDL files in `db/sql/` must be applied to the target database **in order** before running these tests:

```bash
psql -d <your_database> \
  -f db/sql/001_init_extensions.sql \
  -f db/sql/002_create_schemas.sql \
  -f db/sql/003_org_reference_minimal.sql \
  -f db/sql/004_metadata_reference_minimal.sql \
  -f db/sql/010_governance_core.sql \
  -f db/sql/020_catalog_core.sql
```

---

## Execution Order

### Step 1 — Seed test data

```bash
psql -d <your_database> -f db/test/seed_smoke_test.sql
```

**Expected terminal output:**
```
NOTICE:      Resolved: forge module = <uuid>
NOTICE:      Resolved: nfr_review stage = <uuid>
NOTICE:      Resolved: final_approval stage = <uuid>
NOTICE: [1/9] Org reference records inserted: ...
NOTICE: [2/9] Asset submission inserted: <uuid>
NOTICE:       source: forge / workflow / cafecafe-0000-4000-8000-000000000042
NOTICE:       governance_status = in_review, stage = nfr_review
NOTICE: [3/9] Submission stage run inserted: <uuid>
NOTICE:       stage = nfr_review, status = passed
NOTICE: [4/9] Submission review inserted: <uuid> — decision: approve
NOTICE: [5/9] Submission updated to approved: <uuid>
NOTICE:       governance_status = approved, resolved_at = NOW()
NOTICE:       updated_at trigger fired automatically
NOTICE: [6/9] Catalog asset inserted: <uuid>
NOTICE:       name = Fraud Detection Workflow v2
NOTICE:       publication_status = preview (will be promoted to ga in step 7b)
NOTICE:       source: forge / workflow / cafecafe-0000-4000-8000-000000000042
NOTICE: [7/9] Publication promotions inserted:
NOTICE:       preview promotion: <uuid>
NOTICE:       ga promotion: <uuid>
NOTICE:       catalog.assets.publication_status updated to: ga
NOTICE: [8/9] Asset version inserted: <uuid> — v2.0.0 (is_current = true)
NOTICE: [9/9] Asset source refs inserted:
NOTICE:       primary ref (forge_asset_id): <uuid>
NOTICE:       secondary ref: github_repo — sigai-org/fraud-detection-workflow
NOTICE:       [bonus] 3 audit trail entries written.
NOTICE: ============================================================
NOTICE: Smoke test seed complete. Run validate_smoke_test.sql next.
NOTICE: ============================================================
```

### Step 2 — Run validation queries

```bash
psql -d <your_database> -f db/test/validate_smoke_test.sql
```

---

## What the Seed Inserts

| Step | Table | Record |
|------|-------|--------|
| 1 | `org.countries` | `XT` — Smoke Test Country (not a real ISO code) |
| 1 | `org.opcos` | `SMOKE_UK_BANKING` — Smoke Test UK Banking Division |
| 1 | `org.function_groups` | `SMOKE_RISK_MGMT` — Smoke Test Risk Management |
| 1 | `org.industry_sectors` | `SMOKE_BANKING` — Smoke Test Banking |
| 1 | `org.service_offerings` | `SMOKE_FRAUD_DETECT` — Smoke Test Fraud Detection |
| 2 | `governance.asset_submissions` | FORGE workflow submission; `governance_status = in_review` |
| 3 | `governance.submission_stage_runs` | NFR Review stage; `status = passed` |
| 4 | `governance.submission_reviews` | Reviewer decision: `approve` |
| 5 | *(UPDATE)* | `governance.asset_submissions.governance_status → approved` |
| 6 | `catalog.assets` | Published asset; `publication_status = preview` |
| 7a | `governance.publication_promotions` | First promotion: `NULL → preview` |
| 7b | *(UPDATE + INSERT)* | Catalog asset promoted to `ga`; second promotion recorded |
| 8 | `catalog.asset_versions` | `v2.0.0`, `is_current = true` |
| 9 | `catalog.asset_source_refs` | Primary: `forge_asset_id`; secondary: `github_repo` |
| Bonus | `governance.audit_trail` | 3 lifecycle events: `submitted`, `approved`, `promoted_to_ga` |

---

## What the Validation Queries Check

| Validation | What it proves |
|-----------|----------------|
| **1** | Submission exists with `governance_status = approved` and all NFR fields set |
| **2** | Stage run pipeline: NFR Review `passed`, review decision `approve` recorded |
| **3** | Two promotion records exist (`NULL → preview`, `preview → ga`) |
| **4** | Catalog asset is `ga`, has `published_at`, is discoverable |
| **5** | Source traceability: `source_module_id / source_entity_type / source_entity_id` match between submission and catalog asset |
| **6** | All five org FK columns (`country`, `opco`, `function_group`, `industry_sector`, `service_offering`) resolve via JOIN |
| **7** | `governance_status` and `publication_status` are **independent** — different columns, different tables, different value domains |
| **8a** | `asset_versions` has one row with `is_current = true` |
| **8b** | `asset_source_refs` has primary ref (`forge_asset_id`) and secondary ref (`github_repo`) |
| **9** | `audit_trail` has 3 lifecycle events for this asset |
| **10** | Full pipeline summary query (governance dashboard view) returns 1 aggregated row |
| **Summary** | 13 boolean assertions — every column must be `true` |

---

## Summary Query: Expected Result

The final `SUMMARY` query in `validate_smoke_test.sql` returns a single row of boolean columns. Every column must be `true` for the smoke test to pass:

| Column | Expected | Validates |
|--------|----------|-----------|
| `submission_approved` | `true` | Submission exists with `governance_status = approved` |
| `stage_run_passed` | `true` | At least one stage run has `status = passed` |
| `review_approved` | `true` | At least one review has `decision = approve` |
| `two_promotions_exist` | `true` | Both preview and ga promotions were recorded |
| `catalog_asset_is_ga` | `true` | Catalog asset has `publication_status = ga` |
| `source_trace_preserved` | `true` | `source_entity_id` matches between submission and catalog |
| `all_org_fks_resolve` | `true` | All 5 org FK JOINs succeed |
| `statuses_are_separate` | `true` | `governance_status ≠ publication_status` (different value domains) |
| `current_version_exists` | `true` | Exactly one version row has `is_current = true` |
| `primary_source_ref_exists` | `true` | At least one source ref has `is_primary = true` |
| `audit_trail_has_entries` | `true` | 3 audit trail entries exist for the smoke test |
| `updated_at_trigger_fired` | `true` | `updated_at > created_at` on the submission (trigger fired on UPDATE) |
| `asset_is_discoverable` | `true` | `publication_status IN ('ga', 'preview')` |

---

## Idempotency

The seed file is safe to re-run. At the start of `seed_smoke_test.sql`, a cleanup block removes all records from the previous run, identified by:

- Fixed source entity UUID: `cafecafe-0000-4000-8000-000000000042`
- Fixed org code prefix: `SMOKE_*`
- Fixed country code: `XT`
- Fixed audit trail marker: `metadata->>'smoke_test' = 'true'`

Running the seed a second time will produce the same state as the first run.

---

## Fixed Test Constants

These values are embedded in both seed and validation files so queries can target specific records without relying on auto-generated IDs:

| Constant | Value | Purpose |
|----------|-------|---------|
| Source entity UUID | `cafecafe-0000-4000-8000-000000000042` | Fake FORGE workflow ID (soft reference) |
| Test user UUID | `00000000-0000-0000-0000-000000000099` | Pre-identity placeholder for all user columns |
| Test country code | `XT` | Non-real ISO code reserved for testing |
| Org code prefix | `SMOKE_` | Distinguishes test org records from real data |
| Audit metadata marker | `smoke_test: true` | Cleanup and query targeting |

---

## Platform Architecture Validated

This smoke test confirms the three key architectural principles of the platform backbone:

**1. Source modules own authoring; catalog owns publishing.**
The `source_entity_id` (`cafecafe-...`) exists only as a UUID reference — there is no `workflow` table in this database. The soft reference pattern works as designed.

**2. Governance status and catalog publication status are independent.**
`governance.asset_submissions.governance_status = 'approved'` and `catalog.assets.publication_status = 'ga'` are separate values on separate tables with separate value domains. A submission can be `approved` while the asset is still `preview`.

**3. NFR fields are descriptive metadata, not access control.**
`data_classification`, `contains_pii`, `compliance_tags`, etc. are plain columns with no row-level security or access-control logic attached. Validation 4 confirms they are set and readable by any user who can query the table — actual access control will come from the identity schema (future migration).

---

## Files

```
db/
  sql/          ← DDL files (apply before tests)
    001–004     ← Extensions, schemas, reference stubs
    010         ← Governance core tables
    020         ← Catalog core tables
    README.md
  test/         ← Smoke tests (this directory)
    seed_smoke_test.sql     ← Inserts test data (idempotent)
    validate_smoke_test.sql ← Validation queries + summary assertions
    README.md               ← This file
```
