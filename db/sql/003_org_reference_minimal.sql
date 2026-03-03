-- =============================================================================
-- 003_org_reference_minimal.sql
-- SigAI Platform — Organisational reference stubs + platform.modules stub
--
-- Creates the five org dimension tables and a minimal platform.modules table.
-- These are FK targets for governance.asset_submissions and catalog.assets.
-- Full platform schema (with all fields) is created in a later migration.
--
-- Execution order: after 002_create_schemas.sql
-- Target: PostgreSQL 16
-- =============================================================================


-- ---------------------------------------------------------------------------
-- platform.modules  (minimal stub)
--
-- Authoritative module registry. Needed as a FK target for:
--   governance.asset_submissions.source_module_id
--   catalog.assets.source_module_id
--
-- Full schema (short_description, base_path, icon_name, launcher flags, etc.)
-- added in a later platform migration.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform.modules (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    module_key   VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'coming_soon',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_platform_modules          PRIMARY KEY (id),
    CONSTRAINT uq_platform_modules_key      UNIQUE (module_key),
    CONSTRAINT chk_platform_modules_status  CHECK (status IN ('active', 'beta', 'coming_soon', 'deprecated'))
);

COMMENT ON TABLE platform.modules IS
    'Minimal module registry stub. FK target for source_module_id on '
    'governance and catalog tables. Full schema added in platform migration.';

-- Seed the modules known at launch
INSERT INTO platform.modules (module_key, display_name, status) VALUES
    ('catalog',            'Catalog',            'active'),
    ('intake',             'Intake',             'active'),
    ('forge',              'FORGE',              'beta'),
    ('prototype-builder',  'Prototype Builder',  'active'),
    ('app-builder',        'Application Builder','coming_soon'),
    ('pipeline',           'Pipeline',           'coming_soon'),
    ('admin',              'Admin',              'active')
ON CONFLICT (module_key) DO NOTHING;


-- ---------------------------------------------------------------------------
-- org.countries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS org.countries (
    id         UUID    NOT NULL DEFAULT gen_random_uuid(),
    iso_alpha2 CHAR(2) NOT NULL,
    iso_alpha3 CHAR(3) NOT NULL,
    name       VARCHAR(200) NOT NULL,
    region     VARCHAR(10),
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_org_countries         PRIMARY KEY (id),
    CONSTRAINT uq_org_countries_alpha2  UNIQUE (iso_alpha2),
    CONSTRAINT uq_org_countries_alpha3  UNIQUE (iso_alpha3),
    CONSTRAINT chk_org_countries_region CHECK (
        region IS NULL
        OR region IN ('EMEA', 'APAC', 'AMER', 'GLOBAL')
    )
);

COMMENT ON TABLE org.countries IS
    'ISO 3166-1 country reference data. FK target for primary_country_id on '
    'governance and catalog tables, and for data_residency scoping.';

CREATE INDEX IF NOT EXISTS idx_org_countries_region
    ON org.countries (region)
    WHERE is_active = TRUE;


-- ---------------------------------------------------------------------------
-- org.opcos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS org.opcos (
    id                 UUID         NOT NULL DEFAULT gen_random_uuid(),
    code               VARCHAR(50)  NOT NULL,
    name               VARCHAR(200) NOT NULL,
    parent_opco_id     UUID,
    primary_country_id UUID,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_org_opcos              PRIMARY KEY (id),
    CONSTRAINT uq_org_opcos_code         UNIQUE (code),
    CONSTRAINT fk_org_opcos_parent       FOREIGN KEY (parent_opco_id)
        REFERENCES org.opcos (id) ON DELETE RESTRICT,
    CONSTRAINT fk_org_opcos_country      FOREIGN KEY (primary_country_id)
        REFERENCES org.countries (id) ON DELETE SET NULL,
    CONSTRAINT chk_org_opcos_no_selfref  CHECK (id <> parent_opco_id)
);

COMMENT ON TABLE org.opcos IS
    'Operating companies. Supports parent-child hierarchy for subsidiary '
    'modelling. FK target for opco_id on governance and catalog tables.';

CREATE INDEX IF NOT EXISTS idx_org_opcos_parent
    ON org.opcos (parent_opco_id)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_org_opcos_country
    ON org.opcos (primary_country_id)
    WHERE is_active = TRUE;


-- ---------------------------------------------------------------------------
-- org.function_groups
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS org.function_groups (
    id                       UUID         NOT NULL DEFAULT gen_random_uuid(),
    code                     VARCHAR(100) NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    description              TEXT,
    parent_function_group_id UUID,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_org_function_groups           PRIMARY KEY (id),
    CONSTRAINT uq_org_function_groups_code      UNIQUE (code),
    CONSTRAINT fk_org_function_groups_parent    FOREIGN KEY (parent_function_group_id)
        REFERENCES org.function_groups (id) ON DELETE RESTRICT,
    CONSTRAINT chk_org_function_groups_selfref  CHECK (id <> parent_function_group_id)
);

COMMENT ON TABLE org.function_groups IS
    'Functional groupings (e.g. Risk Management, AI & Data Services). '
    'FK target for function_group_id on governance and catalog tables.';

CREATE INDEX IF NOT EXISTS idx_org_function_groups_parent
    ON org.function_groups (parent_function_group_id)
    WHERE is_active = TRUE;


-- ---------------------------------------------------------------------------
-- org.industry_sectors
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS org.industry_sectors (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    code             VARCHAR(100) NOT NULL,
    name             VARCHAR(200) NOT NULL,
    description      TEXT,
    parent_sector_id UUID,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_org_industry_sectors          PRIMARY KEY (id),
    CONSTRAINT uq_org_industry_sectors_code     UNIQUE (code),
    CONSTRAINT fk_org_industry_sectors_parent   FOREIGN KEY (parent_sector_id)
        REFERENCES org.industry_sectors (id) ON DELETE RESTRICT,
    CONSTRAINT chk_org_industry_sectors_selfref CHECK (id <> parent_sector_id)
);

COMMENT ON TABLE org.industry_sectors IS
    'Industry sector classification (e.g. Banking, Insurance, Capital Markets). '
    'Supports parent-child hierarchy for sub-sector modelling.';

CREATE INDEX IF NOT EXISTS idx_org_industry_sectors_parent
    ON org.industry_sectors (parent_sector_id)
    WHERE is_active = TRUE;


-- ---------------------------------------------------------------------------
-- org.service_offerings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS org.service_offerings (
    id                 UUID         NOT NULL DEFAULT gen_random_uuid(),
    code               VARCHAR(100) NOT NULL,
    name               VARCHAR(200) NOT NULL,
    description        TEXT,
    function_group_id  UUID,
    industry_sector_id UUID,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_org_service_offerings             PRIMARY KEY (id),
    CONSTRAINT uq_org_service_offerings_code        UNIQUE (code),
    CONSTRAINT fk_org_service_offerings_func_group  FOREIGN KEY (function_group_id)
        REFERENCES org.function_groups (id) ON DELETE SET NULL,
    CONSTRAINT fk_org_service_offerings_sector      FOREIGN KEY (industry_sector_id)
        REFERENCES org.industry_sectors (id) ON DELETE SET NULL
);

COMMENT ON TABLE org.service_offerings IS
    'Specific products or services the organisation delivers. Anchored to a '
    'function group and optionally to an industry sector.';

CREATE INDEX IF NOT EXISTS idx_org_service_offerings_func
    ON org.service_offerings (function_group_id)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_org_service_offerings_sector
    ON org.service_offerings (industry_sector_id)
    WHERE is_active = TRUE;
