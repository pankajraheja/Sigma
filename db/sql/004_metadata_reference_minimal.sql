-- =============================================================================
-- 004_metadata_reference_minimal.sql
-- SigAI Platform — Metadata reference stubs
--
-- Creates minimal metadata tables needed as FK targets for:
--   catalog.asset_classifications  →  metadata.taxonomy_terms
--   catalog.asset_tags             →  metadata.tags
--
-- These are lightweight stubs. The full metadata schema (concept_schemes,
-- metadata_definitions, picklist_values, etc.) is created in a later
-- migration when the metadata module is built.
--
-- Execution order: after 003_org_reference_minimal.sql
-- Target: PostgreSQL 16
-- =============================================================================


-- ---------------------------------------------------------------------------
-- metadata.taxonomy_terms  (minimal stub)
--
-- Stores controlled vocabulary values across all concept schemes.
-- Full schema adds: concept_schemes table, scheme_id FK, parent_term_id,
-- sort_order, and metadata_definitions support.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS metadata.taxonomy_terms (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    scheme_code VARCHAR(100) NOT NULL,
    code        VARCHAR(100) NOT NULL,
    label       VARCHAR(200) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_metadata_taxonomy_terms        PRIMARY KEY (id),
    CONSTRAINT uq_metadata_taxonomy_terms_code   UNIQUE (scheme_code, code)
);

COMMENT ON TABLE metadata.taxonomy_terms IS
    'Minimal taxonomy term stub. FK target for catalog.asset_classifications.term_id. '
    'Full schema (concept_schemes, parent hierarchy, sort_order) added in the '
    'metadata schema migration.';

CREATE INDEX IF NOT EXISTS idx_metadata_taxonomy_terms_scheme
    ON metadata.taxonomy_terms (scheme_code)
    WHERE is_active = TRUE;

-- Seed core taxonomy values used by the catalog
-- scheme: asset_kind
INSERT INTO metadata.taxonomy_terms (scheme_code, code, label) VALUES
    ('asset_kind', 'dataset',    'Dataset'),
    ('asset_kind', 'api',        'API'),
    ('asset_kind', 'report',     'Report'),
    ('asset_kind', 'model',      'Model'),
    ('asset_kind', 'dashboard',  'Dashboard'),
    ('asset_kind', 'pipeline',   'Pipeline'),
    ('asset_kind', 'template',   'Template'),
    ('asset_kind', 'skill',      'Skill'),
    ('asset_kind', 'connector',  'Connector')
ON CONFLICT (scheme_code, code) DO NOTHING;

-- scheme: domain
INSERT INTO metadata.taxonomy_terms (scheme_code, code, label) VALUES
    ('domain', 'banking_finance',  'Banking & Finance'),
    ('domain', 'risk_compliance',  'Risk & Compliance'),
    ('domain', 'capital_markets',  'Capital Markets'),
    ('domain', 'insurance',        'Insurance'),
    ('domain', 'ai_data_services', 'AI & Data Services'),
    ('domain', 'tech_infra',       'Technology & Infrastructure'),
    ('domain', 'hr_people',        'HR & People'),
    ('domain', 'legal_tax',        'Legal & Tax'),
    ('domain', 'operations',       'Operations'),
    ('domain', 'marketing_sales',  'Marketing & Sales')
ON CONFLICT (scheme_code, code) DO NOTHING;

-- scheme: compliance_tag
INSERT INTO metadata.taxonomy_terms (scheme_code, code, label) VALUES
    ('compliance_tag', 'gdpr',     'GDPR'),
    ('compliance_tag', 'sox',      'SOX'),
    ('compliance_tag', 'pci_dss',  'PCI-DSS'),
    ('compliance_tag', 'iso27001', 'ISO 27001'),
    ('compliance_tag', 'soc2',     'SOC 2 Type II'),
    ('compliance_tag', 'hipaa',    'HIPAA'),
    ('compliance_tag', 'fca',      'FCA'),
    ('compliance_tag', 'mifid2',   'MiFID II'),
    ('compliance_tag', 'basel3',   'Basel III')
ON CONFLICT (scheme_code, code) DO NOTHING;


-- ---------------------------------------------------------------------------
-- metadata.tags  (minimal stub)
--
-- User-contributed informal labels. FK target for catalog.asset_tags.tag_id.
-- Full schema adds: created_by UUID FK to identity.users.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS metadata.tags (
    id         UUID         NOT NULL DEFAULT gen_random_uuid(),
    label      VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_metadata_tags       PRIMARY KEY (id),
    CONSTRAINT uq_metadata_tags_label UNIQUE (label),
    -- Normalisation enforced at DB level: labels must be lowercase and trimmed
    CONSTRAINT chk_metadata_tags_normalised CHECK (label = lower(trim(label)))
);

COMMENT ON TABLE metadata.tags IS
    'Minimal tag stub. FK target for catalog.asset_tags.tag_id. '
    'Normalisation constraint enforces lowercase, trimmed labels. '
    'created_by FK to identity.users added in the identity schema migration.';

-- Trigram index for fast ILIKE prefix autocomplete
CREATE INDEX IF NOT EXISTS idx_metadata_tags_label_trgm
    ON metadata.tags USING GIN (label gin_trgm_ops);
