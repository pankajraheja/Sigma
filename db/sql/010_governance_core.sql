-- =============================================================================
-- 010_governance_core.sql
-- SigAI Platform — Governance schema: core tables
--
-- Creates all governance tables that manage the asset approval pipeline:
--   stage_configs           — configurable review stages (global defaults)
--   asset_submissions       — submission records linking source assets to pipeline
--   submission_stage_runs   — per-stage execution tracking for each submission
--   submission_reviews      — individual reviewer decisions within a stage run
--   publication_promotions  — records each catalog publication status change
--   audit_trail             — append-only platform-wide event log
--
-- FK DEPENDENCIES (must be created first):
--   002_create_schemas.sql  → platform.set_updated_at()
--   003_org_reference_minimal.sql → platform.modules, org.*
--
-- DEFERRED FKs:
--   submission-related user columns (submitted_by, resolver_id, assignee_id,
--   reviewer_id, promoted_by, performed_by) will reference identity.users(id)
--   when the identity schema migration runs. Columns exist; FKs are annotated.
--
--   stage_configs.required_role_id will reference identity.roles(id) when
--   the identity schema migration runs.
--
--   governance.publication_promotions.catalog_asset_id will reference
--   catalog.assets(id) — FK added in 020_catalog_core.sql via ALTER TABLE
--   because catalog schema does not yet exist at this point.
--
-- Execution order: after 004_metadata_reference_minimal.sql
-- Target: PostgreSQL 16
-- =============================================================================


-- =============================================================================
-- governance.stage_configs
--
-- Configures the ordered review stages of the governance pipeline.
-- Each stage is a checkpoint that submissions must pass before approval.
-- This is configuration/reference data managed by platform administrators.
--
-- NOTE: required_role_id is intentionally unbound — FK to identity.roles(id)
-- is added when the identity schema migration runs.
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance.stage_configs (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    code             VARCHAR(100) NOT NULL,
    name             VARCHAR(200) NOT NULL,
    description      TEXT,
    sequence_order   SMALLINT     NOT NULL,
    is_required      BOOLEAN      NOT NULL DEFAULT TRUE,

    -- FK: references identity.roles(id) ON DELETE SET NULL
    -- Deferred until identity schema migration.
    required_role_id UUID,

    sla_hours        SMALLINT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_governance_stage_configs       PRIMARY KEY (id),
    CONSTRAINT uq_governance_stage_configs_code  UNIQUE (code),
    CONSTRAINT chk_stage_configs_order           CHECK (sequence_order > 0),
    CONSTRAINT chk_stage_configs_sla             CHECK (sla_hours IS NULL OR sla_hours > 0)
);

COMMENT ON TABLE governance.stage_configs IS
    'Configurable review pipeline stages. Lower sequence_order = earlier stage. '
    'Stages with the same sequence_order are considered parallel and resolved by '
    'application logic. required_role_id FK to identity.roles added in identity migration.';

CREATE INDEX IF NOT EXISTS idx_governance_stage_configs_order
    ON governance.stage_configs (sequence_order);

-- updated_at trigger
CREATE TRIGGER trg_stage_configs_updated_at
    BEFORE UPDATE ON governance.stage_configs
    FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

-- Seed default pipeline stages
INSERT INTO governance.stage_configs
    (code, name, description, sequence_order, is_required, sla_hours)
VALUES
    ('nfr_review',
     'NFR Review',
     'Validate non-functional requirements: data classification, PII, hosting, residency, retention, SLA.',
     10, TRUE, 48),
    ('technical_review',
     'Technical Review',
     'Assess technical quality, API design, schema correctness, and documentation completeness.',
     20, TRUE, 72),
    ('security_review',
     'Security Review',
     'Security assessment: data exposure risks, encryption, access patterns, vulnerability check.',
     30, TRUE, 72),
    ('data_governance_review',
     'Data Governance Review',
     'Confirm lineage, owner accountability, stewardship assignment, and metadata completeness.',
     40, TRUE, 48),
    ('final_approval',
     'Final Approval',
     'Sign-off by authorised approver before promotion to catalog.',
     50, TRUE, 24)
