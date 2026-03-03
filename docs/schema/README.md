# SigAI Platform — Schema Design Overview

> **Status:** Design draft — no migrations, no ORM, no backend code generated yet.

---

## Purpose

This directory contains the schema design for the **Sigma AI Workspace (SigAI)** platform.
The schemas are organised into shared schemas (cross-cutting concerns) and module-specific schemas (owned by a single module).

---

## Architecture Principles

| Principle | Decision |
|-----------|----------|
| **Catalog is a published registry** | Catalog stores approved, discoverable representations of assets. It is not an authoring surface. |
| **Source modules own authoring** | FORGE, Prototype Builder, Application Builder, and Intake each own asset creation and internal lifecycle. |
| **Governance owns promotion** | Shared governance handles submission, review, certification, and promotion to Catalog. |
| **NFRs are informational** | Data classification, PII, hosting type, retention, SLA, and client-facing flags are governance inputs and metadata — not access-control rules. |
| **Access control is identity-based** | Permissions are derived from identity roles and scope bindings, not from NFR field values. |
| **Org dimensions are first-class** | Country, OpCo, function group, industry sector, and service offering are normalised reference tables, not free-text strings. |
| **UUIDs everywhere** | All primary keys are UUID v4. |
| **Source traceability is explicit** | Every catalog asset carries `source_module_id`, `source_entity_type`, and `source_entity_id` to trace back to its origin. |

---

## Schema Inventory

| Schema | Owner | Purpose |
|--------|-------|---------|
| `identity` | Shared / Platform | Users, roles, permissions, scope bindings |
| `org` | Shared / Platform | Organisational reference data |
| `metadata` | Shared / Platform | Taxonomy, controlled vocabularies, tags |
| `platform` | Shared / Platform | Module registry, linked resources |
| `governance` | Shared / Governance | Submission pipeline, reviews, promotions, audit |
| `catalog` | Catalog module | Published asset registry |

---

## Cross-Schema Dependency Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SHARED SCHEMAS                               │
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│  │  identity   │   │     org     │   │  metadata   │              │
│  │─────────────│   │─────────────│   │─────────────│              │
│  │ users       │   │ countries   │   │concept_schem│              │
│  │ roles       │   │ opcos       │   │taxonomy_term│              │
│  │ permissions │   │func_groups  │   │ tags        │              │
│  │ user_roles  │   │ind_sectors  │   │metadata_def │              │
│  │ scope_binds │   │svc_offerings│   │picklist_vals│              │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │
│         │                 │                  │                      │
│         └─────────────────┼──────────────────┘                     │
│                           │ (all shared schemas referenced below)   │
│                    ┌──────▼──────┐                                  │
│                    │  platform   │                                  │
│                    │─────────────│                                  │
│                    │ modules     │                                  │
│                    │linked_resrc │                                  │
│                    └──────┬──────┘                                  │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
            ┌───────────────┴──────────────┐
            │                              │
   ┌────────▼────────┐          ┌──────────▼──────────┐
   │   governance    │          │       catalog        │
   │─────────────────│  ──────► │──────────────────────│
   │ stage_configs   │ promotes │ assets               │
   │ asset_submissns │          │ asset_versions       │
   │ stage_runs      │          │ asset_classifications│
   │ reviews         │          │ asset_tags           │
   │ promotions      │          │ asset_source_refs    │
   │ certifications  │          │                      │
   │ audit_trail     │          └──────────────────────┘
   └─────────────────┘
```

---

## Status Lifecycles

### Governance Submission Status
Tracks the approval pipeline for an asset submitted from a source module.

```
pending → in_review → approved → [promotion to catalog]
                  └──► rejected
                  └──► withdrawn  (submitter action, any time)
