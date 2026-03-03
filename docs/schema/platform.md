# Schema: `platform`

> **Owner:** Shared / Platform
> **Purpose:** Module registry and shared link management. Provides the canonical record of all SigAI modules and a generic linked-resource table used to attach external references (documentation, runbooks, JIRA tickets, GitHub repos) to any platform entity.

---

## Design Notes

- `platform.modules` is the authoritative registry of all modules in SigAI. The frontend module registry (`src/registry/modules.ts`) is derived from this table in production; the static TypeScript file is the design-time and dev-mode approximation.
- `platform.linked_resources` is a **generic cross-entity link table**. Any entity type (catalog asset, governance submission, module) can have linked resources. The `entity_type` + `entity_id` pair is a polymorphic reference — no FK is enforced at the DB level; the application layer validates that the referenced entity exists.
- `linked_resources` is distinct from `catalog.asset_source_refs`:
  - `linked_resources` = informational external links (docs, runbooks, JIRA, etc.)
  - `catalog.asset_source_refs` = source traceability (where the asset was authored)

---

## Tables

### `platform.modules`

The canonical registry of all platform modules. Each row represents one SigAI module.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `module_key` | VARCHAR(100) | NOT NULL, UNIQUE | Machine-readable slug, e.g. `catalog`, `forge`, `intake`, `prototype-builder`, `app-builder`, `pipeline`, `admin` |
| `display_name` | VARCHAR(200) | NOT NULL | Full display name, e.g. `Catalog` |
| `short_description` | VARCHAR(300) | NOT NULL | One-liner for launcher cards and nav tooltips |
| `description` | TEXT | | Full description for the module home page |
| `category` | VARCHAR(100) | NOT NULL | Grouping: `Discovery` \| `Build` \| `Intake` \| `Orchestrate` \| `Govern` |
| `status` | ENUM | NOT NULL, DEFAULT `coming_soon` | `active` \| `beta` \| `coming_soon` \| `deprecated` |
| `base_path` | VARCHAR(200) | NOT NULL | Frontend route root, e.g. `/catalog` |
| `api_prefix` | VARCHAR(200) | | Backend API prefix, e.g. `/api/catalog` (NULL until backend exists) |
| `icon_name` | VARCHAR(100) | | Lucide icon name for UI rendering, e.g. `Database`, `Inbox` |
| `featured` | BOOLEAN | NOT NULL, DEFAULT `false` | Shown in featured strip on home launcher |
| `available_in_launcher` | BOOLEAN | NOT NULL, DEFAULT `true` | Shown in the module launcher / quick access panel |
| `nav_emphasis` | BOOLEAN | NOT NULL, DEFAULT `false` | If true, render with visual emphasis in the main nav (e.g. FORGE) |
| `sort_order` | INT | DEFAULT 0 | Display order within category |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `module_key`, `category`, `status`

**Seed rows (matches frontend registry):**

| module_key | display_name | category | status | featured |
|------------|-------------|----------|--------|---------|
| `catalog` | Catalog | Discovery | active | true |
| `intake` | Intake | Intake | active | true |
| `forge` | FORGE | Build | beta | true |
| `prototype-builder` | Prototype Builder | Build | active | true |
| `app-builder` | Application Builder | Build | coming_soon | false |
| `pipeline` | Pipeline | Orchestrate | coming_soon | false |
| `admin` | Admin | Govern | active | false |

---

### `platform.linked_resources`

Generic external link records attached to any platform entity (catalog asset, governance submission, module, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `entity_type` | VARCHAR(100) | NOT NULL | Dotted entity path, e.g. `catalog.asset`, `governance.submission`, `platform.module` |
| `entity_id` | UUID | NOT NULL | UUID of the referenced entity |
| `kind` | ENUM | NOT NULL | `documentation` \| `source` \| `lineage` \| `runbook` \| `jira` \| `github` \| `confluence` \| `external` |
| `label` | VARCHAR(300) | NOT NULL | Display text for the link |
| `href` | TEXT | NOT NULL | Fully qualified URL |
| `added_by` | UUID | FK → `identity.users.id` | Who added this link |
| `added_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `(entity_type, entity_id)` — composite index for entity-scoped queries

**Note on polymorphic reference:** `entity_type` + `entity_id` form a soft polymorphic reference. There is no database-level FK enforcement across entity types. The application layer is responsible for validating that `entity_id` exists in the table implied by `entity_type` before insert.

**Resource kind descriptions:**

| kind | Typical use |
|------|-------------|
| `documentation` | API docs, data dictionary, user guide |
| `source` | Source code repository |
| `lineage` | Data lineage graph or documentation |
| `runbook` | Operational runbook or playbook |
| `jira` | JIRA epic, story, or ticket |
| `github` | GitHub repository, PR, or issue |
| `confluence` | Confluence page or space |
| `external` | Any other external resource |

---

## Key Relationships

```
platform.modules ←── identity.user_scope_bindings (scope_ref_id when scope_type = 'module')
platform.modules ←── governance.asset_submissions (source_module_id)
platform.modules ←── catalog.assets (source_module_id)
platform.linked_resources → identity.users (added_by)
platform.linked_resources.entity_id → (any entity — polymorphic, soft reference)
```

---

## What is Shared vs Module-Owned

| Concern | Owner |
|---------|-------|
| Module definitions | `platform` — shared; platform administrators manage entries |
| Module status and flags | `platform` — shared |
| External link records for any entity | `platform` — shared |
| Frontend static registry (`src/registry/modules.ts`) | Frontend concern — mirrors DB, used for dev and SSR |
| Module-internal configuration | Each module's own schema |
