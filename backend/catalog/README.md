# Catalog Backend — SigAI Platform

Express + TypeScript backend service for the Catalog module.

> **Status:** DB-wired vertical slice — health, asset list, and asset detail read from real PostgreSQL. Other routes (search, tags, taxonomy) use the same `pg.Pool` but are not part of the current scope.

---

## Architecture

```
backend/catalog/src/
  index.ts                  ← Entry point (starts server)
  app.ts                    ← Express app factory (testable, no side effects)
  config/
    index.ts                ← Environment config (reads process.env)
    database.ts             ← pg.Pool adapter (DbAdapter interface)
  models/
    catalog.types.ts        ← Domain types (mirrors PostgreSQL schema)
    api.types.ts            ← Request/response types + pagination helpers
  repositories/             ← Data access layer (all SQL lives here)
    asset.repository.ts
    publication.repository.ts
    taxonomy.repository.ts
    health.repository.ts
  services/                 ← Business logic (validates, orchestrates)
    asset.service.ts        ← Also exports NotFoundError, ValidationError
    discovery.service.ts    ← Full-text search (tsvector @@ plainto_tsquery)
    taxonomy.service.ts
    publication.service.ts  ← Submission → published-asset cross-lookup
    health.service.ts
  routes/
    index.ts                ← Registers all route groups on the app
    health.routes.ts
    assets.routes.ts
    search.routes.ts
    taxonomy.routes.ts
    submissions.routes.ts
  middleware/
    logger.middleware.ts    ← Structured request/response logging
    error.middleware.ts     ← Maps domain errors → HTTP status codes
```

---

## DB-wired endpoints (current scope)

| Method | Path | DB tables read |
|--------|------|----------------|
| `GET` | `/api/catalog/health` | `SELECT 1` ping |
| `GET` | `/api/catalog/assets` | `catalog.assets` |
| `GET` | `/api/catalog/assets/:id` | `catalog.assets`, `catalog.asset_source_refs` |

All other routes are wired but not yet within scope.

---

## Response shapes

### GET /api/catalog/assets

```json
{
  "items": [
    {
      "id": "...",
      "name": "Fraud Detection Workflow v2",
      "asset_kind": "workflow",
      "publication_status": "ga",
      "short_summary": "...",
      "contains_pii": false,
      "compliance_tags": ["gdpr", "sox"],
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T00:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 57
}
```

### GET /api/catalog/assets/:id

```json
{
  "asset": {
    "id": "...",
    "name": "Fraud Detection Workflow v2",
    "asset_kind": "workflow",
    "publication_status": "ga",
    "description": "...",
    "source_module_id": "...",
    "source_entity_type": "workflow",
    "source_entity_id": "cafecafe-0000-4000-8000-000000000042",
    "owner_id": "...",
    "country_id": "...",
    "opco_id": "...",
    "contains_pii": false,
    "data_classification": "internal",
    "compliance_tags": ["gdpr"]
  },
  "sourceRef": {
    "id": "...",
    "ref_type": "forge_asset_id",
    "ref_value": "cafecafe-0000-4000-8000-000000000042",
    "href": null,
    "is_primary": true
  }
}
```

### GET /api/catalog/health

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "checks": [
    { "service": "database", "status": "ok", "latencyMs": 3 }
  ]
}
```

### Error responses

```json
{
  "error": "NOT_FOUND",
  "message": "Asset not found: <id>",
  "statusCode": 404
}
```

---

## Query parameters — GET /api/catalog/assets

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `publication_status` | string | `ga,preview` | Filter by status: `ga`, `preview`, `deprecated`, `retired` |
| `asset_kind` | string | — | Exact match on `asset_kind` (e.g. `workflow`, `model`, `dataset`) |
| `compliance_tag` | string | — | Containment filter on `compliance_tags[]` (e.g. `gdpr`) |
| `country_id` | UUID | — | Org dimension filter |
| `opco_id` | UUID | — | Org dimension filter |
| `function_group_id` | UUID | — | Org dimension filter |
| `industry_sector_id` | UUID | — | Org dimension filter |
| `service_offering_id` | UUID | — | Org dimension filter |
| `page` | number | `1` | Page number (1-based) |
| `pageSize` | number | `20` | Items per page (max 100) |
| `sort` | string | `updated_at` | Sort column: `name`, `published_at`, `updated_at` |
| `order` | string | `desc` | Sort direction: `asc`, `desc` |

---

## Setup

### Prerequisites

Apply the DDL files to your PostgreSQL 16 database before starting:

```bash
psql -d sigai \
  -f db/sql/001_init_extensions.sql \
  -f db/sql/002_create_schemas.sql \
  -f db/sql/003_org_reference_minimal.sql \
  -f db/sql/004_metadata_reference_minimal.sql \
  -f db/sql/010_governance_core.sql \
  -f db/sql/020_catalog_core.sql