```

### Catalog Publication Status
Tracks the published state of an asset in the Catalog.
This is **distinct** from governance status and from source-module internal status.

```
preview → ga → deprecated → retired
```

| Value | Meaning |
|-------|---------|
| `preview` | Visible to permissioned users; not broadly promoted |
| `ga` | Generally available; fully promoted and discoverable |
| `deprecated` | Still accessible; marked for retirement; discourage new use |
| `retired` | No longer active; archived |

---

## Key Design Decisions

### 1. Three Distinct Status Axes
Every asset has up to three independent status values:

| Axis | Where | Who owns it |
|------|-------|-------------|
| Source-module status | Source module DB (FORGE, Intake, etc.) | Source module |
| Governance status | `governance.asset_submissions.governance_status` | Governance |
| Catalog publication status | `catalog.assets.publication_status` | Catalog / Governance |

### 2. NFRs Live in Two Places
NFR fields are captured first on `governance.asset_submissions` (as governance inputs during review), then denormalised onto `catalog.assets` when the asset is promoted. This keeps a clean audit trail while making catalog queries efficient.

NFR fields:
- `data_classification_term_id` → references `metadata.taxonomy_terms`
- `hosting_type_term_id` → references `metadata.taxonomy_terms`
- `contains_pii` BOOLEAN
- `is_client_facing` BOOLEAN
- `sla_description` TEXT
- `retention_policy` TEXT
- `compliance_tag_ids` UUID[] (references taxonomy terms)

### 3. Org Dimensions as Foreign Keys
All five org dimensions are normalised tables. Assets carry FK references, not free-text strings.

| Dimension | Table |
|-----------|-------|
| Country | `org.countries` |
| OpCo | `org.opcos` |
| Function Group | `org.function_groups` |
| Industry Sector | `org.industry_sectors` |
| Service Offering | `org.service_offerings` |

### 4. Taxonomy is Unified
All controlled vocabularies (asset kind, data classification, hosting type, domain, compliance tags) are stored as `metadata.taxonomy_terms` under named `metadata.concept_schemes`. This allows new vocabularies to be added without schema changes.

### 5. Source Traceability
Every `catalog.asset` carries three source fields:

```
source_module_id    → platform.modules.id
source_entity_type  → e.g. 'dataset', 'api', 'model'
source_entity_id    → UUID of the record in the source module's DB
```

A unique constraint on `(source_module_id, source_entity_type, source_entity_id)` ensures one catalog entry per source entity.

---

## Shared Enum Reference

### `identity` — user status
`active` | `suspended` | `deprovisioned`

### `identity` — scope type
`global` | `module` | `country` | `opco` | `function_group`

### `platform` — module status
`active` | `beta` | `coming_soon` | `deprecated`

### `governance` — governance status
`pending` | `in_review` | `approved` | `rejected` | `withdrawn`

### `governance` — stage run status
`pending` | `in_progress` | `passed` | `failed` | `skipped`

### `governance` — review decision
`approve` | `reject` | `request_changes` | `defer`

### `catalog` — publication status
`preview` | `ga` | `deprecated` | `retired`

### `platform.linked_resources` — resource kind
`documentation` | `source` | `lineage` | `runbook` | `jira` | `github` | `confluence` | `external`

---

## Taxonomy Term Values (Seed Data)

These are the expected seed values per concept scheme. They are stored as `metadata.taxonomy_terms` rows, not hard-coded enums, to allow extension without schema changes.

| Scheme code | Values |
|-------------|--------|
| `asset_kind` | Dataset, API, Report, Model, Dashboard, Pipeline, Template, Skill, Connector |
| `data_classification` | Public, Internal, Confidential, Restricted |
| `hosting_type` | Cloud, On-Premise, Hybrid, SaaS |
| `domain` | Banking & Finance, Risk & Compliance, Capital Markets, Insurance, AI & Data Services, Technology & Infrastructure, HR & People, Legal & Tax, Operations, Marketing & Sales |
| `compliance_tag` | GDPR, SOC 2, ISO 27001, PCI-DSS, HIPAA, FCA, MiFID II, Basel III |

---

## What is Shared vs Module-Owned

| Concern | Shared | Module-owned |
|---------|--------|-------------|
| Users, roles, permissions | `identity` | — |
| Org reference data | `org` | — |
| Taxonomy / controlled vocab | `metadata` | — |
| Module registry | `platform` | — |
| Linked resources | `platform` | — |
| Submission & review pipeline | `governance` | — |
| Certifications | `governance` | — |
| Promotion decisions | `governance` | — |
| Audit trail | `governance` | — |
| Published asset registry | — | `catalog` |
| Asset versioning | — | `catalog` |
| Asset source references | — | `catalog` |
| Authoring lifecycle | — | Source module (FORGE, Intake, etc.) |

---

## Files in This Directory

| File | Schema |
|------|--------|
| [identity.md](identity.md) | `identity` schema |
| [org.md](org.md) | `org` schema |
| [metadata.md](metadata.md) | `metadata` schema |
| [platform.md](platform.md) | `platform` schema |
| [governance.md](governance.md) | `governance` schema |
| [catalog.md](catalog.md) | `catalog` schema |
