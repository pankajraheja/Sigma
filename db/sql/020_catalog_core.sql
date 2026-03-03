-- =============================================================================
-- 020_catalog_core.sql
-- SigAI Platform — Catalog schema: core tables
--
-- Creates the published asset registry and all supporting catalog tables:
--   catalog.assets              — published record of an approved asset
--   catalog.asset_versions      — version history per asset
--   catalog.asset_classifications — controlled-vocabulary taxonomy associations
--   catalog.asset_tags          — user-contributed informal tag associations
--   catalog.asset_source_refs   — source traceability references
--
-- Also closes the deferred FK from governance.publication_promotions
-- to catalog.assets (governance was created first in 010, before catalog
-- existed).
--
-- FK DEPENDENCIES (must be created first):
--   002_create_schemas.sql          → platform.set_updated_at()
--   003_org_reference_minimal.sql   → platform.modules, org.*
--   004_metadata_reference_minimal.sql → metadata.taxonomy_terms, metadata.tags
--   010_governance_core.sql         → governance.asset_submissions,
--                                     governance.publication_promotions
--
-- DEFERRED FKs:
--   owner_id, released_by, classified_by, tagged_by, added_by columns will
--   reference identity.users(id) when the identity schema migration runs.
--
-- CATALOG DESIGN PRINCIPLE:
--   catalog.assets is populated exclusively by the governance promotion process.
--   It is NOT an authoring surface. publication_status is only written by the
--   governance service via governance.publication_promotions.
--   Only 'ga' (and optionally 'preview') assets are considered discoverable.
--
-- Execution order: after 010_governance_core.sql
-- Target: PostgreSQL 16
-- =============================================================================


