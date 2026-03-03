# DDL Spec: `org` Schema

> **Status:** DDL-ready design — not yet a runnable migration script.
> **DB target:** PostgreSQL 15+
> **Owner:** Shared / Platform

---

## Design Principles

- Organisational dimensions are **first-class normalised reference data**, not free-text strings or JSON.
- All five tables support optional self-referencing hierarchy (`parent_*_id`) for nested structures. Depth is application-controlled.
- `is_active` enables soft-disable without deleting records that are historically referenced.
- These tables are low-write, high-read reference data. Changes are infrequent and managed by platform administrators.
- All five tables are referenced as FK columns from `governance.asset_submissions`, `catalog.assets`, and `identity.user_scope_bindings`.

---

## Tables

### `org.countries`

**Purpose:** ISO-standard country reference data. The canonical list of countries the platform recognises for org-scoping, NFR residency declarations, and geographic tagging.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `iso_alpha2` | `CHAR(2)` | NO | — | UNIQUE | ISO 3166-1 alpha-2 code, e.g. `GB`, `US`, `SG` |
| `iso_alpha3` | `CHAR(3)` | NO | — | UNIQUE | ISO 3166-1 alpha-3 code, e.g. `GBR`, `USA`, `SGP` |
| `name` | `VARCHAR(200)` | NO | — | — | English short name, e.g. `United Kingdom` |
| `region` | `VARCHAR(50)` | YES | NULL | CHECK (see values) | Geographic grouping: `EMEA` \| `APAC` \| `AMER` \| `GLOBAL` |
| `is_active` | `BOOLEAN` | NO | `true` | — | Soft-disable for inactive/unsupported countries |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Unique Constraints:**
- `iso_alpha2`
- `iso_alpha3`

**Check Constraints:**
- `length(iso_alpha2) = 2` (enforced by CHAR(2) type)
- `length(iso_alpha3) = 3` (enforced by CHAR(3) type)
- `region IN ('EMEA', 'APAC', 'AMER', 'GLOBAL')` (when not NULL)

**Recommended Indexes:**
- `(iso_alpha2)` — covered by unique constraint; primary code lookup
- `(region)` — regional grouping queries
- `(is_active)` — filter active countries in pickers

---

### `org.opcos`

**Purpose:** Operating companies (OpCos) — legal or operational entities within the group. Supports parent-child hierarchy for subsidiary modelling. Referenced as an FK on assets and submissions to scope data ownership.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `code` | `VARCHAR(50)` | NO | — | UNIQUE | Short machine-readable code, e.g. `APAC_BANKING`, `UK_INSURANCE` |
| `name` | `VARCHAR(200)` | NO | — | — | Display name, e.g. `Asia-Pacific Banking Division` |
| `parent_opco_id` | `UUID` | YES | NULL | FK → `org.opcos(id)` ON DELETE RESTRICT | Parent entity; NULL = top-level OpCo |
| `primary_country_id` | `UUID` | YES | NULL | FK → `org.countries(id)` ON DELETE SET NULL | Country where this OpCo is primarily domiciled |
| `is_active` | `BOOLEAN` | NO | `true` | — | |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `parent_opco_id` → `org.opcos(id)` ON DELETE RESTRICT — prevent deleting a parent while children exist
- `primary_country_id` → `org.countries(id)` ON DELETE SET NULL

**Unique Constraints:**
- `code`

**Check Constraints:**
- `id <> parent_opco_id` — prevent self-referencing loops

**Recommended Indexes:**
- `(parent_opco_id)` — find children of a given OpCo
- `(primary_country_id)` — filter by domicile country
- `(is_active)` — filter active OpCos

**Notes:** The hierarchy depth is not enforced at the DB level. Application layer should enforce a maximum depth (e.g. 4 levels) and should detect cycles using a recursive CTE before inserting. Consider a closure table or materialized path for deep hierarchy traversal in reporting.

---

### `org.function_groups`

**Purpose:** Functional groupings representing business capabilities or organisational functions (e.g. Risk Management, AI & Data Services). Supports parent-child hierarchy for nested capability modelling.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `code` | `VARCHAR(100)` | NO | — | UNIQUE | Machine key, e.g. `RISK_MGMT`, `AI_DATA_SVC`, `FIN_REPORTING` |
| `name` | `VARCHAR(200)` | NO | — | — | Display name, e.g. `Risk Management` |
| `description` | `TEXT` | YES | NULL | — | What this function group covers |
| `parent_function_group_id` | `UUID` | YES | NULL | FK → `org.function_groups(id)` ON DELETE RESTRICT | Parent group; NULL = top-level |
| `is_active` | `BOOLEAN` | NO | `true` | — | |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `parent_function_group_id` → `org.function_groups(id)` ON DELETE RESTRICT

