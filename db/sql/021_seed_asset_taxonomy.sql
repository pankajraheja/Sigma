-- =============================================================================
-- 021_seed_asset_taxonomy.sql
-- SigAI Platform — Asset taxonomy classifications and tag seed data
--
-- Populates catalog.asset_classifications and catalog.asset_tags for the
-- smoke-test asset (Fraud Detection Workflow v2) inserted by
-- db/test/seed_smoke_test.sql.
--
-- PREREQUISITES:
--   004_metadata_reference_minimal.sql (taxonomy_terms + tags tables)
--   020_catalog_core.sql              (catalog tables)
--   db/test/seed_smoke_test.sql       (source asset must exist)
--
-- IDEMPOTENT: ON CONFLICT DO NOTHING on all inserts.
--
-- EXECUTION:
--   psql -d <database> -f db/sql/021_seed_asset_taxonomy.sql
--
-- Fixed test constants:
--   Source entity:  cafecafe-0000-4000-8000-000000000042
--   Placeholder user: 00000000-0000-0000-0000-000000000099
-- =============================================================================

DO $$
DECLARE
    c_source_entity_id UUID := 'cafecafe-0000-4000-8000-000000000042';
    c_placeholder_user UUID := '00000000-0000-0000-0000-000000000099';
    v_asset_id         UUID;

    -- taxonomy term IDs
    v_term_pipeline    UUID;
    v_term_risk        UUID;
    v_term_gdpr        UUID;
    v_term_fca         UUID;
    v_term_sox         UUID;

    -- tag IDs
    v_tag_fraud        UUID;
    v_tag_ml           UUID;
    v_tag_realtime     UUID;
    v_tag_uk_banking   UUID;
    v_tag_pii          UUID;
BEGIN

    -- -------------------------------------------------------------------------
    -- Resolve the smoke-test catalog asset
    -- -------------------------------------------------------------------------
    SELECT id INTO v_asset_id
    FROM catalog.assets
    WHERE source_entity_id = c_source_entity_id
    LIMIT 1;

    IF v_asset_id IS NULL THEN
        RAISE NOTICE '021_seed_asset_taxonomy: smoke-test asset not found (source_entity_id = %). '
                     'Run db/test/seed_smoke_test.sql first, then re-run this script.',
                     c_source_entity_id;
        RETURN;
    END IF;

    RAISE NOTICE '021_seed_asset_taxonomy: seeding taxonomy for asset %', v_asset_id;

    -- -------------------------------------------------------------------------
    -- Resolve taxonomy term IDs from the seeded terms in 004_metadata_reference_minimal.sql
    -- -------------------------------------------------------------------------
    SELECT id INTO v_term_pipeline FROM metadata.taxonomy_terms
    WHERE scheme_code = 'asset_kind' AND code = 'pipeline';

    SELECT id INTO v_term_risk     FROM metadata.taxonomy_terms
    WHERE scheme_code = 'domain'   AND code = 'risk_compliance';

    SELECT id INTO v_term_gdpr     FROM metadata.taxonomy_terms
    WHERE scheme_code = 'compliance_tag' AND code = 'gdpr';

    SELECT id INTO v_term_fca      FROM metadata.taxonomy_terms
    WHERE scheme_code = 'compliance_tag' AND code = 'fca';

    SELECT id INTO v_term_sox      FROM metadata.taxonomy_terms
    WHERE scheme_code = 'compliance_tag' AND code = 'sox';

    -- -------------------------------------------------------------------------
    -- Insert asset_classifications (mirrors denormalised fields for structured
    -- taxonomy browsing and filtering)
    -- -------------------------------------------------------------------------

    -- asset_kind: pipeline
    IF v_term_pipeline IS NOT NULL THEN
        INSERT INTO catalog.asset_classifications
            (asset_id, term_id, scheme_code, classified_by)
        VALUES
            (v_asset_id, v_term_pipeline, 'asset_kind', c_placeholder_user)
        ON CONFLICT (asset_id, term_id) DO NOTHING;
    END IF;

    -- domain: risk_compliance
    IF v_term_risk IS NOT NULL THEN
        INSERT INTO catalog.asset_classifications
            (asset_id, term_id, scheme_code, classified_by)
        VALUES
            (v_asset_id, v_term_risk, 'domain', c_placeholder_user)
        ON CONFLICT (asset_id, term_id) DO NOTHING;
    END IF;

    -- compliance_tag: gdpr
    IF v_term_gdpr IS NOT NULL THEN
        INSERT INTO catalog.asset_classifications
            (asset_id, term_id, scheme_code, classified_by)
        VALUES
            (v_asset_id, v_term_gdpr, 'compliance_tag', c_placeholder_user)
        ON CONFLICT (asset_id, term_id) DO NOTHING;
    END IF;

    -- compliance_tag: fca
    IF v_term_fca IS NOT NULL THEN
        INSERT INTO catalog.asset_classifications
            (asset_id, term_id, scheme_code, classified_by)
        VALUES
            (v_asset_id, v_term_fca, 'compliance_tag', c_placeholder_user)
        ON CONFLICT (asset_id, term_id) DO NOTHING;
    END IF;

    -- compliance_tag: sox
    IF v_term_sox IS NOT NULL THEN
        INSERT INTO catalog.asset_classifications
            (asset_id, term_id, scheme_code, classified_by)
        VALUES
            (v_asset_id, v_term_sox, 'compliance_tag', c_placeholder_user)
        ON CONFLICT (asset_id, term_id) DO NOTHING;
    END IF;

    RAISE NOTICE '021_seed_asset_taxonomy: inserted asset_classifications (5 rows)';

    -- -------------------------------------------------------------------------
    -- Insert tags into metadata.tags (normalised: lowercase, trimmed)
    -- -------------------------------------------------------------------------
    INSERT INTO metadata.tags (label) VALUES
        ('fraud-detection'),
        ('machine-learning'),
        ('real-time'),
        ('uk-banking'),
        ('pii')
    ON CONFLICT (label) DO NOTHING;

    SELECT id INTO v_tag_fraud    FROM metadata.tags WHERE label = 'fraud-detection';
    SELECT id INTO v_tag_ml       FROM metadata.tags WHERE label = 'machine-learning';
    SELECT id INTO v_tag_realtime FROM metadata.tags WHERE label = 'real-time';
    SELECT id INTO v_tag_uk_banking FROM metadata.tags WHERE label = 'uk-banking';
    SELECT id INTO v_tag_pii      FROM metadata.tags WHERE label = 'pii';

    -- -------------------------------------------------------------------------
    -- Insert asset_tags (junction)
    -- -------------------------------------------------------------------------
    INSERT INTO catalog.asset_tags (asset_id, tag_id, tagged_by) VALUES
        (v_asset_id, v_tag_fraud,      c_placeholder_user),
        (v_asset_id, v_tag_ml,         c_placeholder_user),
        (v_asset_id, v_tag_realtime,   c_placeholder_user),
        (v_asset_id, v_tag_uk_banking, c_placeholder_user),
        (v_asset_id, v_tag_pii,        c_placeholder_user)
    ON CONFLICT (asset_id, tag_id) DO NOTHING;

    RAISE NOTICE '021_seed_asset_taxonomy: inserted asset_tags (5 rows)';
    RAISE NOTICE '021_seed_asset_taxonomy: DONE';

END $$;
