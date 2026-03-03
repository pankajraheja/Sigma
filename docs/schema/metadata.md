# Schema: `metadata`

> **Owner:** Shared / Platform
> **Purpose:** Unified taxonomy and controlled-vocabulary layer. Provides concept schemes, taxonomy terms, tags, and extensible metadata definitions used across all modules. This schema enables new vocabularies to be added without schema changes.

---

## Design Notes

- **Concept schemes** define a named vocabulary (e.g. "Data Classification", "Asset Kind").
- **Taxonomy terms** are the values within a scheme. They can be hierarchical (parent-child) and ordered.
- **Tags** are lightweight, user-contributed labels — informal, not controlled. They complement taxonomy terms for ad-hoc categorisation.
- **Metadata definitions** allow platform administrators to declare additional structured attributes for any entity type, backed either by free text or by a concept scheme (picklist).
- This design allows NFR fields like `data_classification` and `hosting_type` to be stored as term IDs referencing `taxonomy_terms`, keeping the controlled vocabulary extensible and localisation-ready.
- `is_controlled = true` on a scheme means the term list is closed (only admins can add values). `false` means terms can be proposed by contributors.

---

## Tables

### `metadata.concept_schemes`

Named vocabularies. Each scheme groups a set of related terms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | Machine-readable key, e.g. `data_classification`, `asset_kind`, `domain` |
| `name` | VARCHAR(200) | NOT NULL | Human-readable label, e.g. `Data Classification` |
| `description` | TEXT | | Purpose and intended use |
| `is_controlled` | BOOLEAN | NOT NULL, DEFAULT `true` | `true` = closed vocab (admin-only); `false` = open / contributor-extendable |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Seed concept schemes:**

| code | name | is_controlled |
|------|------|---------------|
| `asset_kind` | Asset Kind | true |
| `data_classification` | Data Classification | true |
| `hosting_type` | Hosting Type | true |
| `domain` | Business Domain | true |
| `compliance_tag` | Compliance & Regulatory Tag | true |
| `stage_type` | Governance Stage Type | true |

---

### `metadata.taxonomy_terms`

Individual values within a concept scheme. Supports parent-child hierarchy and explicit ordering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `scheme_id` | UUID | NOT NULL, FK → `metadata.concept_schemes.id` | Which vocabulary this term belongs to |
| `code` | VARCHAR(100) | NOT NULL | Machine-readable key within its scheme, e.g. `confidential` |
| `label` | VARCHAR(200) | NOT NULL | Display label, e.g. `Confidential` |
| `description` | TEXT | | Extended definition or guidance |
| `parent_term_id` | UUID | FK → `metadata.taxonomy_terms.id` | Parent term for hierarchical vocabularies (NULL = top-level) |
| `sort_order` | INT | DEFAULT 0 | Display ordering within scheme |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | Soft-disable without losing historical references |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique constraint:** `(scheme_id, code)`

**Indexes:** `scheme_id`, `parent_term_id`

**Seed term values (by scheme):**

*asset_kind*
| code | label |
|------|-------|
| `dataset` | Dataset |
| `api` | API |
| `report` | Report |
| `model` | Model |
| `dashboard` | Dashboard |
| `pipeline` | Pipeline |
| `template` | Template |
| `skill` | Skill |
| `connector` | Connector |

*data_classification*
| code | label | Notes |
|------|-------|-------|
| `public` | Public | No restrictions |
| `internal` | Internal | Internal use only |
| `confidential` | Confidential | Restricted internal, limited distribution |
| `restricted` | Restricted | Highest sensitivity; need-to-know basis |

*hosting_type*
| code | label |
|------|-------|
| `cloud` | Cloud |
| `on_premise` | On-Premise |
| `hybrid` | Hybrid |
| `saas` | SaaS |

*domain*
| code | label |
|------|-------|
| `banking_finance` | Banking & Finance |
| `risk_compliance` | Risk & Compliance |
| `capital_markets` | Capital Markets |
| `insurance` | Insurance |
| `ai_data_services` | AI & Data Services |
| `tech_infra` | Technology & Infrastructure |
| `hr_people` | HR & People |
| `legal_tax` | Legal & Tax |
| `operations` | Operations |
| `marketing_sales` | Marketing & Sales |

