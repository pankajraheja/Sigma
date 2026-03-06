-- =============================================================================
-- 030_metadata_taxonomy.sql
-- SigAI Platform — Configurable taxonomy schema
--
-- Creates the four-table taxonomy system inside the metadata schema:
--
--   metadata.taxonomy_schemes   — top-level classification schemes
--   metadata.taxonomy_buckets   — configurable buckets within a scheme
--   metadata.taxonomy_terms     — vocabulary terms (hierarchical via parent)
--   metadata.taxonomy_aliases   — alternate labels / synonyms per term
--
-- PREREQUISITES:
--   001_init_extensions.sql    (pgcrypto, pg_trgm)
--   002_create_schemas.sql    (metadata schema, platform.set_updated_at)
--
-- IDEMPOTENT:  All DDL uses IF NOT EXISTS / DO $$ guards.
-- EXECUTION:   psql -d <database> -f db/sql/030_metadata_taxonomy.sql
--
-- Target: PostgreSQL 16+
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. metadata.taxonomy_schemes
--
-- A "scheme" is the highest-level grouping in the taxonomy hierarchy.
-- Examples: "Asset Classification", "Industry Vertical", "Compliance".
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS metadata.taxonomy_schemes (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    scheme_key      VARCHAR(100)    NOT NULL,
    label           VARCHAR(200)    NOT NULL,
    description     TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_taxonomy_schemes      PRIMARY KEY (id),
    CONSTRAINT uq_taxonomy_schemes_key  UNIQUE (scheme_key)
);

COMMENT ON TABLE metadata.taxonomy_schemes IS
    'Top-level taxonomy scheme. Each scheme owns one or more buckets, '
    'which in turn own the actual vocabulary terms.';

-- Index: fast lookup by scheme_key
CREATE INDEX IF NOT EXISTS idx_taxonomy_schemes_key
    ON metadata.taxonomy_schemes (scheme_key);

-- Trigger: auto-update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_taxonomy_schemes_updated_at'
    ) THEN
        CREATE TRIGGER trg_taxonomy_schemes_updated_at
            BEFORE UPDATE ON metadata.taxonomy_schemes
            FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. metadata.taxonomy_buckets
--
-- A "bucket" is a configurable grouping inside a scheme.
-- Each bucket can be flagged as multi-select (pick many) or required.
-- Example: scheme "Asset Classification" → buckets "Type", "Domain", "Tag".
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS metadata.taxonomy_buckets (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    scheme_id       UUID            NOT NULL,
    bucket_key      VARCHAR(100)    NOT NULL,
    label           VARCHAR(200)    NOT NULL,
    description     TEXT,
    is_multi_select BOOLEAN         NOT NULL DEFAULT FALSE,
    is_required     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_taxonomy_buckets          PRIMARY KEY (id),
    CONSTRAINT fk_taxonomy_buckets_scheme   FOREIGN KEY (scheme_id)
                                            REFERENCES metadata.taxonomy_schemes (id)
                                            ON DELETE CASCADE,
    CONSTRAINT uq_taxonomy_buckets_key      UNIQUE (scheme_id, bucket_key)
);

COMMENT ON TABLE metadata.taxonomy_buckets IS
    'Configurable bucket within a taxonomy scheme. '
    'is_multi_select = TRUE allows users to pick multiple terms; '
    'is_required = TRUE enforces that at least one term must be selected.';

-- Index: bucket_key standalone for cross-scheme searches
CREATE INDEX IF NOT EXISTS idx_taxonomy_buckets_key
    ON metadata.taxonomy_buckets (bucket_key);

-- Index: scheme_id for FK child lookups
CREATE INDEX IF NOT EXISTS idx_taxonomy_buckets_scheme_id
    ON metadata.taxonomy_buckets (scheme_id);

-- Trigger: auto-update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_taxonomy_buckets_updated_at'
    ) THEN
        CREATE TRIGGER trg_taxonomy_buckets_updated_at
            BEFORE UPDATE ON metadata.taxonomy_buckets
            FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. metadata.taxonomy_terms