**Unique Constraints:**
- `code`

**Check Constraints:**
- `id <> parent_function_group_id` — prevent self-referencing loops

**Recommended Indexes:**
- `(parent_function_group_id)` — child function group queries
- `(is_active)` — active picker queries

**Seed values:**

| code | name |
|------|------|
| `RISK_MGMT` | Risk Management |
| `FIN_REPORTING` | Financial Reporting |
| `AI_DATA_SVC` | AI & Data Services |
| `LEGAL_COMPLIANCE` | Legal & Compliance |
| `IT_INFRA` | Technology & Infrastructure |
| `HR_PEOPLE` | HR & People |
| `OPERATIONS` | Operations |
| `MARKETING` | Marketing & Sales |
| `PRODUCT` | Product Management |

---

### `org.industry_sectors`

**Purpose:** Industry sector classification. Used to tag assets with the sector they serve. Supports hierarchy for sub-sector modelling (e.g. `BANKING` → `RETAIL_BANKING`).

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `code` | `VARCHAR(100)` | NO | — | UNIQUE | Machine key, e.g. `BANKING`, `INSURANCE`, `CAPITAL_MARKETS` |
| `name` | `VARCHAR(200)` | NO | — | — | Display name, e.g. `Banking`, `Insurance` |
| `description` | `TEXT` | YES | NULL | — | |
| `parent_sector_id` | `UUID` | YES | NULL | FK → `org.industry_sectors(id)` ON DELETE RESTRICT | Parent sector; NULL = top-level |
| `is_active` | `BOOLEAN` | NO | `true` | — | |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `parent_sector_id` → `org.industry_sectors(id)` ON DELETE RESTRICT

**Unique Constraints:**
- `code`

**Check Constraints:**
- `id <> parent_sector_id` — prevent self-referencing loops

**Recommended Indexes:**
- `(parent_sector_id)` — sector hierarchy queries
- `(is_active)` — active picker queries

**Seed values:**

| code | name | parent |
|------|------|--------|
| `BANKING` | Banking | — |
| `RETAIL_BANKING` | Retail Banking | `BANKING` |
| `CORPORATE_BANKING` | Corporate Banking | `BANKING` |
| `INSURANCE` | Insurance | — |
| `LIFE_INSURANCE` | Life Insurance | `INSURANCE` |
| `GENERAL_INSURANCE` | General Insurance | `INSURANCE` |
| `CAPITAL_MARKETS` | Capital Markets | — |
| `WEALTH_MGMT` | Wealth Management | — |
| `CROSS_SECTOR` | Cross-Sector / Global | — |

---

### `org.service_offerings`

**Purpose:** Specific services or products the organisation delivers. A service offering typically belongs to a function group and may target a specific industry sector. Used to scope assets to the service they support.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `code` | `VARCHAR(100)` | NO | — | UNIQUE | Machine key, e.g. `FRAUD_DETECT`, `CREDIT_RISK`, `NLP_PLATFORM` |
| `name` | `VARCHAR(200)` | NO | — | — | Display name, e.g. `Fraud Detection`, `Credit Risk Analytics` |
| `description` | `TEXT` | YES | NULL | — | |
| `function_group_id` | `UUID` | YES | NULL | FK → `org.function_groups(id)` ON DELETE SET NULL | Primary owning function group |
| `industry_sector_id` | `UUID` | YES | NULL | FK → `org.industry_sectors(id)` ON DELETE SET NULL | Target sector (NULL = cross-sector) |
| `is_active` | `BOOLEAN` | NO | `true` | — | |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `function_group_id` → `org.function_groups(id)` ON DELETE SET NULL
- `industry_sector_id` → `org.industry_sectors(id)` ON DELETE SET NULL

**Unique Constraints:**
- `code`

**Recommended Indexes:**
- `(function_group_id)` — service offerings for a function
- `(industry_sector_id)` — sector-specific offerings
- `(is_active)` — active picker queries