-- =============================================================================
-- catalog.assets
--
-- Primary catalog record for a published asset.
-- Created when governance promotes an approved submission (first to 'preview',
-- then to 'ga'). NFR fields are denormalised from the approved submission for
-- efficient catalog queries without cross-schema joins.
--
-- Source traceability:
--   (source_module_id, source_entity_type, source_entity_id) uniquely identifies
--   the originating entity in the source module's own DB.
--
-- NFR fields are governance inputs copied from asset_submissions at promotion.
-- They are DESCRIPTIVE/INFORMATIONAL — not access-control rules.
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog.assets (
    id                     UUID         NOT NULL DEFAULT gen_random_uuid(),
    name                   VARCHAR(300) NOT NULL,
    short_summary          VARCHAR(500) NOT NULL,
    description            TEXT,

    -- -------------------------------------------------------------------------
    -- Classification
    -- -------------------------------------------------------------------------
    asset_kind             VARCHAR(30)  NOT NULL,

    -- domain stored as denormalised code (e.g. 'risk_compliance') rather than
    -- a FK to metadata.taxonomy_terms to avoid a join on every catalog query.
    -- Value must match a term in metadata.taxonomy_terms where scheme_code = 'domain'.
    domain                 VARCHAR(100),

    -- Publication status — only written by the governance promotion service.
    -- 'ga' and 'preview' are discoverable; 'deprecated' and 'retired' are not
    -- shown in default catalog search.
    publication_status     VARCHAR(20)  NOT NULL DEFAULT 'preview',

    -- -------------------------------------------------------------------------
    -- Governance link
    -- -------------------------------------------------------------------------
    -- Preserves the authoritative record of which governance review produced
    -- this catalog entry. SET NULL if the submission record is ever purged
    -- (historical submissions may be archived; the catalog entry remains).
    approved_submission_id UUID,

    -- -------------------------------------------------------------------------
    -- Ownership
    -- -------------------------------------------------------------------------
    -- owner_id: FK references identity.users(id) ON DELETE RESTRICT — deferred.
    owner_id               UUID         NOT NULL,

    -- -------------------------------------------------------------------------
    -- Org dimensions — first-class FK columns
    -- -------------------------------------------------------------------------
    primary_country_id     UUID,
    opco_id                UUID,
    function_group_id      UUID,
    industry_sector_id     UUID,
    service_offering_id    UUID,

    -- -------------------------------------------------------------------------
    -- Source traceability
    -- -------------------------------------------------------------------------
    -- source_module_id: the SigAI module that authored this asset.
    source_module_id       UUID         NOT NULL,

    -- source_entity_type: the entity type in the source module's own DB,
    -- e.g. 'dataset', 'api', 'model', 'report'.
    source_entity_type     VARCHAR(100) NOT NULL,

    -- source_entity_id: UUID of the record in the source module's own DB.
    -- SOFT REFERENCE — no cross-DB FK is possible. Application validates
    -- existence before promotion. See docs/schema/spec/cross-schema.md Risk 5.
    source_entity_id       UUID         NOT NULL,

    -- -------------------------------------------------------------------------
    -- NFR fields (denormalised from approved_submission_id at promotion time)
    --
    -- These are INFORMATIONAL GOVERNANCE METADATA — not access-control rules.
    -- Access control is determined by identity roles and scope bindings.
    -- -------------------------------------------------------------------------
    data_classification    VARCHAR(20),
    hosting_type           VARCHAR(20),
    audience_type          VARCHAR(20),
    business_criticality   VARCHAR(20),

    -- ISO-3166-1 alpha-2 country code or 'global' — data residency constraint
    data_residency         VARCHAR(10),

    contains_pii           BOOLEAN      NOT NULL DEFAULT FALSE,
    is_client_facing       BOOLEAN      NOT NULL DEFAULT FALSE,
    retention_requirement  VARCHAR(300),
    sla_description        TEXT,

    -- Array of compliance tag codes matching metadata.taxonomy_terms
    -- (scheme_code = 'compliance_tag'). GIN-indexed for containment queries.
    compliance_tags        TEXT[],

    -- -------------------------------------------------------------------------
    -- Discovery signals
    -- -------------------------------------------------------------------------
    usage_count            INT          NOT NULL DEFAULT 0,
    featured               BOOLEAN      NOT NULL DEFAULT FALSE,

    -- -------------------------------------------------------------------------
    -- Timestamps
    -- -------------------------------------------------------------------------
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Set when first promoted to 'preview' or 'ga'
    published_at           TIMESTAMPTZ,
    -- Set when status transitions to 'deprecated'
    deprecated_at          TIMESTAMPTZ,
    -- Set when status transitions to 'retired'
    retired_at             TIMESTAMPTZ,

    -- =========================================================================
    -- Constraints
    -- =========================================================================
    CONSTRAINT pk_catalog_assets                     PRIMARY KEY (id),

    -- One catalog record per source entity (across the whole platform)
    CONSTRAINT uq_catalog_assets_source              UNIQUE (
        source_module_id, source_entity_type, source_entity_id
    ),

    -- FKs: org and module references
    CONSTRAINT fk_catalog_assets_submission          FOREIGN KEY (approved_submission_id)
        REFERENCES governance.asset_submissions (id) ON DELETE SET NULL,
    CONSTRAINT fk_catalog_assets_source_module       FOREIGN KEY (source_module_id)
        REFERENCES platform.modules (id) ON DELETE RESTRICT,
    CONSTRAINT fk_catalog_assets_country             FOREIGN KEY (primary_country_id)
        REFERENCES org.countries (id) ON DELETE SET NULL,
    CONSTRAINT fk_catalog_assets_opco                FOREIGN KEY (opco_id)
        REFERENCES org.opcos (id) ON DELETE SET NULL,
    CONSTRAINT fk_catalog_assets_function_group      FOREIGN KEY (function_group_id)
        REFERENCES org.function_groups (id) ON DELETE SET NULL,
    CONSTRAINT fk_catalog_assets_industry_sector     FOREIGN KEY (industry_sector_id)
        REFERENCES org.industry_sectors (id) ON DELETE SET NULL,
    CONSTRAINT fk_catalog_assets_service_offering    FOREIGN KEY (service_offering_id)
        REFERENCES org.service_offerings (id) ON DELETE SET NULL,

    -- Controlled value constraints
    CONSTRAINT chk_catalog_assets_kind               CHECK (
        asset_kind IN (
            'dataset', 'api', 'report', 'model', 'dashboard',
            'pipeline', 'template', 'skill', 'connector'
        )
    ),
    CONSTRAINT chk_catalog_assets_pub_status         CHECK (
        publication_status IN ('preview', 'ga', 'deprecated', 'retired')
    ),
    CONSTRAINT chk_catalog_assets_classification     CHECK (
        data_classification IS NULL
        OR data_classification IN ('public', 'internal', 'confidential', 'restricted')
    ),
    CONSTRAINT chk_catalog_assets_hosting            CHECK (
        hosting_type IS NULL
        OR hosting_type IN ('cloud', 'on_premise', 'hybrid', 'saas')
    ),
    CONSTRAINT chk_catalog_assets_audience           CHECK (
        audience_type IS NULL
        OR audience_type IN ('internal', 'external', 'partner', 'cross_entity')
    ),
    CONSTRAINT chk_catalog_assets_criticality        CHECK (
        business_criticality IS NULL
        OR business_criticality IN ('low', 'medium', 'high', 'critical')
    ),
    CONSTRAINT chk_catalog_assets_usage              CHECK (usage_count >= 0),

    -- Timestamp / status consistency
    CONSTRAINT chk_catalog_assets_deprecated_ts      CHECK (
        deprecated_at IS NULL
        OR publication_status IN ('deprecated', 'retired')
    ),
    CONSTRAINT chk_catalog_assets_retired_ts         CHECK (
        retired_at IS NULL
        OR publication_status = 'retired'
    ),
    CONSTRAINT chk_catalog_assets_published_ts       CHECK (
        published_at IS NULL
        OR publication_status IN ('preview', 'ga', 'deprecated', 'retired')
    )
);

