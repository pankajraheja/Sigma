-- =============================================================================
-- 002_create_schemas.sql
-- SigAI Platform — Schema namespace declarations + shared utilities
--
-- Creates all schema namespaces used by the platform and installs the
-- shared updated_at trigger function that mutable tables reference.
--
-- Execution order: after 001_init_extensions.sql
-- Target: PostgreSQL 16
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Schema namespaces
-- ---------------------------------------------------------------------------

-- platform: shared utilities, module registry, linked resources.
-- Trigger function lives here so it is schema-agnostic.
CREATE SCHEMA IF NOT EXISTS platform;

-- org: organisational reference data (countries, opcos, function groups,
-- industry sectors, service offerings). Low-write, high-read reference tables.
CREATE SCHEMA IF NOT EXISTS org;

-- metadata: controlled vocabularies, taxonomy terms, tags, metadata
-- definitions. Stub tables created in 004_metadata_reference_minimal.sql;
-- full schema in a future migration.
CREATE SCHEMA IF NOT EXISTS metadata;

-- identity: users, roles, permissions, scope bindings.
-- Not created in this release — FK references to identity are deferred
-- and noted inline. Schema placeholder created here so dependent scripts
-- can reference it without error.
CREATE SCHEMA IF NOT EXISTS identity;

-- governance: asset submission pipeline, stage reviews, promotion records,
-- and the platform-wide audit trail.
CREATE SCHEMA IF NOT EXISTS governance;

-- catalog: the published, searchable registry of approved assets.
-- Populated exclusively via governance promotion; not an authoring surface.
CREATE SCHEMA IF NOT EXISTS catalog;


-- ---------------------------------------------------------------------------
-- Shared trigger utility: platform.set_updated_at()
--
-- Call this function from a BEFORE UPDATE trigger on any table that carries
-- an updated_at column. Triggers are attached per-table in their respective
-- DDL files (010, 020).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION platform.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION platform.set_updated_at() IS
  'Shared BEFORE UPDATE trigger function. Sets updated_at = NOW() on any '
  'mutable table. Apply with: CREATE TRIGGER trg_set_updated_at '
  'BEFORE UPDATE ON <schema>.<table> FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at()';
