# DDL Spec: `platform` Schema

> **Status:** DDL-ready design — not yet a runnable migration script.
> **DB target:** PostgreSQL 15+
> **Owner:** Shared / Platform

---

## Design Principles

- `platform.modules` is the authoritative, DB-backed registry of all SigAI modules. The TypeScript static registry (`src/registry/modules.ts`) is the dev-mode approximation; in production, it is seeded from this table.
- `platform.linked_resources` is a **generic cross-entity link pattern** — any entity in any schema can attach informational external links to itself by writing a row here with `(entity_type, entity_id)`. No FK is enforced at DB level for the polymorphic reference.
- `linked_resources` holds informational links (documentation, runbooks, JIRA tickets). It is distinct from `catalog.asset_source_refs`, which holds source-traceability references (where an asset was authored).

---

## Tables

### `platform.modules`

**Purpose:** Authoritative registry of all SigAI platform modules. One row per module. This is the source of truth for nav rendering, permission scoping, module status, and launcher behaviour.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `module_key` | `VARCHAR(100)` | NO | — | UNIQUE | Machine-readable slug, e.g. `catalog`, `forge`, `intake`, `prototype-builder`, `admin` |
| `display_name` | `VARCHAR(200)` | NO | — | — | Full display name, e.g. `FORGE` |
| `short_description` | `VARCHAR(300)` | NO | — | — | One-liner for launcher cards and nav tooltips |
| `description` | `TEXT` | YES | NULL | — | Full description rendered on the module home page |
| `category` | `VARCHAR(50)` | NO | — | CHECK (see values) | `Discovery` \| `Intake` \| `Build` \| `Orchestrate` \| `Govern` |
| `status` | `VARCHAR(20)` | NO | `'coming_soon'` | CHECK (see values) | `active` \| `beta` \| `coming_soon` \| `deprecated` |
| `base_path` | `VARCHAR(200)` | NO | — | — | Frontend route root, e.g. `/catalog`, `/forge` |
| `api_prefix` | `VARCHAR(200)` | YES | NULL | — | Backend API prefix, e.g. `/api/catalog` (NULL until backend exists) |
| `icon_name` | `VARCHAR(100)` | YES | NULL | — | Lucide icon name for UI rendering, e.g. `Database`, `Inbox`, `PenTool` |
| `featured` | `BOOLEAN` | NO | `false` | — | Pin in featured strip on home launcher |
| `available_in_launcher` | `BOOLEAN` | NO | `true` | — | Show in module launcher / quick access panel |
| `nav_emphasis` | `BOOLEAN` | NO | `false` | — | Render with visual emphasis in the main nav (e.g. FORGE) |
| `sort_order` | `SMALLINT` | NO | `0` | CHECK (`sort_order` >= 0) | Display order within category |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Unique Constraints:**
- `module_key`

**Check Constraints:**
- `category IN ('Discovery', 'Intake', 'Build', 'Orchestrate', 'Govern')`
- `status IN ('active', 'beta', 'coming_soon', 'deprecated')`
- `sort_order >= 0`

**Recommended Indexes:**
- `(module_key)` — covered by unique constraint; primary code lookup
- `(category)` — category-grouped launcher queries
- `(status)` — filter active/available modules
- `(featured)` — featured module strip queries

**Seed rows:**

| module_key | display_name | category | status | featured | nav_emphasis |
|------------|-------------|----------|--------|---------|-------------|
| `catalog` | Catalog | Discovery | active | true | false |
| `intake` | Intake | Intake | active | true | false |
| `forge` | FORGE | Build | beta | true | true |
| `prototype-builder` | Prototype Builder | Build | active | true | false |
| `app-builder` | Application Builder | Build | coming_soon | false | false |
| `pipeline` | Pipeline | Orchestrate | coming_soon | false | false |
| `admin` | Admin | Govern | active | false | false |

---

### `platform.linked_resources`

**Purpose:** Generic cross-entity link table. Any platform entity (catalog asset, governance submission, module, etc.) can attach informational external links by writing a row with `(entity_type, entity_id, kind, label, href)`. No FK is enforced on the polymorphic entity reference.

This is a **shared reusable pattern** — module teams do not need their own link tables.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `entity_type` | `VARCHAR(100)` | NO | — | CHECK (see values) | Dotted entity path identifying the owning entity's schema and table, e.g. `catalog.asset`, `governance.submission`, `platform.module` |
| `entity_id` | `UUID` | NO | — | — | UUID of the referenced entity. Soft reference — no DB-level FK; application validates existence before insert |
| `kind` | `VARCHAR(30)` | NO | — | CHECK (see values) | Resource kind: `documentation` \| `source` \| `lineage` \| `runbook` \| `jira` \| `github` \| `confluence` \| `external` |
| `label` | `VARCHAR(300)` | NO | — | — | Display text for the link |
| `href` | `TEXT` | NO | — | — | Fully qualified URL |
| `added_by` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | Who added this link (NULL for system-added links) |
| `added_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `added_by` → `identity.users(id)` ON DELETE SET NULL

**Check Constraints:**
- `entity_type IN ('catalog.asset', 'governance.submission', 'platform.module', 'governance.certification', 'governance.stage_run')` — extend as new entity types are added
- `kind IN ('documentation', 'source', 'lineage', 'runbook', 'jira', 'github', 'confluence', 'external')`
- `href ~ '^https?://'` — must be a well-formed HTTP/S URL

**Recommended Indexes:**
- `(entity_type, entity_id)` — **primary access pattern**: all links for a given entity. This composite index is the most important index on this table.
- `(kind)` — filter by link type across entities
- `(added_by)` — user-contributed links

**Notes on the polymorphic pattern:**

```
entity_type = 'catalog.asset'          →  entity_id references catalog.assets.id
entity_type = 'governance.submission'  →  entity_id references governance.asset_submissions.id
entity_type = 'platform.module'        →  entity_id references platform.modules.id
```

The application layer is responsible for:
1. Validating that `entity_id` exists in the implied table before inserting.
2. Cascading deletes — when a catalog asset is deleted (soft-retired), its linked_resources rows should be cleaned up by the application, not by a DB FK constraint.
3. Keeping the `entity_type` CHECK constraint in sync with the set of valid entity types as new schemas are added.

**Resource kind descriptions:**

| kind | Typical use |
|------|-------------|
| `documentation` | API docs, data dictionary, data catalog page |
| `source` | Source code repository (non-primary; use `asset_source_refs` for primary) |
| `lineage` | Data lineage graph or documentation |
| `runbook` | Operational runbook or incident playbook |
| `jira` | JIRA epic, story, or support ticket |
| `github` | GitHub repository, PR, or issue |
| `confluence` | Confluence page or space |
| `external` | Any other external resource |
