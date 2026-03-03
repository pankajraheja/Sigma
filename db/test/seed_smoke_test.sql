-- =============================================================================
-- db/test/seed_smoke_test.sql
-- SigAI Platform — Governance + Catalog backbone smoke test seed
--
-- Validates the full platform flow:
--   source item → submission → stage review → approval → promotion → catalog
--
-- PREREQUISITES:
--   All files in db/sql/ must be applied first (001 through 020).
--
-- IDEMPOTENT: safe to re-run. A cleanup block at the top removes any records
--   from a previous run before re-inserting.
--
-- FIXED TEST CONSTANTS (used so cleanup and validation queries can target them):
--   Source entity:  cafecafe-0000-4000-8000-000000000042
--   Test user:      00000000-0000-0000-0000-000000000099
--   Org codes:      SMOKE_* prefix on all org records
--   Country code:   XT  (not a real ISO 3166-1 code — reserved for testing)
--
-- EXECUTION:
--   psql -d <database> -f db/test/seed_smoke_test.sql
--
-- Target: PostgreSQL 16
-- =============================================================================


-- =============================================================================
-- STEP 0 — Cleanup: remove any records from a previous smoke test run
-- =============================================================================
-- Runs in its own block so cleanup failures don't prevent the seed from running.

DO $$
DECLARE
    c_source_entity_id UUID := 'cafecafe-0000-4000-8000-000000000042';
BEGIN
    -- publication_promotions has RESTRICT FKs to both submissions and catalog.assets,
    -- so it must be deleted before either of those.
    DELETE FROM governance.publication_promotions
    WHERE submission_id IN (
        SELECT id FROM governance.asset_submissions
        WHERE source_entity_id = c_source_entity_id
    );

    -- catalog.assets deletion cascades to:
    --   asset_versions, asset_classifications, asset_tags, asset_source_refs
    DELETE FROM catalog.assets
    WHERE source_entity_id = c_source_entity_id;

    -- asset_submissions deletion cascades to:
    --   submission_stage_runs, submission_reviews
    DELETE FROM governance.asset_submissions
    WHERE source_entity_id = c_source_entity_id;

    -- Remove smoke-test org records (prefixed SMOKE_ for safety)
    DELETE FROM org.service_offerings  WHERE code = 'SMOKE_FRAUD_DETECT';
    DELETE FROM org.industry_sectors   WHERE code = 'SMOKE_BANKING';
    DELETE FROM org.function_groups    WHERE code = 'SMOKE_RISK_MGMT';
    DELETE FROM org.opcos              WHERE code = 'SMOKE_UK_BANKING';
    DELETE FROM org.countries          WHERE iso_alpha2 = 'XT';

    -- Remove smoke-test audit trail entries
    DELETE FROM governance.audit_trail
    WHERE metadata->>'smoke_test' = 'true';

    RAISE NOTICE '[0/9] Cleanup complete — previous smoke test records removed (or none existed).';
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- MAIN SEED — Runs as a single transaction. If any step fails, all roll back.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    -- -------------------------------------------------------------------------
    -- Fixed test constants — referenced by cleanup and validation queries
    -- -------------------------------------------------------------------------
    c_smoke_user_id    UUID := '00000000-0000-0000-0000-000000000099';
    -- Simulates the UUID of a FORGE workflow record in the FORGE module's own DB.
    -- This is a soft reference (no cross-DB FK) — exactly as the real system works.
    c_source_entity_id UUID := 'cafecafe-0000-4000-8000-000000000042';

    -- -------------------------------------------------------------------------
    -- Looked-up IDs from existing seeded reference data
    -- -------------------------------------------------------------------------
    v_forge_module_id    UUID;
    v_nfr_stage_id       UUID;
    v_final_stage_id     UUID;

    -- -------------------------------------------------------------------------
    -- IDs for records inserted during this smoke test
    -- -------------------------------------------------------------------------
    v_country_id          UUID;
    v_opco_id             UUID;
    v_function_group_id   UUID;
    v_industry_sector_id  UUID;
    v_service_offering_id UUID;
    v_submission_id       UUID;
    v_stage_run_id        UUID;
    v_review_id           UUID;
    v_catalog_asset_id    UUID;
    v_promotion_id_1      UUID;  -- preview promotion
    v_promotion_id_2      UUID;  -- ga promotion
    v_version_id          UUID;
    v_source_ref_id       UUID;

