-- =============================================================================
-- SigAI · AI Navigator — Dev Seed Data
-- File: backend/catalog/db/seed.dev.sql
--
-- Targets the IMPLEMENTED schema only:
--   catalog.assets              (with search_vector GENERATED ALWAYS)
--   catalog.asset_versions
--   catalog.asset_source_refs
--   catalog.asset_classifications
--   catalog.asset_tags
--   metadata.taxonomy_terms
--   metadata.tags
--
-- Also seeds minimal org.* reference records needed for FK integrity.
--
-- All visible record names carry the '-d' suffix to mark dev/dummy data.
-- Safe to run repeatedly — cleanup block removes previous dev data first.
--
-- FIXED CONSTANTS (cleanup + queries can target these):
--   Dev user placeholder: 00000000-0000-0000-0000-000000000042
--   Org code prefix:      DEV_
--   Country codes:        XU, XD, XK, XI  (not real ISO codes)
--
-- PREREQUISITES:
--   All files in db/sql/ must be applied first (001 through 021).
--
-- Target: PostgreSQL 16+
-- =============================================================================

BEGIN;

DO $$
DECLARE
    -- =========================================================================
    -- Dev user placeholder (identity schema not yet built)
    -- =========================================================================
    c_dev_user UUID := '00000000-0000-0000-0000-000000000042';

    -- =========================================================================
    -- Module IDs — looked up from platform.modules
    -- =========================================================================
    v_forge_id    UUID;
    v_proto_id    UUID;
    v_app_id      UUID;
    v_intake_id   UUID;

    -- =========================================================================
    -- Hardcoded UUIDs — all hex-safe (0-9, a-f only)
    -- =========================================================================

    -- Countries
    c_country_us  UUID := '11111111-1111-1111-1111-111111111111';
    c_country_de  UUID := '11111111-1111-1111-1111-111111111112';
    c_country_uk  UUID := '11111111-1111-1111-1111-111111111113';
    c_country_in  UUID := '11111111-1111-1111-1111-111111111114';

    -- Opcos
    c_opco_us     UUID := '22222222-2222-2222-2222-222222222221';
    c_opco_de     UUID := '22222222-2222-2222-2222-222222222222';
    c_opco_uk     UUID := '22222222-2222-2222-2222-222222222223';
    c_opco_in     UUID := '22222222-2222-2222-2222-222222222224';

    -- Function groups
    c_fg_advisory UUID := '33333333-3333-3333-3333-333333333331';
    c_fg_tax      UUID := '33333333-3333-3333-3333-333333333332';
    c_fg_audit    UUID := '33333333-3333-3333-3333-333333333333';
    c_fg_backoff  UUID := '33333333-3333-3333-3333-333333333334';

    -- Industry sectors
    c_is_finsvc   UUID := '44444444-4444-4444-4444-444444444441';
    c_is_health   UUID := '44444444-4444-4444-4444-444444444442';
    c_is_energy   UUID := '44444444-4444-4444-4444-444444444443';
    c_is_retail   UUID := '44444444-4444-4444-4444-444444444444';

    -- Service offerings
    c_so_da       UUID := '55555555-5555-5555-5555-555555555551';
    c_so_si       UUID := '55555555-5555-5555-5555-555555555552';
    c_so_ai       UUID := '55555555-5555-5555-5555-555555555553';

    -- Owner IDs (dev placeholders)
    c_owner_1     UUID := 'aaaaaa01-0000-0000-0000-000000000001';
    c_owner_2     UUID := 'aaaaaa01-0000-0000-0000-000000000002';
    c_owner_3     UUID := 'aaaaaa01-0000-0000-0000-000000000003';
    c_owner_4     UUID := 'aaaaaa01-0000-0000-0000-000000000004';
    c_owner_5     UUID := 'aaaaaa01-0000-0000-0000-000000000005';
    c_owner_6     UUID := 'aaaaaa01-0000-0000-0000-000000000006';

    -- Taxonomy term IDs
    c_tt_tax      UUID := 'd0000001-0000-0000-0000-000000000101';
    c_tt_aud      UUID := 'd0000001-0000-0000-0000-000000000102';
    c_tt_adv      UUID := 'd0000001-0000-0000-0000-000000000103';
    c_tt_tech     UUID := 'd0000001-0000-0000-0000-000000000104';
    c_tt_da       UUID := 'd0000001-0000-0000-0000-000000000201';
    c_tt_pa       UUID := 'd0000001-0000-0000-0000-000000000202';
    c_tt_ai       UUID := 'd0000001-0000-0000-0000-000000000203';
    c_tt_rep      UUID := 'd0000001-0000-0000-0000-000000000204';

    -- Tag IDs
    c_tag_gov     UUID := 'da000001-0000-0000-0000-000000000001';
    c_tag_pii     UUID := 'da000001-0000-0000-0000-000000000002';
    c_tag_aud     UUID := 'da000001-0000-0000-0000-000000000003';
    c_tag_cli     UUID := 'da000001-0000-0000-0000-000000000004';
    c_tag_reu     UUID := 'da000001-0000-0000-0000-000000000005';
    c_tag_aip     UUID := 'da000001-0000-0000-0000-000000000006';
    c_tag_dp      UUID := 'da000001-0000-0000-0000-000000000007';

    -- Asset IDs
    c_asset_1     UUID := 'a0000001-0000-0000-0000-000000000001';
    c_asset_2     UUID := 'a0000001-0000-0000-0000-000000000002';
    c_asset_3     UUID := 'a0000001-0000-0000-0000-000000000003';
    c_asset_4     UUID := 'a0000001-0000-0000-0000-000000000004';
    c_asset_5     UUID := 'a0000001-0000-0000-0000-000000000005';
    c_asset_6     UUID := 'a0000001-0000-0000-0000-000000000006';

    -- Source entity IDs (simulated source module records)
    c_src_1       UUID := 'f0000000-0000-0000-0000-000000000001';
    c_src_2       UUID := 'f0000000-0000-0000-0000-000000000002';
    c_src_3       UUID := 'f0000000-0000-0000-0000-000000000003';
    c_src_4       UUID := 'f0000000-0000-0000-0000-000000000004';
    c_src_5       UUID := 'f0000000-0000-0000-0000-000000000005';
    c_src_6       UUID := 'f0000000-0000-0000-0000-000000000006';

    -- Version IDs
    c_ver_1       UUID := 'b0000001-0000-0000-0001-000000000001';
    c_ver_2       UUID := 'b0000001-0000-0000-0002-000000000001';
    c_ver_3a      UUID := 'b0000001-0000-0000-0003-000000000001';
    c_ver_3b      UUID := 'b0000001-0000-0000-0003-000000000002';
    c_ver_4       UUID := 'b0000001-0000-0000-0004-000000000001';
    c_ver_5       UUID := 'b0000001-0000-0000-0005-000000000001';
    c_ver_6       UUID := 'b0000001-0000-0000-0006-000000000001';

    -- Source ref IDs
    c_ref_1       UUID := 'c0000001-0000-0000-0001-000000000001';
    c_ref_2       UUID := 'c0000001-0000-0000-0002-000000000001';
    c_ref_3       UUID := 'c0000001-0000-0000-0003-000000000001';
    c_ref_4       UUID := 'c0000001-0000-0000-0004-000000000001';
    c_ref_5       UUID := 'c0000001-0000-0000-0005-000000000001';
    c_ref_6       UUID := 'c0000001-0000-0000-0006-000000000001';

    -- Classification IDs
    c_cls_1a      UUID := 'e0000001-0001-0000-0001-000000000001';
    c_cls_1b      UUID := 'e0000001-0001-0000-0001-000000000002';
    c_cls_2a      UUID := 'e0000001-0002-0000-0001-000000000001';
    c_cls_2b      UUID := 'e0000001-0002-0000-0001-000000000002';
    c_cls_3a      UUID := 'e0000001-0003-0000-0001-000000000001';
    c_cls_3b      UUID := 'e0000001-0003-0000-0001-000000000002';
    c_cls_4a      UUID := 'e0000001-0004-0000-0001-000000000001';
    c_cls_4b      UUID := 'e0000001-0004-0000-0001-000000000002';
    c_cls_5a      UUID := 'e0000001-0005-0000-0001-000000000001';
    c_cls_5b      UUID := 'e0000001-0005-0000-0001-000000000002';
    c_cls_6a      UUID := 'e0000001-0006-0000-0001-000000000001';
    c_cls_6b      UUID := 'e0000001-0006-0000-0001-000000000002';

