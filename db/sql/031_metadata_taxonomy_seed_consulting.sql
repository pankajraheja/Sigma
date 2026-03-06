-- =============================================================================
-- 031_metadata_taxonomy_seed_consulting.sql
-- SigAI Platform — "Consulting Firm Taxonomy" seed data
--
-- Seeds one scheme, five buckets, terms per bucket, and aliases:
--
--   Scheme:  consulting_firm
--   Buckets: service_lines, industries, delivery_models,
--            client_segments, assets_accelerators
--
-- All term labels end with "-d" (draft marker).
--
-- PREREQUISITES:
--   030_metadata_taxonomy.sql   (taxonomy_schemes, _buckets, _terms, _aliases)
--
-- IDEMPOTENT: ON CONFLICT DO NOTHING on all inserts.
-- EXECUTION:
--   psql -d <database> -f db/sql/031_metadata_taxonomy_seed_consulting.sql
--
-- Target: PostgreSQL 16+
-- =============================================================================


DO $$
DECLARE
    -- scheme
    v_scheme_id UUID;

    -- bucket IDs
    v_b_service_lines       UUID;
    v_b_industries          UUID;
    v_b_delivery_models     UUID;
    v_b_client_segments     UUID;
    v_b_assets_accelerators UUID;

    -- reusable parent term handles
    v_parent UUID;
    v_term   UUID;
