# Schema: `org`

> **Owner:** Shared / Platform
> **Purpose:** Normalised reference tables for organisational dimensions. These are used as first-class foreign keys on assets, submissions, and any entity that needs organisational scope. Free-text org fields are not permitted on any entity that references this schema.

---

## Design Notes

- All org tables support **soft hierarchy** via optional self-referencing `parent_*_id` columns. This allows modelling OpCo subsidiaries, nested function groups, and sector sub-categories without mandating a tree structure for simpler setups.
- All tables have `is_active` to support soft-disable without deleting records that are referenced by historical data.
- `service_offerings` can optionally anchor to both a `function_group` and an `industry_sector`, reflecting the matrix nature of service portfolios.
- These tables are **reference data** — changes are infrequent and managed by platform administrators, not end users.

---

## Tables

### `org.countries`

ISO-standard country reference. The canonical list of countries the platform operates in or classifies assets against.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `iso_alpha2` | CHAR(2) | NOT NULL, UNIQUE | ISO 3166-1 alpha-2 code, e.g. `GB` |
| `iso_alpha3` | CHAR(3) | NOT NULL, UNIQUE | ISO 3166-1 alpha-3 code, e.g. `GBR` |
| `name` | VARCHAR(200) | NOT NULL | English short name, e.g. `United Kingdom` |
| `region` | VARCHAR(100) | | Geographic region grouping, e.g. `EMEA`, `APAC`, `AMER`, `Global` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `iso_alpha2`, `iso_alpha3`, `region`

---

### `org.opcos`

Operating companies (OpCos) — legal or operational entities within the group. Supports parent-child hierarchy for subsidiary modelling.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Short machine-readable code, e.g. `APAC-BANKING` |
| `name` | VARCHAR(200) | NOT NULL | Display name, e.g. `Asia-Pacific Banking Division` |
| `parent_opco_id` | UUID | FK → `org.opcos.id` | Parent entity (NULL = top-level) |
| `primary_country_id` | UUID | FK → `org.countries.id` | Where this OpCo is primarily domiciled |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `code`, `parent_opco_id`, `primary_country_id`

**Relationship notes:**
- An OpCo with `parent_opco_id = NULL` is a top-level entity.
- Depth is not constrained at schema level; application layer should enforce reasonable depth limits (e.g. max 3 levels).

---

### `org.function_groups`

Functional groupings representing business capabilities or organisational functions. Supports hierarchy for nested capabilities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | e.g. `RISK_MGMT`, `FIN_REPORTING`, `AI_SERVICES` |
| `name` | VARCHAR(200) | NOT NULL | e.g. `Risk Management`, `Financial Reporting`, `AI & Data Services` |
| `description` | TEXT | | |
| `parent_function_group_id` | UUID | FK → `org.function_groups.id` | Parent group (NULL = top-level) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Example seed values:**

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

Industry sector classification. Used to tag assets and resources with the sector they serve. Supports hierarchy for sub-sector modelling.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | e.g. `BANKING`, `INSURANCE`, `CAPITAL_MARKETS` |
| `name` | VARCHAR(200) | NOT NULL | e.g. `Banking`, `Insurance`, `Capital Markets` |
| `description` | TEXT | | |
| `parent_sector_id` | UUID | FK → `org.industry_sectors.id` | Parent sector (NULL = top-level) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Example seed values:**

| code | name | parent |
|------|------|--------|
| `BANKING` | Banking | — |
| `RETAIL_BANKING` | Retail Banking | `BANKING` |
| `CORPORATE_BANKING` | Corporate Banking | `BANKING` |
| `INSURANCE` | Insurance | — |
| `LIFE_INSURANCE` | Life Insurance | `INSURANCE` |
| `CAPITAL_MARKETS` | Capital Markets | — |
| `WEALTH_MGMT` | Wealth Management | — |
| `CROSS_SECTOR` | Cross-Sector / Global | — |

---

### `org.service_offerings`

Specific service offerings — products or services the organisation delivers. A service offering typically belongs to a function group and may target a specific industry sector.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | e.g. `FRAUD_DETECT`, `CREDIT_RISK`, `NLP_PLATFORM` |
| `name` | VARCHAR(200) | NOT NULL | e.g. `Fraud Detection`, `Credit Risk Analytics`, `NLP Platform` |
| `description` | TEXT | | |
| `function_group_id` | UUID | FK → `org.function_groups.id` | Primary owning function group |
| `industry_sector_id` | UUID | FK → `org.industry_sectors.id` | Target industry sector (optional; NULL = cross-sector) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `function_group_id`, `industry_sector_id`

---

## Key Relationships

```
countries ──< opcos (primary_country_id)
opcos ──< opcos (parent_opco_id, self-referential hierarchy)
function_groups ──< function_groups (parent_function_group_id, self-referential hierarchy)
industry_sectors ──< industry_sectors (parent_sector_id, self-referential hierarchy)
service_offerings >── function_groups
service_offerings >── industry_sectors
```

All five `org` tables are referenced as foreign keys from:
- `governance.asset_submissions` (org scope of submission)
- `catalog.assets` (org scope of published asset)
- `identity.user_scope_bindings` (org scope of access grants)

---

## What is Shared vs Module-Owned

| Concern | Owner |
|---------|-------|
| Country reference data | `org` — shared |
| OpCo hierarchy | `org` — shared |
| Function group taxonomy | `org` — shared |
| Industry sector taxonomy | `org` — shared |
| Service offering catalogue | `org` — shared |
| Business-unit-specific extensions | Source modules may carry additional FK — but always back to `org` tables |