BEGIN

    -- =========================================================================
    -- Look up reference data IDs from the seeded tables
    -- (These were seeded in 003_org_reference_minimal.sql and 010_governance_core.sql)
    -- =========================================================================

    SELECT id INTO v_forge_module_id
    FROM platform.modules WHERE module_key = 'forge';

    IF v_forge_module_id IS NULL THEN
        RAISE EXCEPTION 'FORGE module not found. Run db/sql/ files first (003_org_reference_minimal.sql).';
    END IF;

    SELECT id INTO v_nfr_stage_id
    FROM governance.stage_configs WHERE code = 'nfr_review';

    SELECT id INTO v_final_stage_id
    FROM governance.stage_configs WHERE code = 'final_approval';

    IF v_nfr_stage_id IS NULL OR v_final_stage_id IS NULL THEN
        RAISE EXCEPTION 'Stage configs not found. Run db/sql/010_governance_core.sql first.';
    END IF;

    RAISE NOTICE '     Resolved: forge module = %', v_forge_module_id;
    RAISE NOTICE '     Resolved: nfr_review stage = %', v_nfr_stage_id;
    RAISE NOTICE '     Resolved: final_approval stage = %', v_final_stage_id;


    -- =========================================================================
    -- STEP 1 — Insert minimal org reference records
    -- =========================================================================
    -- country_id, opco_id, function_group_id, industry_sector_id,
    -- service_offering_id are all first-class FKs that will be used on
    -- the submission and catalog.asset rows.
    -- =========================================================================

    -- Country: 'XT' is not a real ISO 3166-1 code — reserved for smoke testing.
    INSERT INTO org.countries (iso_alpha2, iso_alpha3, name, region)
    VALUES ('XT', 'XXT', 'Smoke Test Country (not real)', 'EMEA')
    ON CONFLICT (iso_alpha2) DO UPDATE
        SET name = EXCLUDED.name
    RETURNING id INTO v_country_id;

    -- OpCo anchored to the test country
    INSERT INTO org.opcos (code, name, primary_country_id)
    VALUES ('SMOKE_UK_BANKING', 'Smoke Test UK Banking Division', v_country_id)
    ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name, primary_country_id = EXCLUDED.primary_country_id
    RETURNING id INTO v_opco_id;

    -- Function group
    INSERT INTO org.function_groups (code, name, description)
    VALUES (
        'SMOKE_RISK_MGMT',
        'Smoke Test Risk Management',
        'Risk management function group for smoke testing.'
    )
    ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name
    RETURNING id INTO v_function_group_id;

    -- Industry sector
    INSERT INTO org.industry_sectors (code, name, description)
    VALUES (
        'SMOKE_BANKING',
        'Smoke Test Banking',
        'Banking sector for smoke testing.'
    )
    ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name
    RETURNING id INTO v_industry_sector_id;

    -- Service offering anchored to function group + industry sector
    INSERT INTO org.service_offerings (code, name, description, function_group_id, industry_sector_id)
    VALUES (
        'SMOKE_FRAUD_DETECT',
        'Smoke Test Fraud Detection',
        'Fraud detection service offering for smoke testing.',
        v_function_group_id,
        v_industry_sector_id
    )
    ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            function_group_id  = EXCLUDED.function_group_id,
            industry_sector_id = EXCLUDED.industry_sector_id
    RETURNING id INTO v_service_offering_id;

    RAISE NOTICE '[1/9] Org reference records inserted:';
    RAISE NOTICE '      country=% opco=% func_group=% sector=% offering=%',
        v_country_id, v_opco_id, v_function_group_id, v_industry_sector_id, v_service_offering_id;


    -- =========================================================================
    -- STEP 2 — Insert governance.asset_submissions
    --
    -- Represents a FORGE Fraud Detection Workflow being submitted for governance
    -- review. The submission starts in 'in_review' state with the NFR Review
    -- stage active (simulating that the pipeline has been initiated).
    --
    -- governance_status valid values: pending | in_review | approved | rejected | withdrawn
    -- Note: 'submitted' is not a status in this schema — the equivalent is
    -- 'pending' (just created) or 'in_review' (pipeline initiated). We use
    -- 'in_review' here to represent a submission actively being reviewed.
    --
    -- submitted_by uses the fixed test user UUID because identity.users does
    -- not exist yet. The FK constraint will be enforced after identity migration.
    -- =========================================================================

    INSERT INTO governance.asset_submissions (
        source_module_id,
        source_entity_type,
        source_entity_id,
        submitted_by,
        governance_status,
        current_stage_id,
        submission_notes,
        -- NFR fields — informational governance inputs, NOT access-control rules
        data_classification,
        hosting_type,
        audience_type,
        business_criticality,
        data_residency,
        contains_pii,
        is_client_facing,
        retention_requirement,
        sla_description,
        compliance_tags,
        -- Org dimension FKs
        primary_country_id,
        opco_id,
        function_group_id,
        industry_sector_id,
        service_offering_id
    )
    VALUES (
        v_forge_module_id,
        'workflow',                           -- source entity type in FORGE's own DB
        c_source_entity_id,                   -- the fixed fake FORGE workflow UUID
        c_smoke_user_id,                      -- test user (pre-identity FK)
        'in_review',                          -- governance lifecycle: pipeline active
        v_nfr_stage_id,                       -- currently at NFR Review stage
        'Fraud Detection Workflow v2 — submitting for governance review. '
            'PII confirmed: transaction data includes customer IDs. '
            'Hosting: cloud (Azure). Classification: confidential.',
        -- NFR values
        'confidential',                       -- data_classification
        'cloud',                              -- hosting_type
        'internal',                           -- audience_type: internal risk teams only
        'high',                               -- business_criticality
        'GB',                                 -- data_residency: must remain in UK
        TRUE,                                 -- contains_pii: yes — customer transaction IDs
        FALSE,                                -- is_client_facing: no — internal risk tool
        '7 years (FCA SYSC 9.1)',             -- retention_requirement
        '99.5% uptime, p95 latency < 500ms', -- sla_description
        ARRAY['gdpr', 'fca', 'sox'],          -- compliance_tags
        -- Org FKs
        v_country_id,
        v_opco_id,
        v_function_group_id,
        v_industry_sector_id,
        v_service_offering_id
    )
    RETURNING id INTO v_submission_id;

    RAISE NOTICE '[2/9] Asset submission inserted: %', v_submission_id;
    RAISE NOTICE '      source: forge / workflow / %', c_source_entity_id;
    RAISE NOTICE '      governance_status = in_review, stage = nfr_review';


    -- =========================================================================
    -- STEP 3 — Insert governance.submission_stage_runs
    --
    -- Creates a stage run for the NFR Review stage, simulating that
    -- the reviewer has completed their assessment.
    -- =========================================================================

    INSERT INTO governance.submission_stage_runs (
        submission_id,
        stage_id,
        status,
        started_at,
        completed_at,
        assignee_id,          -- test user (pre-identity FK)
        stage_notes
    )
    VALUES (
        v_submission_id,
        v_nfr_stage_id,
        'passed',             -- stage run reached terminal state: passed
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '30 minutes',
        c_smoke_user_id,
        'NFR fields verified: PII classification confirmed, hosting architecture reviewed, '
            'data residency constraint recorded (UK/GB), FCA and GDPR tags validated. '
            'Retention policy aligned with FCA SYSC 9.1. Proceeding to Technical Review.'
    )
    RETURNING id INTO v_stage_run_id;

    RAISE NOTICE '[3/9] Submission stage run inserted: %', v_stage_run_id;
    RAISE NOTICE '      stage = nfr_review, status = passed';


    -- =========================================================================
    -- STEP 4 — Insert governance.submission_reviews
    --
    -- Records the reviewer's approval decision for the NFR Review stage.
    -- In the real system, multiple reviews per stage are possible (e.g.
    -- request_changes followed by approve). Here we record a direct approve.
    -- =========================================================================

    INSERT INTO governance.submission_reviews (
        submission_id,
        stage_run_id,
        reviewer_id,          -- test user (pre-identity FK)
        reviewed_at,
        decision,
        comments
    )
    VALUES (
        v_submission_id,
        v_stage_run_id,
        c_smoke_user_id,
        NOW() - INTERVAL '35 minutes',
        'approve',
        'NFR Review passed. Data classification (confidential) is correctly assigned. '
            'PII flag is accurate — workflow processes customer transaction IDs. '
            'Data residency constraint (GB) is appropriate for FCA regulatory scope. '
            'Compliance tags gdpr, fca, sox are correctly applied. '
            'Approved for progression to Technical Review.'
    )
    RETURNING id INTO v_review_id;

    RAISE NOTICE '[4/9] Submission review inserted: % — decision: approve', v_review_id;


    -- =========================================================================
    -- STEP 5 — Update submission to approved
    --
    -- Simulates all pipeline stages having passed. Governance status transitions
    -- from 'in_review' → 'approved'. The current_stage_id is cleared (NULL)
    -- as no stage is currently active. resolved_at and resolver_id are set.
    --
    -- This UPDATE will fire the trg_asset_submissions_updated_at trigger,
    -- proving that updated_at is automatically maintained.
    -- =========================================================================

    UPDATE governance.asset_submissions
    SET
        governance_status = 'approved',
        current_stage_id  = NULL,         -- no active stage; all stages passed
        resolved_at       = NOW(),
        resolver_id       = c_smoke_user_id,
        resolver_notes    = 'All five governance stages passed (NFR, Technical, Security, '
                            'Data Governance, Final Approval). Asset approved for catalog promotion.',
        -- updated_at is set automatically by the trigger — we do NOT set it here.
        -- The trg_asset_submissions_updated_at trigger (applied in 010_governance_core.sql)
        -- will update it to NOW() when this UPDATE executes.
        submission_notes  = submission_notes  -- no change; included to confirm trigger fires
    WHERE id = v_submission_id;

    RAISE NOTICE '[5/9] Submission updated to approved: %', v_submission_id;
    RAISE NOTICE '      governance_status = approved, resolved_at = NOW()';
    RAISE NOTICE '      updated_at trigger fired automatically';


    -- =========================================================================
    -- STEP 6 — Insert catalog.assets
    --
    -- Governance creates the catalog entry as part of the promotion process.
    -- Initial publication_status is 'preview' — available to permissioned users
    -- but not yet broadly promoted. We will promote to 'ga' in a subsequent step.
    --
    -- Key points demonstrated here:
    --   - approved_submission_id links back to the governance record
    --   - (source_module_id, source_entity_type, source_entity_id) UNIQUE constraint
    --     ensures one catalog record per source entity
    --   - NFR fields are copied from the submission (denormalised for catalog queries)
    --   - Org dimension FKs are copied from the submission
    --   - publication_status is SEPARATE from governance_status
    -- =========================================================================

    INSERT INTO catalog.assets (
        name,
        short_summary,
        description,
        asset_kind,
        domain,
        publication_status,
        approved_submission_id,
        owner_id,                    -- test user (pre-identity FK)
        -- Org dimension FKs
        primary_country_id,
        opco_id,
        function_group_id,
        industry_sector_id,
        service_offering_id,
        -- Source traceability (matches the submission's source fields)
        source_module_id,
        source_entity_type,
        source_entity_id,
        -- NFR fields (denormalised from approved submission at promotion time)
        data_classification,
        hosting_type,
        audience_type,
        business_criticality,
        data_residency,
        contains_pii,
        is_client_facing,
        retention_requirement,
        sla_description,
        compliance_tags,
        -- Discovery signals
        usage_count,
        featured,
        published_at
    )
    VALUES (
        'Fraud Detection Workflow v2',
        'Real-time transaction fraud detection pipeline for UK Banking. '
            'Analyses behavioural patterns and velocity signals across retail and '
            'corporate transactions. Achieves 94.2% precision at < 500ms p95 latency.',
        E'## Overview\n'
            'This workflow ingests transaction events from the payment gateway, '
            'applies a multi-layer scoring model, and routes flagged transactions '
            'for manual review or automated block.\n\n'
            '## Data\n'
            'Processes customer transaction IDs, device fingerprints, and behavioural '
            'metadata. Contains PII — subject to GDPR, FCA, and SOX controls.\n\n'
            '## SLA\n'
            '99.5% uptime commitment. p95 inference latency < 500ms.',
        'pipeline',                          -- asset_kind (CHECK constraint validated)
        'risk_compliance',                   -- domain code from metadata.taxonomy_terms
        'preview',                           -- publication_status: preview first, ga after promotion
        v_submission_id,                     -- governance link
        c_smoke_user_id,                     -- owner (pre-identity FK)
        -- Org FKs (copied from submission)
        v_country_id,
        v_opco_id,
        v_function_group_id,
        v_industry_sector_id,
        v_service_offering_id,
        -- Source traceability
        v_forge_module_id,
        'workflow',
        c_source_entity_id,                  -- the fixed fake FORGE workflow UUID
        -- NFR fields (denormalised from submission)
        'confidential',
        'cloud',
        'internal',
        'high',
        'GB',
        TRUE,
        FALSE,
        '7 years (FCA SYSC 9.1)',
        '99.5% uptime, p95 latency < 500ms',
        ARRAY['gdpr', 'fca', 'sox'],
        -- Discovery
        0,                                   -- usage_count starts at zero
        FALSE,                               -- not featured yet
        NOW()                                -- published_at = now (first publication)
    )
    RETURNING id INTO v_catalog_asset_id;

    RAISE NOTICE '[6/9] Catalog asset inserted: %', v_catalog_asset_id;
    RAISE NOTICE '      name = Fraud Detection Workflow v2';
    RAISE NOTICE '      publication_status = preview (will be promoted to ga in step 7b)';
    RAISE NOTICE '      source: forge / workflow / %', c_source_entity_id;


    -- =========================================================================
    -- STEP 7a — Insert publication_promotions: first promotion (preview)
    --
    -- Records the governance act of first publishing the asset.
    -- from_status is NULL because this is the first ever publication.
    -- =========================================================================

    INSERT INTO governance.publication_promotions (
        submission_id,
        catalog_asset_id,
        promoted_by,            -- test user (pre-identity FK)
        promoted_at,
        from_status,
        to_status,
        notes
    )
    VALUES (
        v_submission_id,
        v_catalog_asset_id,
        c_smoke_user_id,
        NOW(),
        NULL,                   -- from_status NULL = first publication
        'preview',
        'Initial publication to preview. Asset has passed all five governance stages. '
            'Available to permissioned users for review before broader GA promotion.'
    )
    RETURNING id INTO v_promotion_id_1;

    -- =========================================================================
    -- STEP 7b — Promote to GA
    --
    -- Simulates the governance team confirming the asset is ready for
    -- full catalog discovery. Promotion records the status transition;
    -- catalog.assets.publication_status is updated to match.
    -- =========================================================================

    -- First update catalog.assets to ga
    UPDATE catalog.assets
    SET publication_status = 'ga'
    WHERE id = v_catalog_asset_id;

    -- Then record the promotion event
    INSERT INTO governance.publication_promotions (
        submission_id,
        catalog_asset_id,
        promoted_by,
        promoted_at,
        from_status,
        to_status,
        notes
    )
    VALUES (
        v_submission_id,
        v_catalog_asset_id,
        c_smoke_user_id,
        NOW() + INTERVAL '1 second',  -- 1s after preview promotion
        'preview',
        'ga',
        'Promoted to Generally Available after 24-hour preview period. '
            'Asset is now discoverable in the full catalog.'
    )
    RETURNING id INTO v_promotion_id_2;

    RAISE NOTICE '[7/9] Publication promotions inserted:';
    RAISE NOTICE '      preview promotion: %', v_promotion_id_1;
    RAISE NOTICE '      ga promotion: %', v_promotion_id_2;
    RAISE NOTICE '      catalog.assets.publication_status updated to: ga';


    -- =========================================================================
    -- STEP 8 — Insert catalog.asset_versions
    --
    -- Records version v2.0.0 as the initial published version.
    -- is_current = TRUE. The partial unique index on (asset_id) WHERE
    -- is_current = TRUE ensures at most one current version per asset.
    -- =========================================================================

    INSERT INTO catalog.asset_versions (
        asset_id,
        version,
        released_by,        -- test user (pre-identity FK)
        released_at,
        change_summary,
        is_current,
        submission_id
    )
    VALUES (
        v_catalog_asset_id,
        'v2.0.0',
        c_smoke_user_id,
        NOW(),
        'Initial catalog publication. '
            'v2.0.0 introduces the multi-layer scoring model replacing the legacy '
            'rule-based engine from v1.x. Precision improved from 87% to 94.2%.',
        TRUE,               -- is_current: enforced by partial unique index uix_asset_versions_one_current
        v_submission_id
    )
    RETURNING id INTO v_version_id;

    RAISE NOTICE '[8/9] Asset version inserted: % — v2.0.0 (is_current = true)', v_version_id;


    -- =========================================================================
    -- STEP 9 — Insert catalog.asset_source_refs
    --
    -- Records secondary source traceability references beyond the primary
    -- (source_module_id, source_entity_type, source_entity_id) on catalog.assets.
    --
    -- The primary source (FORGE workflow UUID) is already on catalog.assets itself.
    -- These refs capture supplementary origin pointers: the GitHub repo and the
    -- Confluence data dictionary for this workflow.
    -- =========================================================================

    -- Primary source ref: the FORGE workflow (mirrors what's on catalog.assets)
    INSERT INTO catalog.asset_source_refs (
        asset_id,
        ref_type,
        ref_value,
        label,
        href,
        is_primary,
        added_by
    )
    VALUES (
        v_catalog_asset_id,
        'forge_asset_id',
        c_source_entity_id::TEXT,       -- the fake FORGE workflow UUID as text
        'FORGE Workflow: Fraud Detection v2',
        NULL,                            -- no external URL for internal forge reference
        TRUE,                            -- is_primary: enforced by partial unique index
        c_smoke_user_id
    )
    RETURNING id INTO v_source_ref_id;

    -- Secondary source ref: the Git repository
    INSERT INTO catalog.asset_source_refs (
        asset_id,
        ref_type,
        ref_value,
        label,
        href,
        is_primary,
        added_by
    )
    VALUES (
        v_catalog_asset_id,
        'github_repo',
        'sigai-org/fraud-detection-workflow',
        'GitHub: fraud-detection-workflow',
        'https://github.com/sigai-org/fraud-detection-workflow',
        FALSE,
        c_smoke_user_id
    );

    RAISE NOTICE '[9/9] Asset source refs inserted:';
    RAISE NOTICE '      primary ref (forge_asset_id): %', v_source_ref_id;
    RAISE NOTICE '      secondary ref: github_repo — sigai-org/fraud-detection-workflow';


    -- =========================================================================
    -- Bonus: Write a few entries into the audit trail
    -- In the real system, the application layer writes these automatically.
    -- Inserting manually here validates the audit_trail table is functional.
    -- =========================================================================

    INSERT INTO governance.audit_trail (entity_type, entity_id, action, performed_by, before_state, after_state, metadata)
    VALUES
    (
        'governance.submission',
        v_submission_id,
        'submitted',
        c_smoke_user_id,
        NULL,
        jsonb_build_object(
            'governance_status', 'in_review',
            'source_entity_type', 'workflow',
            'data_classification', 'confidential',
            'contains_pii', true
        ),
        jsonb_build_object('smoke_test', 'true', 'request_id', 'smoke-001')
    ),
    (
        'governance.submission',
        v_submission_id,
        'approved',
        c_smoke_user_id,
        jsonb_build_object('governance_status', 'in_review'),
        jsonb_build_object('governance_status', 'approved', 'resolved_at', NOW()::TEXT),
        jsonb_build_object('smoke_test', 'true', 'request_id', 'smoke-002')
    ),
    (
        'catalog.asset',
        v_catalog_asset_id,
        'promoted_to_ga',
        c_smoke_user_id,
        jsonb_build_object('publication_status', 'preview'),
        jsonb_build_object('publication_status', 'ga', 'published_at', NOW()::TEXT),
        jsonb_build_object('smoke_test', 'true', 'request_id', 'smoke-003')
    );

    RAISE NOTICE '      [bonus] 3 audit trail entries written.';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Smoke test seed complete. Run validate_smoke_test.sql next.';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '  submission_id:      %', v_submission_id;
    RAISE NOTICE '  catalog_asset_id:   %', v_catalog_asset_id;
    RAISE NOTICE '  source_entity_id:   %', c_source_entity_id;
    RAISE NOTICE '  test_user_id:       %', c_smoke_user_id;

END;
$$ LANGUAGE plpgsql;

COMMIT;