BEGIN

    -- ═════════════════════════════════════════════════════════════════════════
    -- 1. SCHEME
    -- ═════════════════════════════════════════════════════════════════════════
    INSERT INTO metadata.taxonomy_schemes (scheme_key, label, description, sort_order)
    VALUES ('consulting_firm', 'Consulting Firm Taxonomy-d', 'Reusable taxonomy for a professional-services consulting firm.', 1)
    ON CONFLICT (scheme_key) DO NOTHING;

    SELECT id INTO v_scheme_id
      FROM metadata.taxonomy_schemes
     WHERE scheme_key = 'consulting_firm';

    -- ═════════════════════════════════════════════════════════════════════════
    -- 2. BUCKETS
    -- ═════════════════════════════════════════════════════════════════════════

    -- Service Lines  (multi-select YES, required YES)
    INSERT INTO metadata.taxonomy_buckets (scheme_id, bucket_key, label, description, is_multi_select, is_required, sort_order)
    VALUES (v_scheme_id, 'service_lines', 'Service Lines-d',
            'Primary consulting service lines offered by the firm.',
            TRUE, TRUE, 10)
    ON CONFLICT (scheme_id, bucket_key) DO NOTHING;

    -- Industries  (multi-select YES, required YES)
    INSERT INTO metadata.taxonomy_buckets (scheme_id, bucket_key, label, description, is_multi_select, is_required, sort_order)
    VALUES (v_scheme_id, 'industries', 'Industries-d',
            'Industry verticals the firm serves.',
            TRUE, TRUE, 20)
    ON CONFLICT (scheme_id, bucket_key) DO NOTHING;

    -- Delivery Models  (multi-select NO, required YES)
    INSERT INTO metadata.taxonomy_buckets (scheme_id, bucket_key, label, description, is_multi_select, is_required, sort_order)
    VALUES (v_scheme_id, 'delivery_models', 'Delivery Models-d',
            'Engagement delivery methodologies.',
            FALSE, TRUE, 30)
    ON CONFLICT (scheme_id, bucket_key) DO NOTHING;

    -- Client Segments  (multi-select YES, required NO)
    INSERT INTO metadata.taxonomy_buckets (scheme_id, bucket_key, label, description, is_multi_select, is_required, sort_order)
    VALUES (v_scheme_id, 'client_segments', 'Client Segments-d',
            'Client size and sector segments.',
            TRUE, FALSE, 40)
    ON CONFLICT (scheme_id, bucket_key) DO NOTHING;

    -- Assets & Accelerators  (multi-select YES, required NO)
    INSERT INTO metadata.taxonomy_buckets (scheme_id, bucket_key, label, description, is_multi_select, is_required, sort_order)
    VALUES (v_scheme_id, 'assets_accelerators', 'Assets & Accelerators-d',
            'Reusable IP, tools, and accelerators.',
            TRUE, FALSE, 50)
    ON CONFLICT (scheme_id, bucket_key) DO NOTHING;

    -- Resolve bucket IDs
    SELECT id INTO v_b_service_lines       FROM metadata.taxonomy_buckets WHERE scheme_id = v_scheme_id AND bucket_key = 'service_lines';
    SELECT id INTO v_b_industries          FROM metadata.taxonomy_buckets WHERE scheme_id = v_scheme_id AND bucket_key = 'industries';
    SELECT id INTO v_b_delivery_models     FROM metadata.taxonomy_buckets WHERE scheme_id = v_scheme_id AND bucket_key = 'delivery_models';
    SELECT id INTO v_b_client_segments     FROM metadata.taxonomy_buckets WHERE scheme_id = v_scheme_id AND bucket_key = 'client_segments';
    SELECT id INTO v_b_assets_accelerators FROM metadata.taxonomy_buckets WHERE scheme_id = v_scheme_id AND bucket_key = 'assets_accelerators';


    -- ═════════════════════════════════════════════════════════════════════════
    -- 3. TERMS — Service Lines
    -- ═════════════════════════════════════════════════════════════════════════
    INSERT INTO metadata.taxonomy_terms (bucket_id, term_key, label, description, sort_order) VALUES
        (v_b_service_lines, 'advisory',               'Advisory-d',                       'Strategy, risk, and management consulting.',           10),
        (v_b_service_lines, 'audit_assurance',         'Audit & Assurance-d',              'External audit, attestation, and assurance services.', 20),
        (v_b_service_lines, 'tax',                     'Tax-d',                            'Corporate tax, transfer pricing, and indirect tax.',   30),
        (v_b_service_lines, 'deal_advisory',           'Deal Advisory-d',                  'M&A, due diligence, and restructuring.',               40),
        (v_b_service_lines, 'consulting',              'Consulting-d',                     'Technology, operations, and transformation consulting.',50),
        (v_b_service_lines, 'legal_services',          'Legal Services-d',                 'Legal advisory and regulatory compliance services.',    60),
        (v_b_service_lines, 'risk_compliance',         'Risk & Compliance-d',              'IT risk, internal audit, regulatory compliance.',       70),
        (v_b_service_lines, 'esg',                     'ESG & Sustainability-d',           'Climate risk, ESG reporting, and CSRD compliance.',     80)
    ON CONFLICT (bucket_id, term_key) DO NOTHING;


    -- ═════════════════════════════════════════════════════════════════════════
    -- 4. TERMS — Industries  (with nesting)
    -- ═════════════════════════════════════════════════════════════════════════
    INSERT INTO metadata.taxonomy_terms (bucket_id, term_key, label, description, sort_order) VALUES
        (v_b_industries, 'financial_services',     'Financial Services-d',           'Banking, insurance, capital markets.',                10),
        (v_b_industries, 'healthcare_life_sci',    'Healthcare & Life Sciences-d',   'Hospitals, pharma, biotech.',                         20),
        (v_b_industries, 'energy_natural_res',     'Energy & Natural Resources-d',   'Oil & gas, mining, utilities, renewables.',            30),
        (v_b_industries, 'tmt',                    'Technology, Media & Telecom-d',  'Tech, media, and telecommunications.',                 40),
        (v_b_industries, 'government_public',      'Government & Public Sector-d',   'Federal, state, and local government.',                50),
        (v_b_industries, 'industrial_manufacturing','Industrial & Manufacturing-d',  'Automotive, aerospace, chemicals, heavy industry.',    60),
        (v_b_industries, 'consumer_retail',        'Consumer & Retail-d',            'CPG, retail, e-commerce, hospitality.',                70),
        (v_b_industries, 'real_estate',            'Real Estate-d',                  'Commercial and residential property services.',        80),
        (v_b_industries, 'infrastructure_transport','Infrastructure & Transport-d',  'Rail, aviation, ports, and logistics.',                90),
        (v_b_industries, 'education',              'Education-d',                    'Higher ed, K-12, and edtech.',                        100)
    ON CONFLICT (bucket_id, term_key) DO NOTHING;

    -- Sub-industries under Financial Services
    SELECT id INTO v_parent FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_industries AND term_key = 'financial_services';

    IF v_parent IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_terms (bucket_id, term_key, label, parent_term_id, sort_order) VALUES
            (v_b_industries, 'banking',           'Banking-d',           v_parent, 11),
            (v_b_industries, 'insurance',         'Insurance-d',         v_parent, 12),
            (v_b_industries, 'capital_markets',   'Capital Markets-d',   v_parent, 13),
            (v_b_industries, 'wealth_management', 'Wealth Management-d', v_parent, 14)
        ON CONFLICT (bucket_id, term_key) DO NOTHING;
    END IF;

    -- Sub-industries under TMT
    SELECT id INTO v_parent FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_industries AND term_key = 'tmt';

    IF v_parent IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_terms (bucket_id, term_key, label, parent_term_id, sort_order) VALUES
            (v_b_industries, 'software_platforms', 'Software & Platforms-d', v_parent, 41),
            (v_b_industries, 'media_entertainment','Media & Entertainment-d',v_parent, 42),
            (v_b_industries, 'telecom',            'Telecommunications-d',   v_parent, 43)
        ON CONFLICT (bucket_id, term_key) DO NOTHING;
    END IF;


    -- ═════════════════════════════════════════════════════════════════════════
    -- 5. TERMS — Delivery Models
    -- ═════════════════════════════════════════════════════════════════════════
    INSERT INTO metadata.taxonomy_terms (bucket_id, term_key, label, description, sort_order) VALUES
        (v_b_delivery_models, 'onsite',          'On-site-d',           'Full-time on-site at client location.',         10),
        (v_b_delivery_models, 'nearshore',       'Nearshore-d',         'Same or adjacent time-zone delivery centre.',   20),
        (v_b_delivery_models, 'offshore',        'Offshore-d',          'Remote delivery centre (cost-optimised).',      30),
        (v_b_delivery_models, 'hybrid',          'Hybrid-d',            'Blended on-site and remote delivery.',          40),
        (v_b_delivery_models, 'managed_service', 'Managed Service-d',   'Ongoing managed engagement with SLA.',          50),
        (v_b_delivery_models, 'staff_aug',       'Staff Augmentation-d','Individual or team staff augmentation.',        60)
    ON CONFLICT (bucket_id, term_key) DO NOTHING;


    -- ═════════════════════════════════════════════════════════════════════════
    -- 6. TERMS — Client Segments
    -- ═════════════════════════════════════════════════════════════════════════
    INSERT INTO metadata.taxonomy_terms (bucket_id, term_key, label, description, sort_order) VALUES
        (v_b_client_segments, 'enterprise',      'Enterprise-d',        'Large multinational corporations (>50k employees).',   10),
        (v_b_client_segments, 'mid_market',      'Mid-Market-d',        'Mid-size organisations (1k–50k employees).',           20),
        (v_b_client_segments, 'growth_stage',    'Growth Stage-d',      'High-growth, VC/PE-backed, scale-up companies.',       30),
        (v_b_client_segments, 'public_sector',   'Public Sector-d',     'Government agencies and quasi-government bodies.',     40),
        (v_b_client_segments, 'non_profit',      'Non-Profit-d',        'NGOs, foundations, and international organisations.',  50),
        (v_b_client_segments, 'private_equity',  'Private Equity-d',    'PE portfolio companies and fund operations.',          60)
    ON CONFLICT (bucket_id, term_key) DO NOTHING;


    -- ═════════════════════════════════════════════════════════════════════════
    -- 7. TERMS — Assets & Accelerators
    -- ═════════════════════════════════════════════════════════════════════════
    INSERT INTO metadata.taxonomy_terms (bucket_id, term_key, label, description, sort_order) VALUES
        (v_b_assets_accelerators, 'diagnostic_tool',     'Diagnostic Tool-d',         'Assessment or maturity diagnostic.',                   10),
        (v_b_assets_accelerators, 'data_platform',       'Data Platform-d',           'Pre-built data lakehouse or warehouse accelerator.',   20),
        (v_b_assets_accelerators, 'reporting_dashboard', 'Reporting Dashboard-d',     'Configurable BI / KPI dashboard.',                     30),
        (v_b_assets_accelerators, 'automation_bot',      'Automation Bot-d',          'RPA or intelligent-automation workflow.',               40),
        (v_b_assets_accelerators, 'ai_model',            'AI Model-d',               'Pre-trained or fine-tuned ML/GenAI model.',             50),
        (v_b_assets_accelerators, 'integration_kit',     'Integration Kit-d',        'Pre-built connectors, APIs, and middleware adapters.',  60),
        (v_b_assets_accelerators, 'playbook',            'Playbook-d',               'Methodology guide or engagement playbook.',             70),
        (v_b_assets_accelerators, 'reference_arch',      'Reference Architecture-d', 'Cloud or data reference architecture blueprint.',       80),
        (v_b_assets_accelerators, 'training_content',    'Training Content-d',       'Upskilling materials, workshops, and courseware.',      90)
    ON CONFLICT (bucket_id, term_key) DO NOTHING;


    -- ═════════════════════════════════════════════════════════════════════════
    -- 8. ALIASES / SYNONYMS
    -- ═════════════════════════════════════════════════════════════════════════

    -- TMT → Technology, Media & Telecom
    SELECT id INTO v_term FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_industries AND term_key = 'tmt';

    IF v_term IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_aliases (term_id, alias_label) VALUES
            (v_term, 'TMT'),
            (v_term, 'Tech/Media/Telecom')
        ON CONFLICT (term_id, alias_label, locale) DO NOTHING;
    END IF;

    -- BI → Reporting Dashboard
    SELECT id INTO v_term FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_assets_accelerators AND term_key = 'reporting_dashboard';

    IF v_term IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_aliases (term_id, alias_label) VALUES
            (v_term, 'BI'),
            (v_term, 'Business Intelligence Dashboard')
        ON CONFLICT (term_id, alias_label, locale) DO NOTHING;
    END IF;

    -- AI & Analytics → AI Model
    SELECT id INTO v_term FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_assets_accelerators AND term_key = 'ai_model';

    IF v_term IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_aliases (term_id, alias_label) VALUES
            (v_term, 'AI & Analytics'),
            (v_term, 'GenAI Model'),
            (v_term, 'ML Model')
        ON CONFLICT (term_id, alias_label, locale) DO NOTHING;
    END IF;

    -- Data → Data Platform
    SELECT id INTO v_term FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_assets_accelerators AND term_key = 'data_platform';

    IF v_term IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_aliases (term_id, alias_label) VALUES
            (v_term, 'Data'),
            (v_term, 'Data Lakehouse'),
            (v_term, 'Data Warehouse')
        ON CONFLICT (term_id, alias_label, locale) DO NOTHING;
    END IF;

    -- ESG → ESG & Sustainability service line
    SELECT id INTO v_term FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_service_lines AND term_key = 'esg';

    IF v_term IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_aliases (term_id, alias_label) VALUES
            (v_term, 'Sustainability'),
            (v_term, 'CSRD'),
            (v_term, 'Climate Risk')
        ON CONFLICT (term_id, alias_label, locale) DO NOTHING;
    END IF;

    -- Staff Aug
    SELECT id INTO v_term FROM metadata.taxonomy_terms
     WHERE bucket_id = v_b_delivery_models AND term_key = 'staff_aug';

    IF v_term IS NOT NULL THEN
        INSERT INTO metadata.taxonomy_aliases (term_id, alias_label) VALUES
            (v_term, 'Staff Aug'),
            (v_term, 'Body Shopping'),
            (v_term, 'T&M')
        ON CONFLICT (term_id, alias_label, locale) DO NOTHING;
    END IF;


    RAISE NOTICE '031_metadata_taxonomy_seed_consulting: consulting firm taxonomy seeded.';

END $$;