COMMENT ON TABLE catalog.assets IS
    'Published, searchable registry of approved assets. Populated exclusively '
    'by the governance promotion service — not an authoring surface. '
    'NFR fields are denormalised governance metadata; they are informational '
    'and must NOT be used for access-control decisions. '
    'Only publication_status IN (''preview'', ''ga'') should be shown in discovery.';

-- updated_at trigger
CREATE TRIGGER trg_catalog_assets_updated_at
    BEFORE UPDATE ON catalog.assets
    FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Publication lifecycle filtering — most common catalog query predicate
CREATE INDEX IF NOT EXISTS idx_catalog_assets_pub_status
    ON catalog.assets (publication_status);

-- Partial index covering only discoverable assets (ga + preview).
-- Use this for catalog search, home page, featured sections.
CREATE INDEX IF NOT EXISTS idx_catalog_assets_discoverable
    ON catalog.assets (updated_at DESC)
    WHERE publication_status IN ('ga', 'preview');

-- Asset kind browsing / filtering
CREATE INDEX IF NOT EXISTS idx_catalog_assets_kind
    ON catalog.assets (asset_kind, publication_status);

-- Domain filtering
CREATE INDEX IF NOT EXISTS idx_catalog_assets_domain
    ON catalog.assets (domain, publication_status)
    WHERE domain IS NOT NULL;

-- Ownership
CREATE INDEX IF NOT EXISTS idx_catalog_assets_owner
    ON catalog.assets (owner_id);

-- ── Org dimension indexes ────────────────────────────────────────────────────
-- Individual indexes allow the planner to choose the best one based on
-- selectivity. Composite org indexes added on measured query patterns.