ON CONFLICT (code) DO NOTHING;


-- =============================================================================
-- governance.asset_submissions
--
-- Central record for each governance submission. Created when a source-module
-- contributor submits an asset for review.
--
-- Owns:
--   - Source traceability (which module + which entity was submitted)
--   - Governance lifecycle status (pending → in_review → approved/rejected/withdrawn)
--   - NFR declarations (data_classification, PII, hosting, etc.) as governance inputs
--   - Org scope context (country, opco, function group, sector, offering)
--
-- NFRs are INFORMATIONAL INPUTS — not access-control rules.
-- Access control is derived from identity roles and scope bindings (separate schema).
--
-- NOTE: submitted_by, resolver_id reference identity.users(id).
-- FKs deferred until identity schema migration. Columns are NOT NULL / nullable
-- as specified; application layer enforces identity validity until then.
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance.asset_submissions (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid(),

    -- Source traceability: which module owns this asset and which entity was submitted.
    -- source_entity_id is a soft reference — points to a UUID in the source module's
    -- own DB. No cross-DB FK is possible; application validates before insert.
    source_module_id     UUID         NOT NULL,
    source_entity_type   VARCHAR(100) NOT NULL,
    source_entity_id     UUID         NOT NULL,

    -- Submitter: FK references identity.users(id) ON DELETE RESTRICT
    -- Deferred until identity schema migration.
    submitted_by         UUID         NOT NULL,
    submitted_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Governance lifecycle
    governance_status    VARCHAR(20)  NOT NULL DEFAULT 'pending',
    current_stage_id     UUID,

    -- Resolution (set when status reaches approved/rejected/withdrawn)
    resolved_at          TIMESTAMPTZ,
    -- resolver_id: FK references identity.users(id) ON DELETE SET NULL — deferred.
    resolver_id          UUID,
    submission_notes     TEXT,
    resolver_notes       TEXT,

    -- -------------------------------------------------------------------------
    -- NFR fields — descriptive governance inputs, NOT access-control rules.
    -- Captured during review; denormalised onto catalog.assets at promotion.
    -- -------------------------------------------------------------------------
    data_classification  VARCHAR(20),
    hosting_type         VARCHAR(20),
    audience_type        VARCHAR(20),
    business_criticality VARCHAR(20),

    -- ISO-3166-1 alpha-2 country code or 'global' — where data must reside/be processed
    data_residency       VARCHAR(10),

    contains_pii         BOOLEAN      NOT NULL DEFAULT FALSE,
    is_client_facing     BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Free-text NFR fields
    retention_requirement VARCHAR(300),
    sla_description       TEXT,

    -- Array of compliance tag codes (e.g. '{gdpr,sox,pci_dss}').
    -- Values must match metadata.taxonomy_terms.code where scheme_code = 'compliance_tag'.
    -- Referential integrity enforced by application; a junction table alternative
    -- is documented in docs/schema/spec/cross-schema.md (Design Risk 2).
    compliance_tags      TEXT[],

    -- -------------------------------------------------------------------------
    -- Org dimensions — first-class FK columns, not free-text
    -- -------------------------------------------------------------------------
    primary_country_id   UUID,
    opco_id              UUID,
    function_group_id    UUID,
    industry_sector_id   UUID,
    service_offering_id  UUID,

    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- -------------------------------------------------------------------------
    -- Constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT pk_governance_asset_submissions          PRIMARY KEY (id),

    -- FK: source module must exist
    CONSTRAINT fk_asset_subs_source_module              FOREIGN KEY (source_module_id)
        REFERENCES platform.modules (id) ON DELETE RESTRICT,

    -- FK: active stage must be a configured stage
    CONSTRAINT fk_asset_subs_current_stage              FOREIGN KEY (current_stage_id)
        REFERENCES governance.stage_configs (id) ON DELETE SET NULL,

    -- FK: org dimensions
    CONSTRAINT fk_asset_subs_country                    FOREIGN KEY (primary_country_id)
        REFERENCES org.countries (id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_subs_opco                       FOREIGN KEY (opco_id)
        REFERENCES org.opcos (id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_subs_function_group             FOREIGN KEY (function_group_id)
        REFERENCES org.function_groups (id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_subs_industry_sector            FOREIGN KEY (industry_sector_id)
        REFERENCES org.industry_sectors (id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_subs_service_offering           FOREIGN KEY (service_offering_id)
        REFERENCES org.service_offerings (id) ON DELETE SET NULL,

    -- Value constraints
    CONSTRAINT chk_asset_subs_status                    CHECK (
        governance_status IN ('pending', 'in_review', 'approved', 'rejected', 'withdrawn')
    ),
    CONSTRAINT chk_asset_subs_classification            CHECK (
        data_classification IS NULL
        OR data_classification IN ('public', 'internal', 'confidential', 'restricted')
    ),
    CONSTRAINT chk_asset_subs_hosting                   CHECK (
        hosting_type IS NULL
        OR hosting_type IN ('cloud', 'on_premise', 'hybrid', 'saas')
    ),
    CONSTRAINT chk_asset_subs_audience                  CHECK (
        audience_type IS NULL
        OR audience_type IN ('internal', 'external', 'partner', 'cross_entity')
    ),
    CONSTRAINT chk_asset_subs_criticality               CHECK (
        business_criticality IS NULL
        OR business_criticality IN ('low', 'medium', 'high', 'critical')
    ),
    -- resolved_at is only permitted when governance_status is terminal
    CONSTRAINT chk_asset_subs_resolved_state            CHECK (
        resolved_at IS NULL
        OR governance_status IN ('approved', 'rejected', 'withdrawn')
    ),
    -- resolver_id requires a terminal status
    CONSTRAINT chk_asset_subs_resolver_state            CHECK (
        resolver_id IS NULL
        OR governance_status IN ('approved', 'rejected', 'withdrawn')
    )
);

COMMENT ON TABLE governance.asset_submissions IS
    'Central governance submission record. Created when a source-module contributor '
    'submits an asset for review. Tracks governance_status independently from the '
    'source module''s internal status and from catalog.assets.publication_status. '
    'NFR fields are informational governance inputs — not access-control rules.';

-- updated_at trigger
CREATE TRIGGER trg_asset_submissions_updated_at
    BEFORE UPDATE ON governance.asset_submissions
    FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at();

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Active submission queue filtering
CREATE INDEX IF NOT EXISTS idx_asset_subs_status
    ON governance.asset_submissions (governance_status);

-- Submission history for a specific source entity (source traceability lookup)
CREATE INDEX IF NOT EXISTS idx_asset_subs_source
    ON governance.asset_submissions (source_module_id, source_entity_type, source_entity_id);

-- Enforce at most ONE active (non-terminal) submission per source entity.
-- A new submission may only be created once the previous is approved/rejected/withdrawn.
CREATE UNIQUE INDEX IF NOT EXISTS uix_asset_subs_one_active_per_source
    ON governance.asset_submissions (source_module_id, source_entity_type, source_entity_id)
    WHERE governance_status NOT IN ('approved', 'rejected', 'withdrawn');

-- User-scoped submission lists (submitter dashboard)
CREATE INDEX IF NOT EXISTS idx_asset_subs_submitted_by
    ON governance.asset_submissions (submitted_by, submitted_at DESC);

-- Recency ordering (global pipeline queue)
CREATE INDEX IF NOT EXISTS idx_asset_subs_submitted_at
    ON governance.asset_submissions (submitted_at DESC);

-- Org dimension filters — each dimension gets its own index for flexible filtering
-- and optimal planner choice when combined with other predicates.
CREATE INDEX IF NOT EXISTS idx_asset_subs_opco
    ON governance.asset_submissions (opco_id)
    WHERE opco_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_subs_country
    ON governance.asset_submissions (primary_country_id)
    WHERE primary_country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_subs_function_group
    ON governance.asset_submissions (function_group_id)
    WHERE function_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_subs_industry_sector
    ON governance.asset_submissions (industry_sector_id)
    WHERE industry_sector_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_subs_service_offering
    ON governance.asset_submissions (service_offering_id)
    WHERE service_offering_id IS NOT NULL;

-- NFR filtering (governance dashboard views)
CREATE INDEX IF NOT EXISTS idx_asset_subs_classification
    ON governance.asset_submissions (data_classification)
    WHERE data_classification IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_subs_pii
    ON governance.asset_submissions (contains_pii)
    WHERE contains_pii = TRUE;

-- GIN index on compliance_tags array for containment queries:
--   WHERE compliance_tags @> ARRAY['gdpr']
CREATE INDEX IF NOT EXISTS idx_asset_subs_compliance_tags
    ON governance.asset_submissions USING GIN (compliance_tags)
    WHERE compliance_tags IS NOT NULL;


-- =============================================================================
-- governance.submission_stage_runs
--
-- Tracks execution of each configured pipeline stage for a given submission.
-- One row per (submission, stage) pair. Created when the governance pipeline
-- is initialised for a new submission.
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance.submission_stage_runs (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    submission_id UUID        NOT NULL,
    stage_id      UUID        NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,

    -- assignee_id: FK references identity.users(id) ON DELETE SET NULL — deferred.
    assignee_id   UUID,
    stage_notes   TEXT,

    CONSTRAINT pk_governance_submission_stage_runs       PRIMARY KEY (id),
    CONSTRAINT uq_submission_stage_runs_one_per_stage    UNIQUE (submission_id, stage_id),

    CONSTRAINT fk_stage_runs_submission                  FOREIGN KEY (submission_id)
        REFERENCES governance.asset_submissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_stage_runs_stage                       FOREIGN KEY (stage_id)
        REFERENCES governance.stage_configs (id) ON DELETE RESTRICT,

    CONSTRAINT chk_stage_runs_status                     CHECK (
        status IN ('pending', 'in_progress', 'passed', 'failed', 'skipped')
    ),
    -- completed_at only permitted once a terminal status is reached
    CONSTRAINT chk_stage_runs_completion                 CHECK (
        completed_at IS NULL
        OR status IN ('passed', 'failed', 'skipped')
    ),
    -- started_at must not be after completed_at
    CONSTRAINT chk_stage_runs_timeline                   CHECK (
        started_at IS NULL
        OR completed_at IS NULL
        OR started_at <= completed_at
    )
);

COMMENT ON TABLE governance.submission_stage_runs IS
    'Per-stage execution tracking for each governance submission. '
    'One row per (submission_id, stage_id). Created when the pipeline is '
    'initialised for a submission. assignee_id FK to identity.users added in '
    'identity migration.';

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- All stages for a submission (primary access pattern for pipeline view)
CREATE INDEX IF NOT EXISTS idx_stage_runs_submission
    ON governance.submission_stage_runs (submission_id);

-- Stage-level dashboard: all active/pending runs for a specific stage
CREATE INDEX IF NOT EXISTS idx_stage_runs_stage_status
    ON governance.submission_stage_runs (stage_id, status);

-- Reviewer workqueue: open assignments for a specific assignee
CREATE INDEX IF NOT EXISTS idx_stage_runs_assignee
    ON governance.submission_stage_runs (assignee_id, status)
    WHERE assignee_id IS NOT NULL AND status IN ('pending', 'in_progress');


-- =============================================================================
-- governance.submission_reviews
--
-- Individual reviewer decisions recorded within a stage run.
-- A stage run may accumulate multiple review records (e.g. request_changes
-- followed by a later approve). Stage terminal status is determined by the
-- application logic over the set of review records for a stage run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance.submission_reviews (
    id            UUID        NOT NULL DEFAULT gen_random_uuid(),
    submission_id UUID        NOT NULL,
    stage_run_id  UUID        NOT NULL,

    -- reviewer_id: FK references identity.users(id) ON DELETE RESTRICT — deferred.
    reviewer_id   UUID        NOT NULL,
    reviewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decision      VARCHAR(20) NOT NULL,

    -- comments required by application when decision is 'reject' or 'request_changes'
    comments      TEXT,

    CONSTRAINT pk_governance_submission_reviews    PRIMARY KEY (id),

    CONSTRAINT fk_reviews_submission               FOREIGN KEY (submission_id)
        REFERENCES governance.asset_submissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_stage_run                FOREIGN KEY (stage_run_id)
        REFERENCES governance.submission_stage_runs (id) ON DELETE CASCADE,

    CONSTRAINT chk_reviews_decision                CHECK (
        decision IN ('approve', 'reject', 'request_changes', 'defer')
    )
);

COMMENT ON TABLE governance.submission_reviews IS
    'Individual reviewer decisions within a stage run. Multiple reviews per '
    'stage run are permitted (e.g. a reviewer may request changes then later '
    'approve). reviewer_id FK to identity.users added in identity migration.';

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- All reviews for a submission (audit and pipeline views)
CREATE INDEX IF NOT EXISTS idx_submission_reviews_submission
    ON governance.submission_reviews (submission_id);

-- Reviews within a single stage run (decision aggregation)
CREATE INDEX IF NOT EXISTS idx_submission_reviews_stage_run
    ON governance.submission_reviews (stage_run_id);

-- Reviewer activity history
CREATE INDEX IF NOT EXISTS idx_submission_reviews_reviewer
    ON governance.submission_reviews (reviewer_id, reviewed_at DESC);


-- =============================================================================
-- governance.publication_promotions
--
-- Records every event that changes a catalog asset's publication status.
-- Created by the governance promotion service whenever an approved submission
-- results in a new catalog entry (preview) or a status transition
-- (preview → ga, ga → deprecated, deprecated → retired).
--
-- NOTE: catalog_asset_id FK to catalog.assets(id) is deferred —
-- it is added in 020_catalog_core.sql via ALTER TABLE after catalog.assets
-- is created. The column is defined as NOT NULL here; the FK constraint
-- enforces the referential integrity once catalog exists.
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance.publication_promotions (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    submission_id    UUID        NOT NULL,

    -- catalog_asset_id: FK to catalog.assets(id) ON DELETE RESTRICT
    -- Added via ALTER TABLE in 020_catalog_core.sql
    catalog_asset_id UUID        NOT NULL,

    -- promoted_by: FK references identity.users(id) ON DELETE RESTRICT — deferred.
    promoted_by      UUID        NOT NULL,
    promoted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- NULL when this is the first publication of a catalog asset
    from_status      VARCHAR(20),
    to_status        VARCHAR(20) NOT NULL,
    notes            TEXT,

    CONSTRAINT pk_governance_publication_promotions    PRIMARY KEY (id),

    CONSTRAINT fk_promotions_submission                FOREIGN KEY (submission_id)
        REFERENCES governance.asset_submissions (id) ON DELETE RESTRICT,

    CONSTRAINT chk_promotions_from_status              CHECK (
        from_status IS NULL
        OR from_status IN ('preview', 'ga', 'deprecated', 'retired')
    ),
    CONSTRAINT chk_promotions_to_status                CHECK (
        to_status IN ('preview', 'ga', 'deprecated', 'retired')
    ),
    -- A promotion must represent a status change
    CONSTRAINT chk_promotions_status_changed           CHECK (
        from_status IS DISTINCT FROM to_status
    )
);

COMMENT ON TABLE governance.publication_promotions IS
    'Immutable record of every catalog publication status change. '
    'catalog_asset_id FK to catalog.assets(id) is added in 020_catalog_core.sql. '
    'promoted_by FK to identity.users added in identity migration.';

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Full promotion history for a catalog asset (ordered most-recent first)
CREATE INDEX IF NOT EXISTS idx_promotions_catalog_asset
    ON governance.publication_promotions (catalog_asset_id, promoted_at DESC);

-- All promotions produced by a submission
CREATE INDEX IF NOT EXISTS idx_promotions_submission
    ON governance.publication_promotions (submission_id);

-- Time-ordered promotion log
CREATE INDEX IF NOT EXISTS idx_promotions_promoted_at
    ON governance.publication_promotions (promoted_at DESC);


-- =============================================================================
-- governance.audit_trail
--
-- Append-only event log covering all significant state changes across the
-- entire platform. Insert-only — rows are never updated or deleted.
-- Serves compliance, debugging, and operational review requirements.
--
-- entity_type + entity_id form a soft polymorphic reference. No DB-level FK
-- is enforced (the target table is determined by entity_type at runtime).
-- performed_by FK to identity.users added in identity migration.
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance.audit_trail (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    entity_type  VARCHAR(100) NOT NULL,
    entity_id    UUID         NOT NULL,

    -- Past-tense verb describing the event, e.g.:
    --   submitted | stage_started | stage_passed | stage_failed
    --   approved  | rejected      | withdrawn
    --   promoted_to_preview | promoted_to_ga | deprecated | retired
    --   certified | certification_revoked
    --   tag_added | tag_removed | classification_changed
    action       VARCHAR(100) NOT NULL,

    -- performed_by: FK references identity.users(id) ON DELETE SET NULL — deferred.
    -- NULL for system-initiated events (e.g. automated pipeline transitions).
    performed_by UUID,
    performed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Partial JSON snapshots of the relevant fields before/after the action.
    -- Do NOT store full entity snapshots — capture only the fields relevant to
    -- the action to keep storage manageable.
    before_state JSONB,
    after_state  JSONB,

    -- Operational context: request_id, ip_address, user_agent, trace_id, etc.
    metadata     JSONB,

    CONSTRAINT pk_governance_audit_trail PRIMARY KEY (id)

    -- No additional CHECK constraints on entity_type or action to keep the
    -- table fully extensible as new entity types and event verbs are added.
    -- entity_type values should follow the pattern 'schema.table' or 'schema.concept'.
);

COMMENT ON TABLE governance.audit_trail IS
    'Append-only platform-wide event log. Insert only — never UPDATE or DELETE. '
    'entity_type + entity_id are a soft polymorphic reference. performed_by FK '
    'to identity.users added in identity migration. Partition by performed_at '
    '(range, monthly) before production deployment — see docs/schema/spec/cross-schema.md '
    'Design Risk 9.';

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Primary access pattern: all events for a given entity
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity
    ON governance.audit_trail (entity_type, entity_id, performed_at DESC);

-- User activity timeline (compliance and access reviews)
CREATE INDEX IF NOT EXISTS idx_audit_trail_performer
    ON governance.audit_trail (performed_by, performed_at DESC)
    WHERE performed_by IS NOT NULL;

-- Global time-ordered audit log
CREATE INDEX IF NOT EXISTS idx_audit_trail_performed_at
    ON governance.audit_trail (performed_at DESC);

-- JSONB field search on before/after state snapshots (used in audit queries)
CREATE INDEX IF NOT EXISTS idx_audit_trail_before_state
    ON governance.audit_trail USING GIN (before_state)
    WHERE before_state IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_trail_after_state
    ON governance.audit_trail USING GIN (after_state)
    WHERE after_state IS NOT NULL;
