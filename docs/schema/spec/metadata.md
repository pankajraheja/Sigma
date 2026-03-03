# DDL Spec: `metadata` Schema

> **Status:** DDL-ready design — not yet a runnable migration script.
> **DB target:** PostgreSQL 15+
> **Owner:** Shared / Platform

---

## Design Principles

- `metadata` is the unified taxonomy and controlled-vocabulary layer for all schemas.
- Concept schemes define named vocabularies. Taxonomy terms are the values within a scheme.
- Using taxonomy terms (instead of hard-coded ENUMs for every vocabulary) means new classifications can be added without schema migrations.
- **Exception:** Core NFR fields (`data_classification`, `hosting_type`, `audience_type`, `business_criticality`) are stored as VARCHAR with CHECK constraints on `catalog.assets` and `governance.asset_submissions` for query performance. Those fields are informed by the taxonomy terms in this schema but are denormalised to avoid joins on high-frequency catalog queries.
- Tags are user-contributed, informal, and not controlled. They complement taxonomy terms.
- Metadata definitions allow module-level extensibility of entity attributes without per-module schema changes.

---

## Tables

### `metadata.concept_schemes`

**Purpose:** Named vocabulary definitions. Each concept scheme groups a set of related taxonomy terms. Examples: "Data Classification" (closed vocab), "Business Domain" (closed), "Compliance Tag" (closed), "Asset Kind" (closed).

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `code` | `VARCHAR(100)` | NO | — | UNIQUE | Machine key, e.g. `data_classification`, `asset_kind`, `domain`, `compliance_tag` |
| `name` | `VARCHAR(200)` | NO | — | — | Display label, e.g. `Data Classification` |
| `description` | `TEXT` | YES | NULL | — | Scope and intended use of this vocabulary |
| `is_controlled` | `BOOLEAN` | NO | `true` | — | `true` = closed vocab (admin-only term management); `false` = open (contributor-extendable) |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Unique Constraints:**
- `code`

**Recommended Indexes:**
- `(code)` — covered by unique constraint; primary lookup key

**Seed concept schemes:**

| code | name | is_controlled |
|------|------|---------------|
| `asset_kind` | Asset Kind | true |
| `data_classification` | Data Classification | true |
| `hosting_type` | Hosting Type | true |
| `domain` | Business Domain | true |
| `compliance_tag` | Compliance & Regulatory Tag | true |

---

### `metadata.taxonomy_terms`

**Purpose:** Individual values within a concept scheme. Supports parent-child hierarchy for nested vocabularies and explicit sort ordering. These are the canonical term records for all controlled vocabulary values used across SigAI.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `scheme_id` | `UUID` | NO | — | FK → `metadata.concept_schemes(id)` ON DELETE RESTRICT | Which vocabulary this term belongs to |
| `code` | `VARCHAR(100)` | NO | — | — | Machine key within its scheme, e.g. `confidential`, `cloud`, `risk_compliance` |
| `label` | `VARCHAR(200)` | NO | — | — | Display label, e.g. `Confidential`, `Cloud`, `Risk & Compliance` |
| `description` | `TEXT` | YES | NULL | — | Extended definition or usage guidance |
| `parent_term_id` | `UUID` | YES | NULL | FK → `metadata.taxonomy_terms(id)` ON DELETE RESTRICT | Parent term for hierarchical vocabularies; NULL = top-level |
| `sort_order` | `SMALLINT` | NO | `0` | CHECK (`sort_order` >= 0) | Display ordering within the scheme |
| `is_active` | `BOOLEAN` | NO | `true` | — | Soft-disable without losing historical FK references |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `scheme_id` → `metadata.concept_schemes(id)` ON DELETE RESTRICT
- `parent_term_id` → `metadata.taxonomy_terms(id)` ON DELETE RESTRICT

**Unique Constraints:**
- `(scheme_id, code)` — code is unique within a scheme, not globally

**Check Constraints:**
- `sort_order >= 0`
- `id <> parent_term_id` — prevent self-referencing loops

**Recommended Indexes:**
- `(scheme_id)` — all terms for a scheme (picklist population)
- `(scheme_id, code)` — covered by unique constraint; term lookup by code
- `(parent_term_id)` — hierarchical child-term queries
- `(is_active)` — filter active terms

**Seed terms (selected):**

*scheme: `data_classification`*
| code | label | sort_order |
|------|-------|-----------|
| `public` | Public | 1 |
| `internal` | Internal | 2 |
| `confidential` | Confidential | 3 |
| `restricted` | Restricted | 4 |

*scheme: `hosting_type`*
| code | label | sort_order |
|------|-------|-----------|
| `cloud` | Cloud | 1 |
| `on_premise` | On-Premise | 2 |
| `hybrid` | Hybrid | 3 |
| `saas` | SaaS | 4 |

*scheme: `asset_kind`*
| code | label | sort_order |
|------|-------|-----------|
| `dataset` | Dataset | 1 |
| `api` | API | 2 |
| `model` | Model | 3 |
| `dashboard` | Dashboard | 4 |
| `report` | Report | 5 |
| `pipeline` | Pipeline | 6 |
| `template` | Template | 7 |
| `skill` | Skill | 8 |
| `connector` | Connector | 9 |