BEGIN

    -- =========================================================================
    -- Look up module IDs from platform.modules
    -- =========================================================================
    SELECT id INTO v_forge_id  FROM platform.modules WHERE module_key = 'forge';
    SELECT id INTO v_proto_id  FROM platform.modules WHERE module_key = 'prototype-builder';
    SELECT id INTO v_app_id    FROM platform.modules WHERE module_key = 'app-builder';
    SELECT id INTO v_intake_id FROM platform.modules WHERE module_key = 'intake';

    IF v_forge_id IS NULL THEN
        RAISE EXCEPTION 'Modules not found in platform.modules. Run db/sql/ DDL files (001-020) first.';
    END IF;

    -- =========================================================================
    -- CLEANUP — remove previous dev seed records
    -- =========================================================================
    -- catalog.assets cascade-deletes versions, classifications, tags, source_refs
    DELETE FROM catalog.assets WHERE id IN (
        c_asset_1, c_asset_2, c_asset_3, c_asset_4, c_asset_5, c_asset_6
    );
    DELETE FROM metadata.tags WHERE id IN (
        c_tag_gov, c_tag_pii, c_tag_aud, c_tag_cli, c_tag_reu, c_tag_aip, c_tag_dp
    );
    DELETE FROM metadata.taxonomy_terms WHERE id IN (
        c_tt_tax, c_tt_aud, c_tt_adv, c_tt_tech, c_tt_da, c_tt_pa, c_tt_ai, c_tt_rep
    );
    DELETE FROM org.service_offerings  WHERE code LIKE 'DEV_%';
    DELETE FROM org.industry_sectors   WHERE code LIKE 'DEV_%';
    DELETE FROM org.function_groups    WHERE code LIKE 'DEV_%';
    DELETE FROM org.opcos              WHERE code LIKE 'DEV_%';
    DELETE FROM org.countries          WHERE iso_alpha2 IN ('XU', 'XD', 'XK', 'XI');

    RAISE NOTICE '[cleanup] Previous dev seed records removed.';

    -- =========================================================================
    -- 0. ORG REFERENCE RECORDS (needed for FK integrity)
    -- =========================================================================

    INSERT INTO org.countries (id, iso_alpha2, iso_alpha3, name, region) VALUES
        (c_country_us, 'XU', 'XUS', 'Dev United States-d', 'AMER'),
        (c_country_de, 'XD', 'XDE', 'Dev Germany-d',       'EMEA'),
        (c_country_uk, 'XK', 'XUK', 'Dev United Kingdom-d','EMEA'),
        (c_country_in, 'XI', 'XIN', 'Dev India-d',         'APAC')
    ON CONFLICT DO NOTHING;

    INSERT INTO org.opcos (id, code, name, primary_country_id) VALUES
        (c_opco_us, 'DEV_US', 'Dev KPMG US-d',      c_country_us),
        (c_opco_de, 'DEV_DE', 'Dev KPMG Germany-d',  c_country_de),
        (c_opco_uk, 'DEV_UK', 'Dev KPMG UK-d',       c_country_uk),
        (c_opco_in, 'DEV_IN', 'Dev KPMG India-d',    c_country_in)
    ON CONFLICT DO NOTHING;

    INSERT INTO org.function_groups (id, code, name) VALUES
        (c_fg_advisory, 'DEV_ADVISORY',  'Dev Advisory-d'),
        (c_fg_tax,      'DEV_TAX',       'Dev Tax-d'),
        (c_fg_audit,    'DEV_AUDIT',     'Dev Audit-d'),
        (c_fg_backoff,  'DEV_BACKOFF',   'Dev Backoffice-d')
    ON CONFLICT DO NOTHING;

    INSERT INTO org.industry_sectors (id, code, name) VALUES
        (c_is_finsvc, 'DEV_FINSVC',  'Dev Financial Services-d'),
        (c_is_health, 'DEV_HEALTH',  'Dev Healthcare-d'),
        (c_is_energy, 'DEV_ENERGY',  'Dev Energy-d'),
        (c_is_retail, 'DEV_RETAIL',  'Dev Consumer & Retail-d')
    ON CONFLICT DO NOTHING;

    INSERT INTO org.service_offerings (id, code, name) VALUES
        (c_so_da, 'DEV_DA', 'Dev Data & Analytics-d'),
        (c_so_si, 'DEV_SI', 'Dev Systems Integration-d'),
        (c_so_ai, 'DEV_AI', 'Dev AI & Automation-d')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[0/7] Org reference records inserted.';

    -- =========================================================================
    -- 1. TAXONOMY TERMS  (metadata.taxonomy_terms)
    --    Two schemes: service_line and capability.
    -- =========================================================================

    INSERT INTO metadata.taxonomy_terms (id, scheme_code, code, label, is_active) VALUES
        (c_tt_tax,  'service_line', 'DEV_TAX',  'Tax-d',        TRUE),
        (c_tt_aud,  'service_line', 'DEV_AUD',  'Audit-d',      TRUE),
        (c_tt_adv,  'service_line', 'DEV_ADV',  'Advisory-d',   TRUE),
        (c_tt_tech, 'service_line', 'DEV_TECH', 'Technology-d', TRUE),
        (c_tt_da,   'capability',   'DEV_DA',   'Data & Analytics-d',      TRUE),
        (c_tt_pa,   'capability',   'DEV_PA',   'Process Automation-d',    TRUE),
        (c_tt_ai,   'capability',   'DEV_AI',   'AI & Machine Learning-d', TRUE),
        (c_tt_rep,  'capability',   'DEV_REP',  'Reporting-d',             TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[1/7] Taxonomy terms inserted.';

    -- =========================================================================
    -- 2. TAGS  (metadata.tags)
    --    Labels must be lowercase per CHECK constraint.
    -- =========================================================================

    INSERT INTO metadata.tags (id, label, created_at) VALUES
        (c_tag_gov, 'governance-d',    NOW() - INTERVAL '30 days'),
        (c_tag_pii, 'pii-sensitive-d', NOW() - INTERVAL '29 days'),
        (c_tag_aud, 'audit-ready-d',   NOW() - INTERVAL '28 days'),
        (c_tag_cli, 'client-facing-d', NOW() - INTERVAL '27 days'),
        (c_tag_reu, 'reusable-d',      NOW() - INTERVAL '26 days'),
        (c_tag_aip, 'ai-powered-d',    NOW() - INTERVAL '25 days'),
        (c_tag_dp,  'data-product-d',  NOW() - INTERVAL '24 days')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[2/7] Tags inserted.';

    -- =========================================================================
    -- 3. CATALOG ASSETS  (catalog.assets)
    --
    --    asset_kind must match CHECK: dataset | api | report | model |
    --        dashboard | pipeline | template | skill | connector
    --    hosting_type CHECK: cloud | on_premise | hybrid | saas
    --    audience_type CHECK: internal | external | partner | cross_entity
    --    search_vector is GENERATED ALWAYS — omit from INSERT
    -- =========================================================================

    INSERT INTO catalog.assets (
        id, name, short_summary, description,
        asset_kind, publication_status,
        source_module_id, source_entity_type, source_entity_id,
        owner_id, primary_country_id, opco_id, function_group_id,
        industry_sector_id, service_offering_id,
        data_classification, hosting_type, audience_type, business_criticality,
        data_residency, contains_pii, is_client_facing,
        retention_requirement, sla_description, compliance_tags, domain,
        approved_submission_id, usage_count, featured,
        published_at, created_at, updated_at
    ) VALUES

    -- ── Asset 1: Tax Review Pipeline ────────────────────────────────────────
    (
        c_asset_1,
        'Tax Review Pipeline-d',
        'Governed multi-approver pipeline for tax review and EU compliance routing-d.',
        'Reusable governed pipeline for automated tax review and approval routing. Handles multi-approver chains, escalation rules, and EU compliance gates. Certified for use across KPMG Germany and EU jurisdictions-d.',
        'pipeline', 'ga',
        v_forge_id, 'workflow', c_src_1,
        c_owner_1, c_country_de, c_opco_de, c_fg_tax,
        c_is_finsvc, c_so_da,
        'confidential', 'on_premise', 'internal', 'high', 'EU',
        TRUE, FALSE, '7 years', '99.5% uptime · 4hr support SLA',
        ARRAY['SOX', 'GDPR'], 'legal_tax',
        NULL, 142, TRUE,
        NOW() - INTERVAL '17 days',
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '17 days'
    ),

    -- ── Asset 2: Client Onboarding Template ─────────────────────────────────
    (
        c_asset_2,
        'Client Onboarding Template-d',
        'Validated template for the end-to-end client onboarding experience-d.',
        'Approved template asset for client onboarding journey design. Built in Prototype Lab and validated by the Advisory Experience team. Covers KYC steps, document upload, and welcome flow. Ready for handoff to Solution Studio-d.',
        'template', 'ga',
        v_proto_id, 'project', c_src_2,
        c_owner_2, c_country_us, c_opco_us, c_fg_advisory,
        c_is_retail, c_so_si,
        'internal', 'saas', 'external', 'medium', 'US',
        FALSE, TRUE, '3 years', NULL,
        ARRAY['AML'], 'operations',
        NULL, 87, TRUE,
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '12 days'
    ),

    -- ── Asset 3: Compliance Reporting Dashboard ─────────────────────────────
    (
        c_asset_3,
        'Compliance Reporting Dashboard-d',
        'Production-ready dashboard for regulatory compliance report generation-d.',
        'Full-stack compliance reporting dashboard built and certified by the Audit Engineering team. Supports UK regulatory frameworks, automated scheduling, and PDF/Excel export. Now on v2.0.0 with enhanced audit trail and GDPR data-subject export functionality-d.',
        'dashboard', 'ga',
        v_app_id, 'application', c_src_3,
        c_owner_3, c_country_uk, c_opco_uk, c_fg_audit,
        c_is_finsvc, c_so_da,
        'internal', 'cloud', 'internal', 'high', 'UK',
        FALSE, FALSE, '5 years', '99.9% uptime · 2hr P1 SLA',
        ARRAY['ISO-27001', 'GDPR'], 'risk_compliance',
        NULL, 213, TRUE,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '10 days'
    ),

    -- ── Asset 4: Client Proposal Model (preview) ───────────────────────────
    (
        c_asset_4,
        'Client Proposal Model-d',
        'AI model that drafts and refines client proposals using approved templates-d.',
        'Preview-stage AI model for proposal drafting and reuse guidance. Powered by Agent Forge, retrieves relevant prior proposals from AI Navigator, and structures outputs against the engagement template library. Pending full GA certification-d.',
        'model', 'preview',
        v_forge_id, 'agent_spec', c_src_4,
        c_owner_4, c_country_in, c_opco_in, c_fg_advisory,
        c_is_health, c_so_ai,
        'restricted', 'on_premise', 'internal', 'high', 'IN',
        TRUE, FALSE, '2 years', NULL,
        ARRAY['GDPR'], 'ai_data_services',
        NULL, 31, FALSE,
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '8 days'
    ),

    -- ── Asset 5: Analytics Data Product ─────────────────────────────────────
    (
        c_asset_5,
        'Analytics Data Product-d',
        'Governed dataset promoted via Request Hub intake — client engagement KPIs-d.',
        'Reusable analytics data product promoted via Request Hub intake workflow. Contains aggregated client engagement metrics and deal pipeline KPIs. Classified as confidential due to client-identifiable fields. Approved for internal analytics teams only-d.',
        'dataset', 'ga',
        v_intake_id, 'request', c_src_5,
        c_owner_5, c_country_us, c_opco_us, c_fg_backoff,
        c_is_energy, c_so_da,
        'confidential', 'on_premise', 'internal', 'medium', 'US',
        TRUE, FALSE, '6 years', NULL,
        ARRAY['SOX', 'CCPA'], 'banking_finance',
        NULL, 76, FALSE,
        NOW() - INTERVAL '6 days',
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '6 days'
    ),

    -- ── Asset 6: ESG Disclosure Pipeline ────────────────────────────────────
    (
        c_asset_6,
        'ESG Disclosure Pipeline-d',
        'Automated pipeline for CSRD and GRI ESG disclosure collection and validation-d.',
        'Governed multi-step pipeline for ESG disclosure data collection, validation, and audit trail generation. Integrates with the reporting layer for CSRD and GRI compliance. Certified for use across EU and UK jurisdictions-d.',
        'pipeline', 'ga',
        v_forge_id, 'workflow', c_src_6,
        c_owner_6, c_country_de, c_opco_de, c_fg_advisory,
        c_is_finsvc, c_so_ai,
        'confidential', 'on_premise', 'internal', 'high', 'EU',
        FALSE, FALSE, '10 years', '99.5% uptime · 4hr support SLA',
        ARRAY['CSRD', 'GRI', 'GDPR'], 'risk_compliance',
        NULL, 58, TRUE,
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '4 days'
    )

    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[3/7] Catalog assets inserted (6 assets).';

    -- =========================================================================
    -- 4. ASSET VERSIONS  (catalog.asset_versions)
    --
    --    Columns: id, asset_id, version, is_current, change_summary,
    --             released_at, released_by (UUID)
    -- =========================================================================

    INSERT INTO catalog.asset_versions (
        id, asset_id, version, is_current, change_summary, released_at, released_by
    ) VALUES
        -- Asset 1: Tax Review Pipeline (1 version)
        (c_ver_1, c_asset_1, '1.0.0', TRUE,
         'Initial GA release. Multi-approver routing and EU compliance gates-d.',
         NOW() - INTERVAL '17 days', c_dev_user),

        -- Asset 2: Client Onboarding Template (1 version)
        (c_ver_2, c_asset_2, '1.0.0', TRUE,
         'Initial GA release. KYC, document upload, and welcome flow-d.',
         NOW() - INTERVAL '12 days', c_dev_user),

        -- Asset 3: Compliance Reporting Dashboard (2 versions)
        (c_ver_3a, c_asset_3, '1.0.0', FALSE,
         'Initial GA release. UK regulatory report templates-d.',
         NOW() - INTERVAL '11 days', c_dev_user),
        (c_ver_3b, c_asset_3, '2.0.0', TRUE,
         'Enhanced audit trail; added GDPR data-subject export and PDF/Excel formatting-d.',
         NOW() - INTERVAL '10 days', c_dev_user),

        -- Asset 4: Client Proposal Model (1 preview version)
        (c_ver_4, c_asset_4, '0.1.0', TRUE,
         'Initial preview release. Pending full certification-d.',
         NOW() - INTERVAL '8 days', c_dev_user),

        -- Asset 5: Analytics Data Product (1 version)
        (c_ver_5, c_asset_5, '1.0.0', TRUE,
         'Initial GA release. Promoted from Request Hub intake workflow-d.',
         NOW() - INTERVAL '6 days', c_dev_user),

        -- Asset 6: ESG Disclosure Pipeline (1 version)
        (c_ver_6, c_asset_6, '1.0.0', TRUE,
         'Initial GA release. CSRD and GRI framework alignment-d.',
         NOW() - INTERVAL '4 days', c_dev_user)

    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[4/7] Asset versions inserted.';

    -- =========================================================================
    -- 5. ASSET SOURCE REFS  (catalog.asset_source_refs)
    --    added_by is UUID
    -- =========================================================================

    INSERT INTO catalog.asset_source_refs (
        id, asset_id, ref_type, ref_value, label, href, is_primary, added_by, added_at
    ) VALUES
        (c_ref_1, c_asset_1, 'forge_asset_id', c_src_1::text,
         'Tax Review Pipeline in Agent Forge-d', NULL,
         TRUE, c_dev_user, NOW() - INTERVAL '17 days'),

        (c_ref_2, c_asset_2, 'forge_asset_id', c_src_2::text,
         'Client Onboarding Template in Prototype Lab-d', NULL,
         TRUE, c_dev_user, NOW() - INTERVAL '12 days'),

        (c_ref_3, c_asset_3, 'github_repo', 'kpmg-internal/compliance-reporting-app-d',
         'GitHub — compliance-reporting-app-d', NULL,
         TRUE, c_dev_user, NOW() - INTERVAL '10 days'),

        (c_ref_4, c_asset_4, 'forge_asset_id', c_src_4::text,
         'Client Proposal Model in Agent Forge-d', NULL,
         TRUE, c_dev_user, NOW() - INTERVAL '8 days'),

        (c_ref_5, c_asset_5, 'dbt_model', 'analytics.engagement_data_product_d',
         'dbt — analytics.engagement_data_product-d', NULL,
         TRUE, c_dev_user, NOW() - INTERVAL '6 days'),

        (c_ref_6, c_asset_6, 'forge_asset_id', c_src_6::text,
         'ESG Disclosure Pipeline in Agent Forge-d', NULL,
         TRUE, c_dev_user, NOW() - INTERVAL '4 days')

    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[5/7] Asset source refs inserted.';

    -- =========================================================================
    -- 6. TAXONOMY CLASSIFICATIONS  (catalog.asset_classifications)
    --    classified_by is UUID
    -- =========================================================================

    INSERT INTO catalog.asset_classifications (
        id, asset_id, term_id, scheme_code, classified_by, classified_at
    ) VALUES
        -- Tax Review Pipeline → Tax (service_line) + Process Automation (capability)
        (c_cls_1a, c_asset_1, c_tt_tax, 'service_line', c_dev_user, NOW() - INTERVAL '17 days'),
        (c_cls_1b, c_asset_1, c_tt_pa,  'capability',   c_dev_user, NOW() - INTERVAL '17 days'),

        -- Client Onboarding Template → Advisory + Process Automation
        (c_cls_2a, c_asset_2, c_tt_adv, 'service_line', c_dev_user, NOW() - INTERVAL '12 days'),
        (c_cls_2b, c_asset_2, c_tt_pa,  'capability',   c_dev_user, NOW() - INTERVAL '12 days'),

        -- Compliance Reporting Dashboard → Audit + Reporting
        (c_cls_3a, c_asset_3, c_tt_aud, 'service_line', c_dev_user, NOW() - INTERVAL '10 days'),
        (c_cls_3b, c_asset_3, c_tt_rep, 'capability',   c_dev_user, NOW() - INTERVAL '10 days'),

        -- Client Proposal Model → Advisory + AI & ML
        (c_cls_4a, c_asset_4, c_tt_adv, 'service_line', c_dev_user, NOW() - INTERVAL '8 days'),
        (c_cls_4b, c_asset_4, c_tt_ai,  'capability',   c_dev_user, NOW() - INTERVAL '8 days'),

        -- Analytics Data Product → Advisory + Data & Analytics
        (c_cls_5a, c_asset_5, c_tt_adv, 'service_line', c_dev_user, NOW() - INTERVAL '6 days'),
        (c_cls_5b, c_asset_5, c_tt_da,  'capability',   c_dev_user, NOW() - INTERVAL '6 days'),

        -- ESG Disclosure Pipeline → Advisory + Process Automation
        (c_cls_6a, c_asset_6, c_tt_adv, 'service_line', c_dev_user, NOW() - INTERVAL '4 days'),
        (c_cls_6b, c_asset_6, c_tt_pa,  'capability',   c_dev_user, NOW() - INTERVAL '4 days')

    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[6/7] Asset classifications inserted.';

    -- =========================================================================
    -- 7. ASSET TAGS  (catalog.asset_tags)
    --    tagged_by is UUID
    -- =========================================================================

    INSERT INTO catalog.asset_tags (asset_id, tag_id, tagged_by, tagged_at) VALUES
        -- Tax Review Pipeline → governance, pii-sensitive, audit-ready
        (c_asset_1, c_tag_gov, c_dev_user, NOW() - INTERVAL '17 days'),
        (c_asset_1, c_tag_pii, c_dev_user, NOW() - INTERVAL '17 days'),
        (c_asset_1, c_tag_aud, c_dev_user, NOW() - INTERVAL '17 days'),

        -- Client Onboarding Template → reusable, client-facing
        (c_asset_2, c_tag_reu, c_dev_user, NOW() - INTERVAL '12 days'),
        (c_asset_2, c_tag_cli, c_dev_user, NOW() - INTERVAL '12 days'),

        -- Compliance Reporting Dashboard → governance, audit-ready, reusable
        (c_asset_3, c_tag_gov, c_dev_user, NOW() - INTERVAL '10 days'),
        (c_asset_3, c_tag_aud, c_dev_user, NOW() - INTERVAL '10 days'),
        (c_asset_3, c_tag_reu, c_dev_user, NOW() - INTERVAL '10 days'),

        -- Client Proposal Model → ai-powered, reusable
        (c_asset_4, c_tag_aip, c_dev_user, NOW() - INTERVAL '8 days'),
        (c_asset_4, c_tag_reu, c_dev_user, NOW() - INTERVAL '8 days'),

        -- Analytics Data Product → data-product, pii-sensitive, governance
        (c_asset_5, c_tag_dp,  c_dev_user, NOW() - INTERVAL '6 days'),
        (c_asset_5, c_tag_pii, c_dev_user, NOW() - INTERVAL '6 days'),
        (c_asset_5, c_tag_gov, c_dev_user, NOW() - INTERVAL '6 days'),

        -- ESG Disclosure Pipeline → governance, audit-ready
        (c_asset_6, c_tag_gov, c_dev_user, NOW() - INTERVAL '4 days'),
        (c_asset_6, c_tag_aud, c_dev_user, NOW() - INTERVAL '4 days')

    ON CONFLICT DO NOTHING;

    RAISE NOTICE '[7/7] Asset tags inserted.';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Dev seed complete. 6 assets with versions, refs, tags, and classifications.';
    RAISE NOTICE '============================================================';

END;
$$ LANGUAGE plpgsql;

COMMIT;