```

Optionally seed smoke-test data:

```bash
psql -d sigai -f db/test/seed_smoke_test.sql
```

### Install

```bash
cd backend/catalog
npm install
```

### Configure DB connection

**Option A — connection string (recommended):**

```bash
export DATABASE_URL="postgresql://sigai:password@localhost:5432/sigai"
```

**Option B — individual vars:**

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=sigai
export DB_USER=sigai
export DB_PASSWORD=your_password
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | Full connection string; overrides individual vars when set |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `sigai` | Database name |
| `DB_USER` | `sigai` | DB user |
| `DB_PASSWORD` | *(dev default)* | DB password |
| `DB_POOL_MIN` | `2` | Pool min connections |
| `DB_POOL_MAX` | `10` | Pool max connections |
| `DB_SSL` | `false` | Enable SSL (`true` uses `rejectUnauthorized: false`) |
| `PORT` | `3001` | HTTP port |
| `NODE_ENV` | `development` | `development \| production \| test` |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `API_PREFIX` | `/api/catalog` | Route prefix |

### Run

```bash
# Development (hot reload via tsx watch)
npm run dev

# Type-check only
npm run type-check

# Build to dist/
npm run build

# Start compiled output
npm start
```

---

## Sample curl requests

```bash
# Health check
curl -s http://localhost:3001/api/catalog/health | jq .

# List all GA + preview assets (default)
curl -s "http://localhost:3001/api/catalog/assets" | jq '{total:.total, count:(.items|length)}'

# Filter by asset kind
curl -s "http://localhost:3001/api/catalog/assets?asset_kind=workflow" | jq .

# Filter by compliance tag
curl -s "http://localhost:3001/api/catalog/assets?compliance_tag=gdpr" | jq .

# Filter by org dimension
curl -s "http://localhost:3001/api/catalog/assets?opco_id=<uuid>" | jq .

# Paginate
curl -s "http://localhost:3001/api/catalog/assets?page=2&pageSize=10&sort=name&order=asc" | jq .

# Get asset detail (includes primary source ref)
curl -s "http://localhost:3001/api/catalog/assets/<uuid>" | jq '{name:.asset.name, kind:.asset.asset_kind, ref:.sourceRef.ref_type}'

# If using smoke test data, find the seeded asset first:
curl -s "http://localhost:3001/api/catalog/assets?asset_kind=workflow" | jq '.items[0].id'
# Then use that ID:
curl -s "http://localhost:3001/api/catalog/assets/<id-from-above>" | jq .
```

---

## Design principles

- **Read-only service.** The catalog backend exposes no write endpoints. Assets enter the catalog exclusively via the governance promotion service.
- **No auth in current scope.** Auth middleware will be added when `identity.users` / JWT strategy is in place (future migration).
- **Domain errors, not HTTP errors in services.** Services throw `NotFoundError` or `ValidationError`; the error middleware converts them to HTTP responses.
- **SQL in repositories, logic in services.** Repositories contain parameterised `$1`-style SQL. Services handle validation, orchestration, and cross-repository calls.
- **Discoverable by default.** `publication_status IN ('ga', 'preview')` is the default filter, matching the DB index `idx_catalog_assets_discoverable`.
- **Parallel queries in detail endpoint.** `getById()` runs `findById` and `findSourceRefs` concurrently via `Promise.all`.