*scheme: `compliance_tag`*
| code | label |
|------|-------|
| `gdpr` | GDPR |
| `sox` | SOX |
| `pci_dss` | PCI-DSS |
| `iso27001` | ISO 27001 |
| `soc2` | SOC 2 Type II |
| `hipaa` | HIPAA |
| `fca` | FCA |
| `mifid2` | MiFID II |
| `basel3` | Basel III |

---

### `metadata.tags`

**Purpose:** Lightweight, user-contributed, informal labels. Not part of a controlled vocabulary. Used for ad-hoc discovery and grouping. Tags are reused across assets via `catalog.asset_tags`.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `label` | `VARCHAR(100)` | NO | — | UNIQUE | Normalised label — stored lowercase, trimmed, e.g. `real-time`, `gold-standard`, `pii-heavy` |
| `created_by` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | User who first created this tag |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `created_by` → `identity.users(id)` ON DELETE SET NULL

**Unique Constraints:**
- `label`

**Check Constraints:**
- `label = lower(trim(label))` — enforce normalisation at DB level; application should also normalise before insert

**Recommended Indexes:**
- `(label)` — covered by unique constraint; used for tag lookup and autocomplete prefix queries. Consider a trigram index (`pg_trgm` extension) for `ILIKE` autocomplete: `GIN index on label gin_trgm_ops`

---

### `metadata.metadata_definitions`

**Purpose:** Extensible attribute definitions for platform entities. Platform and module administrators declare additional structured metadata fields for entity types (e.g. `catalog.asset`, `governance.submission`). Backed by either free-form types or a concept scheme for picklist types.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `code` | `VARCHAR(100)` | NO | — | UNIQUE | Machine key, e.g. `sla_tier`, `geographic_restriction`, `data_owner_email` |
| `label` | `VARCHAR(200)` | NO | — | — | Display label |
| `description` | `TEXT` | YES | NULL | — | Guidance for data entry |
| `applies_to_entity_type` | `VARCHAR(100)` | NO | — | — | Target entity dotted path, e.g. `catalog.asset`, `governance.submission` |
| `data_type` | `VARCHAR(20)` | NO | — | CHECK (see values) | `text` \| `number` \| `boolean` \| `date` \| `url` \| `picklist` \| `multi_picklist` |
| `is_required` | `BOOLEAN` | NO | `false` | — | Whether this attribute is mandatory for the entity type |
| `concept_scheme_id` | `UUID` | YES | NULL | FK → `metadata.concept_schemes(id)` ON DELETE RESTRICT | Required for `picklist` / `multi_picklist` types; NULL for others |
| `module_id` | `UUID` | YES | NULL | FK → `platform.modules(id)` ON DELETE CASCADE | Owning module (NULL = platform-level definition) |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `concept_scheme_id` → `metadata.concept_schemes(id)` ON DELETE RESTRICT
- `module_id` → `platform.modules(id)` ON DELETE CASCADE

**Unique Constraints:**
- `code`

**Check Constraints:**
- `data_type IN ('text', 'number', 'boolean', 'date', 'url', 'picklist', 'multi_picklist')`
- `(data_type IN ('picklist', 'multi_picklist') AND concept_scheme_id IS NOT NULL) OR (data_type NOT IN ('picklist', 'multi_picklist'))` — picklist types require a scheme

**Recommended Indexes:**
- `(applies_to_entity_type)` — load all definitions for an entity type
- `(module_id)` — module-owned definitions

---

### `metadata.metadata_picklist_values`

**Purpose:** Optional context-specific overrides for picklist rendering. When a `metadata_definition` of type `picklist` or `multi_picklist` needs a different display label or ordering than the underlying `taxonomy_terms`, this table provides the override. If no rows exist for a `definition_id`, the application falls back to `taxonomy_terms.label` and `taxonomy_terms.sort_order`.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `definition_id` | `UUID` | NO | — | FK → `metadata.metadata_definitions(id)` ON DELETE CASCADE | |
| `term_id` | `UUID` | NO | — | FK → `metadata.taxonomy_terms(id)` ON DELETE CASCADE | The term this entry controls display for |
| `display_label` | `VARCHAR(200)` | YES | NULL | — | Override display label (NULL = use taxonomy_terms.label) |
| `sort_order` | `SMALLINT` | NO | `0` | CHECK (`sort_order` >= 0) | Override display ordering (replaces taxonomy_terms.sort_order for this definition) |
| `is_active` | `BOOLEAN` | NO | `true` | — | Soft-exclude a term from a specific definition's picker |

**Primary Key:** `id`

**Foreign Keys:**
- `definition_id` → `metadata.metadata_definitions(id)` ON DELETE CASCADE
- `term_id` → `metadata.taxonomy_terms(id)` ON DELETE CASCADE

**Unique Constraints:**
- `(definition_id, term_id)` — one override entry per term per definition

**Check Constraints:**
- `sort_order >= 0`

**Recommended Indexes:**
- `(definition_id)` — load all picklist values for a definition (most common query)
