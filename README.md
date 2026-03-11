# SigAI Workspace

AI-powered enterprise workspace for discovering, building, validating, and delivering AI assets at scale.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express 4, TypeScript, tsx (dev runner) |
| Database | PostgreSQL (via `pg`) |
| AI | OpenAI SDK (supports Azure OpenAI and standard OpenAI) |
| Tooling | ESLint, TypeScript strict mode, Vite proxy for dev |

## Project Structure

```
Sigma/
├── src/                          # Frontend (Vite + React SPA)
│   ├── app/                      # Shell, routing, providers
│   ├── components/ui/            # Shared UI components
│   ├── config/                   # App config, brand JSONs
│   │   └── brands/               # Brand config files (e.g. kpmg.json)
│   ├── features/                 # Feature modules
│   │   ├── admin/                # Admin Control Center (brand config, taxonomy)
│   │   ├── brand/                # BrandContext + provider
│   │   ├── catalog/              # AI Navigator
│   │   ├── chat/                 # Sigma Chat
│   │   ├── forge/                # Agent Forge
│   │   ├── home/                 # Home page
│   │   ├── intake/               # Request Hub
│   │   ├── pipeline/             # Delivery Hub
│   │   ├── prototype-builder/    # Prototype Lab
│   │   └── vizier/               # Vizier (governance)
│   ├── lib/                      # Shared utilities
│   ├── registry/                 # Module registry (single source of truth)
│   ├── standards/                # Design tokens (CSS custom properties)
│   ├── styles/                   # Global styles
│   └── types/                    # Shared TypeScript types
│
├── backend/catalog/              # Backend (Express API)
│   ├── src/
│   │   ├── config/               # Environment config
│   │   ├── middleware/            # Logger, error handler
│   │   ├── models/               # Type definitions
│   │   ├── repositories/         # Database queries
│   │   ├── routes/               # Route handlers
│   │   └── services/             # Business logic, AI providers
│   └── db/                       # SQL seed data
│
├── vite.config.ts                # Vite config with dev proxy
├── tsconfig.json                 # TypeScript config
└── package.json                  # Root dependencies
```

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **npm** (included with Node.js)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd Sigma

# Frontend dependencies
npm install

# Backend dependencies
cd backend/catalog
npm install
cd ../..
```

### 2. Create the database

```bash
# Connect to PostgreSQL and create the database and user
psql -U postgres -c "CREATE USER sigai WITH PASSWORD 'postgres';"
psql -U postgres -c "CREATE DATABASE sigai OWNER sigai;"

# Run the seed data
psql -U sigai -d sigai -f backend/catalog/db/seed.dev.sql
```

### 3. Configure the backend

Create `backend/catalog/.env`:

```env
# Server
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sigai
DB_USER=postgres
DB_PASSWORD=postgres

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:5176

# AI (optional — runs in stub mode without these)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini

# Azure OpenAI (optional — set all three to activate Azure mode)
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
# AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

> **Note:** The `.env` file is gitignored. Each developer must create their own.

### 4. Run the app

```bash
# Terminal 1 — Backend
cd backend/catalog
npm run dev

# Terminal 2 — Frontend
npm run dev
```

- **Frontend:** http://localhost:5176
- **Backend:** http://localhost:3001
- **API health check:** http://localhost:3001/api/catalog/health

The Vite dev server proxies `/api/catalog`, `/api/generate`, and `/api/submissions` to the backend automatically.

## Environment Variables

### Backend (`backend/catalog/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `sigai` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DATABASE_URL` | — | Full connection string (overrides individual DB_* vars) |
| `DB_SSL` | `false` | Enable SSL for DB connection |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174` | Allowed CORS origins |
| `OPENAI_API_KEY` | — | OpenAI API key (enables real AI features) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model for AI features |
| `AZURE_OPENAI_ENDPOINT` | — | Azure OpenAI endpoint (activates Azure mode) |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-4o-mini` | Azure deployment name |
| `OPENAI_FALLBACK_KEY` | — | Fallback OpenAI key when Azure fails |

### Frontend (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_CATALOG_API_URL` | `/api/catalog` | Override catalog API base URL |

## Platform Modules

| Module | Route | Status | Description |
|--------|-------|--------|-------------|
| AI Navigator | `/catalog` | Live | Discover and explore AI assets |
| Request Hub | `/intake` | Live | Submit and track asset requests |
| Prototype Lab | `/prototype-builder` | Live | Generate and iterate on prototypes |
| Agent Forge | `/forge` | Preview | Build and configure AI agents |
| Solution Studio | `/app-builder` | Preview | Assemble full AI solutions |
| Delivery Hub | `/pipeline` | Preview | Review exports and submissions |
| Vizier | `/vizier` | Preview | Governance and observability |
| Admin Control Center | `/admin` | Live | Brand config, taxonomy management |

## API Endpoints

### Catalog
- `GET /api/catalog/health` — Health check
- `GET /api/catalog/assets` — List assets
- `GET /api/catalog/assets/:id` — Asset detail
- `GET /api/catalog/search` — Search assets
- `GET /api/catalog/taxonomy` — Taxonomy data
- `GET /api/catalog/tags` — Tags

### Generation
- `POST /api/generate` — Model-agnostic HTML generation

### Submissions
- `GET /api/submissions` — List all submissions
- `GET /api/submissions/:id` — Get submission detail
- `POST /api/submissions` — Save a submission record

### Chat
- `POST /api/chat/query` — Sigma Chat query
- `GET /api/chat/skills` — Available chat skills

## Scripts

### Frontend (root)

| Script | Command |
|--------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Backend (`backend/catalog/`)

| Script | Command |
|--------|---------|
| `npm run dev` | Start with tsx watch + .env |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm run type-check` | Type-check without emit |

## AI Provider

The backend uses a provider abstraction layer:

- **OpenAI** — activated when `OPENAI_API_KEY` is set
- **Azure OpenAI** — activated when `AZURE_OPENAI_ENDPOINT` is also set
- **Stub** — used automatically when no API key is configured (returns deterministic mock data)

No code changes are needed to switch providers — just update the environment variables.