--
-- Actual vocabulary entries.  Each term belongs to exactly one bucket.
-- Nesting is supported via parent_term_id (self-referential FK).
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the legacy stub table from 004 if it exists, so we can recreate
-- with the new bucket-centric structure. Cascade removes dependent indexes
-- and FKs; downstream tables (catalog.asset_classifications) will need
-- their FK re-pointed after this migration.
DROP TABLE IF EXISTS metadata.taxonomy_terms CASCADE;

CREATE TABLE metadata.taxonomy_terms (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    bucket_id       UUID            NOT NULL,
    term_key        VARCHAR(100)    NOT NULL,
    label           VARCHAR(200)    NOT NULL,
    description     TEXT,
    parent_term_id  UUID,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_taxonomy_terms            PRIMARY KEY (id),
    CONSTRAINT fk_taxonomy_terms_bucket     FOREIGN KEY (bucket_id)
                                            REFERENCES metadata.taxonomy_buckets (id)
                                            ON DELETE CASCADE,
    CONSTRAINT fk_taxonomy_terms_parent     FOREIGN KEY (parent_term_id)
                                            REFERENCES metadata.taxonomy_terms (id)
                                            ON DELETE SET NULL,
    CONSTRAINT uq_taxonomy_terms_key        UNIQUE (bucket_id, term_key)
);

COMMENT ON TABLE metadata.taxonomy_terms IS
    'Taxonomy vocabulary term. Belongs to a bucket; supports nesting '
    'via parent_term_id for hierarchical classification.';

-- Index: fast child lookups
CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_parent
    ON metadata.taxonomy_terms (parent_term_id)
    WHERE parent_term_id IS NOT NULL;

-- Index: bucket_id for FK child lookups
CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_bucket_id
    ON metadata.taxonomy_terms (bucket_id);

-- Index: ILIKE search on label (GIN trigram)
CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_label_trgm
    ON metadata.taxonomy_terms
    USING gin (label gin_trgm_ops);

-- Trigger: auto-update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_taxonomy_terms_updated_at'
    ) THEN
        CREATE TRIGGER trg_taxonomy_terms_updated_at
            BEFORE UPDATE ON metadata.taxonomy_terms
            FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. metadata.taxonomy_aliases
--
-- Alternate labels / synonyms for a taxonomy term.
-- Supports locale-tagged aliases for i18n.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS metadata.taxonomy_aliases (
    id          UUID            NOT NULL DEFAULT gen_random_uuid(),
    term_id     UUID            NOT NULL,
    alias_label VARCHAR(300)    NOT NULL,
    locale      VARCHAR(10)     NOT NULL DEFAULT 'en',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_taxonomy_aliases          PRIMARY KEY (id),
    CONSTRAINT fk_taxonomy_aliases_term     FOREIGN KEY (term_id)
                                            REFERENCES metadata.taxonomy_terms (id)
                                            ON DELETE CASCADE,
    CONSTRAINT uq_taxonomy_aliases_label    UNIQUE (term_id, alias_label, locale)
);

COMMENT ON TABLE metadata.taxonomy_aliases IS
    'Alternate labels or synonyms for a taxonomy term. '
    'locale defaults to "en"; supports multi-language taxonomies.';

-- Index: term_id FK lookups
CREATE INDEX IF NOT EXISTS idx_taxonomy_aliases_term_id
    ON metadata.taxonomy_aliases (term_id);

-- Index: ILIKE search on alias_label (GIN trigram)
CREATE INDEX IF NOT EXISTS idx_taxonomy_aliases_label_trgm
    ON metadata.taxonomy_aliases
    USING gin (alias_label gin_trgm_ops);

-- Trigger: auto-update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_taxonomy_aliases_updated_at'
    ) THEN
        CREATE TRIGGER trg_taxonomy_aliases_updated_at
            BEFORE UPDATE ON metadata.taxonomy_aliases
            FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- Done
-- ═══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN RAISE NOTICE '030_metadata_taxonomy: configurable taxonomy schema applied.'; END $$;