CREATE INDEX IF NOT EXISTS idx_catalog_assets_opco
    ON catalog.assets (opco_id, publication_status)
    WHERE opco_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_country
    ON catalog.assets (primary_country_id, publication_status)
    WHERE primary_country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_function_group
    ON catalog.assets (function_group_id, publication_status)
    WHERE function_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_industry_sector
    ON catalog.assets (industry_sector_id, publication_status)
    WHERE industry_sector_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_service_offering
    ON catalog.assets (service_offering_id, publication_status)
    WHERE service_offering_id IS NOT NULL;

-- ── NFR / governance filter indexes ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_catalog_assets_classification
    ON catalog.assets (data_classification, publication_status)
    WHERE data_classification IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_pii
    ON catalog.assets (contains_pii, publication_status)
    WHERE contains_pii = TRUE;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_hosting
    ON catalog.assets (hosting_type)
    WHERE hosting_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_audience
    ON catalog.assets (audience_type)
    WHERE audience_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_criticality
    ON catalog.assets (business_criticality)
    WHERE business_criticality IS NOT NULL;

-- GIN on compliance_tags for array containment queries:
--   WHERE compliance_tags @> ARRAY['gdpr']
CREATE INDEX IF NOT EXISTS idx_catalog_assets_compliance_tags
    ON catalog.assets USING GIN (compliance_tags)
    WHERE compliance_tags IS NOT NULL;

-- ── Discovery signal indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_catalog_assets_featured
    ON catalog.assets (featured, updated_at DESC)
    WHERE featured = TRUE AND publication_status IN ('ga', 'preview');

CREATE INDEX IF NOT EXISTS idx_catalog_assets_usage
    ON catalog.assets (usage_count DESC)
    WHERE publication_status IN ('ga', 'preview');

CREATE INDEX IF NOT EXISTS idx_catalog_assets_published_at
    ON catalog.assets (published_at DESC)
    WHERE published_at IS NOT NULL;

-- Full-text search generated column (tsvector).
-- A single generated column over name + short_summary + description supports
-- GIN-indexed full-text search without a separate FTS table.
ALTER TABLE catalog.assets
    ADD COLUMN IF NOT EXISTS search_vector tsvector
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(short_summary, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'C')
        ) STORED;

CREATE INDEX IF NOT EXISTS idx_catalog_assets_fts
    ON catalog.assets USING GIN (search_vector);