*compliance_tag*
| code | label |
|------|-------|
| `gdpr` | GDPR |
| `soc2` | SOC 2 |
| `iso27001` | ISO 27001 |
| `pci_dss` | PCI-DSS |
| `hipaa` | HIPAA |
| `fca` | FCA |
| `mifid2` | MiFID II |
| `basel3` | Basel III |

---

### `metadata.tags`

Lightweight, informal labels contributed by users. Not part of a controlled vocabulary. Used for ad-hoc discovery and grouping.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `label` | VARCHAR(100) | NOT NULL, UNIQUE | Normalised lowercase label, e.g. `real-time`, `pii-heavy`, `gold-standard` |
| `created_by` | UUID | FK → `identity.users.id` | User who first used this tag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Note:** Tag normalisation (trimming, lowercasing, deduplication) is enforced at the application layer before insert. Tags are reused across assets — inserting an asset tag creates a row in `catalog.asset_tags` referencing an existing `tags.id`.

---

### `metadata.metadata_definitions`

Extensible attribute definitions. Platform and module administrators can declare additional metadata fields for any entity type, with optional picklist backing via a concept scheme.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | Machine-readable key, e.g. `sla_tier`, `geographic_restriction` |
| `label` | VARCHAR(200) | NOT NULL | Display label |
| `description` | TEXT | | Guidance for data entry |
| `applies_to_entity_type` | VARCHAR(100) | NOT NULL | Target entity, e.g. `catalog.asset`, `governance.submission` |
| `data_type` | ENUM | NOT NULL | `text` \| `number` \| `boolean` \| `date` \| `url` \| `picklist` \| `multi_picklist` |
| `is_required` | BOOLEAN | NOT NULL, DEFAULT `false` | Whether this attribute is mandatory |
| `concept_scheme_id` | UUID | FK → `metadata.concept_schemes.id` | For `picklist` / `multi_picklist` types — which scheme supplies the values |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Note:** For `text`, `number`, `boolean`, `date`, and `url` types, `concept_scheme_id` is NULL. For `picklist` and `multi_picklist`, `concept_scheme_id` must point to a scheme with `is_controlled = true`.

---

### `metadata.metadata_picklist_values`

Override or supplement picklist values for a given metadata definition when the backing concept scheme terms need display-context-specific labels or ordering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `definition_id` | UUID | NOT NULL, FK → `metadata.metadata_definitions.id` | |
| `term_id` | UUID | NOT NULL, FK → `metadata.taxonomy_terms.id` | The term this entry overrides display for |
| `display_label` | VARCHAR(200) | | Override label for this specific definition context |
| `sort_order` | INT | DEFAULT 0 | Display ordering in the picker |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | |

**Unique constraint:** `(definition_id, term_id)`

**Note:** This table is optional scaffolding for context-sensitive picklist rendering. If no rows exist for a `definition_id`, the application falls back to `taxonomy_terms.label` and `taxonomy_terms.sort_order`.

---

## Key Relationships

```
concept_schemes ──< taxonomy_terms (scheme_id)
taxonomy_terms ──< taxonomy_terms (parent_term_id, self-referential hierarchy)
tags (standalone — referenced by catalog.asset_tags)
metadata_definitions >── concept_schemes (concept_scheme_id, nullable)
metadata_picklist_values >── metadata_definitions
metadata_picklist_values >── taxonomy_terms
```

`taxonomy_terms` rows are referenced as foreign keys from:
- `governance.asset_submissions.data_classification_term_id`
- `governance.asset_submissions.hosting_type_term_id`
- `catalog.assets.asset_kind_term_id`
- `catalog.assets.data_classification_term_id`
- `catalog.assets.hosting_type_term_id`
- `catalog.asset_classifications.term_id`

---

## What is Shared vs Module-Owned

| Concern | Owner |
|---------|-------|
| Concept scheme definitions | `metadata` — shared; modules may register additional schemes |
| Core term lists (asset_kind, data_classification, etc.) | `metadata` — platform-managed seed data |
| Tag creation | `metadata` — shared; any user with contribute permissions can add tags |
| Metadata attribute definitions | `metadata` — shared; module admins register entity-specific definitions |
| Picklist rendering overrides | `metadata` — shared |
| Entity-specific attribute values | Source modules or `catalog` — stored as structured JSON on the entity or in a separate EAV table |