-- =============================================================================
-- catalog.asset_versions
--
-- Version history for a catalog asset. Each significant governance approval
-- or content change produces a new version row. is_current = TRUE marks the
-- active version; only one row per asset may be current at a time.
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog.asset_versions (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    asset_id      UUID        NOT NULL,
    version       VARCHAR(50) NOT NULL,
    released_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- released_by: FK references identity.users(id) ON DELETE RESTRICT — deferred.
    released_by   UUID        NOT NULL,

    change_summary TEXT,
    is_current    BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Submission that produced this version; NULL for manually created versions.
    submission_id UUID,

    CONSTRAINT pk_catalog_asset_versions          PRIMARY KEY (id),
    CONSTRAINT uq_catalog_asset_versions_version  UNIQUE (asset_id, version),

    CONSTRAINT fk_asset_versions_asset            FOREIGN KEY (asset_id)
        REFERENCES catalog.assets (id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_versions_submission       FOREIGN KEY (submission_id)
        REFERENCES governance.asset_submissions (id) ON DELETE SET NULL
);

COMMENT ON TABLE catalog.asset_versions IS
    'Version history for catalog assets. Exactly one row per asset may have '
    'is_current = TRUE, enforced by the partial unique index below. '
    'When promoting a new version, set is_current = FALSE on the previous '
    'current version and is_current = TRUE on the new one within a transaction '
    'using SELECT ... FOR UPDATE on catalog.assets.id to prevent races. '
    'released_by FK to identity.users added in identity migration.';

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Version history for an asset, most-recent first
CREATE INDEX IF NOT EXISTS idx_asset_versions_asset
    ON catalog.asset_versions (asset_id, released_at DESC);

-- Enforce at most one current version per asset at DB level.
-- Application must set is_current = FALSE on the previous version before
-- setting is_current = TRUE on the new one (within a transaction).
CREATE UNIQUE INDEX IF NOT EXISTS uix_asset_versions_one_current
    ON catalog.asset_versions (asset_id)
    WHERE is_current = TRUE;


-- =============================================================================
-- catalog.asset_classifications
--
-- Multi-value controlled-vocabulary associations for a catalog asset.
-- Used for taxonomy terms beyond the core NFR fields that are denormalised
-- directly onto catalog.assets (e.g. additional compliance tags, regulatory
-- jurisdiction terms, sub-domain classifications).
--
-- term_id references metadata.taxonomy_terms(id). The FK constraint is added
-- here immediately because 004_metadata_reference_minimal.sql creates the stub
-- metadata.taxonomy_terms table before this file runs.
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog.asset_classifications (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    asset_id      UUID        NOT NULL,
    term_id       UUID        NOT NULL,

    -- scheme_code denormalised for efficient filtering without joining metadata.
    -- Must match the scheme_code of the referenced taxonomy_terms row.
    scheme_code   VARCHAR(100) NOT NULL,

    -- classified_by: FK references identity.users(id) ON DELETE RESTRICT — deferred.
    classified_by UUID        NOT NULL,
    classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_catalog_asset_classifications   PRIMARY KEY (id),
    CONSTRAINT uq_catalog_asset_classifications   UNIQUE (asset_id, term_id),

    CONSTRAINT fk_classifications_asset           FOREIGN KEY (asset_id)
        REFERENCES catalog.assets (id) ON DELETE CASCADE,
    CONSTRAINT fk_classifications_term            FOREIGN KEY (term_id)
        REFERENCES metadata.taxonomy_terms (id) ON DELETE RESTRICT
);

COMMENT ON TABLE catalog.asset_classifications IS
    'Multi-value taxonomy term associations for catalog assets. Supports '
    'additional controlled-vocabulary classifications beyond the core NFR fields '
    'that are denormalised on catalog.assets. scheme_code is denormalised from '
    'the referenced taxonomy_terms row for efficient filtering. '
    'classified_by FK to identity.users added in identity migration.';

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- All classifications for an asset
CREATE INDEX IF NOT EXISTS idx_classifications_asset
    ON catalog.asset_classifications (asset_id);

-- Reverse: all assets classified under a specific term
CREATE INDEX IF NOT EXISTS idx_classifications_term
    ON catalog.asset_classifications (term_id);

-- Filtered by scheme (e.g. find all assets with a compliance_tag classification)
CREATE INDEX IF NOT EXISTS idx_classifications_scheme
    ON catalog.asset_classifications (scheme_code, term_id);


-- =============================================================================
-- catalog.asset_tags
--
-- Junction table linking catalog assets to user-contributed informal tags.
-- Tags are free-form and not controlled vocabulary. The canonical tag record
-- lives in metadata.tags; this table stores the asset-to-tag association.
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog.asset_tags (
    asset_id  UUID        NOT NULL,
    tag_id    UUID        NOT NULL,

    -- tagged_by: FK references identity.users(id) ON DELETE RESTRICT — deferred.
    tagged_by UUID        NOT NULL,
    tagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_catalog_asset_tags      PRIMARY KEY (asset_id, tag_id),

    CONSTRAINT fk_asset_tags_asset        FOREIGN KEY (asset_id)
        REFERENCES catalog.assets (id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_tags_tag          FOREIGN KEY (tag_id)
        REFERENCES metadata.tags (id) ON DELETE CASCADE
);

COMMENT ON TABLE catalog.asset_tags IS
    'Asset-to-tag junction table. Tags are user-contributed informal labels '
    '(not controlled vocabulary). Canonical tag records are in metadata.tags. '
    'tagged_by FK to identity.users added in identity migration.';

-- Reverse lookup: all assets tagged with a specific tag (for tag-browsing pages)
CREATE INDEX IF NOT EXISTS idx_asset_tags_tag
    ON catalog.asset_tags (tag_id);


-- =============================================================================
-- catalog.asset_source_refs
--
-- Source traceability references beyond the primary
-- (source_module_id, source_entity_type, source_entity_id) on catalog.assets.
--
-- Records secondary or supplementary source pointers:
--   - GitHub repositories
--   - DBT model paths
--   - Confluence data dictionary pages
--   - JIRA epics
--   - Snowflake table identifiers
--   - Any other system the asset was built from
--
-- Distinct from platform.linked_resources (which holds informational external
-- links such as documentation and runbooks attached to the published record).
-- asset_source_refs tracks WHERE the asset was authored; linked_resources tracks
-- WHERE additional information about it can be found.
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog.asset_source_refs (
    id         UUID         NOT NULL DEFAULT gen_random_uuid(),
    asset_id   UUID         NOT NULL,

    -- ref_type is intentionally free-form (no CHECK constraint) to allow new
    -- source systems without schema changes. Recommended values:
    --   forge_asset_id | github_repo | dbt_model | confluence_page
    --   jira_epic | snowflake_table | databricks_notebook | s3_path
    ref_type   VARCHAR(100) NOT NULL,
    ref_value  TEXT         NOT NULL,
    label      VARCHAR(300),

    -- Resolved URL if the reference has a web-accessible representation
    href       TEXT,

    -- Exactly one source ref per asset should be marked as primary.
    -- Enforced by the partial unique index below.
    is_primary BOOLEAN      NOT NULL DEFAULT FALSE,

    -- added_by: FK references identity.users(id) ON DELETE RESTRICT — deferred.
    added_by   UUID         NOT NULL,
    added_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_catalog_asset_source_refs   PRIMARY KEY (id),

    CONSTRAINT fk_source_refs_asset           FOREIGN KEY (asset_id)
        REFERENCES catalog.assets (id) ON DELETE CASCADE
);

COMMENT ON TABLE catalog.asset_source_refs IS
    'Secondary and supplementary source traceability references for catalog assets. '
    'The primary source is (source_module_id, source_entity_type, source_entity_id) '
    'on catalog.assets. This table captures additional pointers such as GitHub repos, '
    'DBT models, Confluence pages, and Snowflake tables. '
    'Distinct from platform.linked_resources, which holds informational external links. '
    'added_by FK to identity.users added in identity migration.';

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- All refs for an asset
CREATE INDEX IF NOT EXISTS idx_source_refs_asset
    ON catalog.asset_source_refs (asset_id);

-- Reverse: find catalog assets linked to a specific source ref
-- (e.g. "which catalog assets point to this GitHub repo?")
CREATE INDEX IF NOT EXISTS idx_source_refs_type_value
    ON catalog.asset_source_refs (ref_type, ref_value);

-- Enforce at most one primary ref per asset
CREATE UNIQUE INDEX IF NOT EXISTS uix_source_refs_one_primary
    ON catalog.asset_source_refs (asset_id)
    WHERE is_primary = TRUE;


-- =============================================================================
-- Close the deferred FK: governance.publication_promotions → catalog.assets
--
-- governance.publication_promotions was created in 010_governance_core.sql
-- before catalog.assets existed. The catalog_asset_id column is NOT NULL and
-- was created without a FK constraint. We add it now.
-- =============================================================================

ALTER TABLE governance.publication_promotions
    ADD CONSTRAINT fk_promotions_catalog_asset
        FOREIGN KEY (catalog_asset_id)
        REFERENCES catalog.assets (id)
        ON DELETE RESTRICT;

COMMENT ON CONSTRAINT fk_promotions_catalog_asset ON governance.publication_promotions IS
    'Added here (020_catalog_core.sql) because catalog.assets did not exist '
    'when governance.publication_promotions was created in 010_governance_core.sql.';
