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
-- Does NOT target org.* or governance.* — those are separate schemas and the
-- catalog backend treats their FK columns as opaque UUID strings (no FK
-- enforcement in this service).
--
-- All visible record names carry the '-d' suffix to mark dev/dummy data.
-- Safe to run repeatedly — all inserts use ON CONFLICT DO NOTHING.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. TAXONOMY TERMS  (metadata.taxonomy_terms)
--    Two schemes: service_line and capability.
--    These populate the "Taxonomy & Classification" panel on the detail page.
-- ---------------------------------------------------------------------------

INSERT INTO metadata.taxonomy_terms (id, scheme_code, code, label, is_active)
VALUES
  -- Service line
  ('t0000001-0000-0000-0000-000000000101', 'service_line', 'TAX',  'Tax-d',             TRUE),
  ('t0000001-0000-0000-0000-000000000102', 'service_line', 'AUD',  'Audit-d',           TRUE),
  ('t0000001-0000-0000-0000-000000000103', 'service_line', 'ADV',  'Advisory-d',        TRUE),
  ('t0000001-0000-0000-0000-000000000104', 'service_line', 'TECH', 'Technology-d',      TRUE),
  -- Capability area
  ('t0000001-0000-0000-0000-000000000201', 'capability', 'DA',   'Data & Analytics-d',      TRUE),
  ('t0000001-0000-0000-0000-000000000202', 'capability', 'PA',   'Process Automation-d',    TRUE),
  ('t0000001-0000-0000-0000-000000000203', 'capability', 'AI',   'AI & Machine Learning-d', TRUE),
  ('t0000001-0000-0000-0000-000000000204', 'capability', 'REP',  'Reporting-d',             TRUE)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. TAGS  (metadata.tags)
--    These populate the "Tags" panel on the detail page and are indexed for
--    trigram search via GET /api/catalog/tags.
-- ---------------------------------------------------------------------------

INSERT INTO metadata.tags (id, label, created_at)
VALUES
  ('g0000001-0000-0000-0000-000000000001', 'governance-d',    NOW() - INTERVAL '30 days'),
  ('g0000001-0000-0000-0000-000000000002', 'pii-sensitive-d', NOW() - INTERVAL '29 days'),
  ('g0000001-0000-0000-0000-000000000003', 'audit-ready-d',   NOW() - INTERVAL '28 days'),
  ('g0000001-0000-0000-0000-000000000004', 'client-facing-d', NOW() - INTERVAL '27 days'),
  ('g0000001-0000-0000-0000-000000000005', 'reusable-d',      NOW() - INTERVAL '26 days'),
  ('g0000001-0000-0000-0000-000000000006', 'ai-powered-d',    NOW() - INTERVAL '25 days'),
  ('g0000001-0000-0000-0000-000000000007', 'data-product-d',  NOW() - INTERVAL '24 days')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. CATALOG ASSETS  (catalog.assets)
--
--    Column notes:
--      source_module_id     — module registry id (forge, prototype-builder, etc.)
--      primary_country_id   — opaque UUID; no FK enforced in catalog schema
--      compliance_tags      — text[] (not a FK table)
--      search_vector        — GENERATED ALWAYS; omit from INSERT
--      approved_submission_id — nullable; set NULL to avoid cross-schema FK
-- ---------------------------------------------------------------------------

INSERT INTO catalog.assets (
  id,
  name,
  short_summary,
  description,
  asset_kind,
  publication_status,
  source_module_id,
  source_entity_type,
  source_entity_id,
  owner_id,
  primary_country_id,
  opco_id,
  function_group_id,
  industry_sector_id,
  service_offering_id,
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
  domain,
  approved_submission_id,
  usage_count,
  featured,
  published_at,
  created_at,
  updated_at
)
VALUES

  -- ── Asset 1: Tax Review Workflow ──────────────────────────────────────────
  (
    'a0000001-0000-0000-0000-000000000001',
    'Tax Review Workflow-d',
    'Governed multi-approver workflow for tax review and EU compliance routing-d.',
    'Reusable governed workflow for automated tax review and approval routing. Handles multi-approver chains, escalation rules, and EU compliance gates. Certified for use across KPMG Germany and EU jurisdictions-d.',
    'workflow', 'ga',
    'forge', 'workflow', 'f0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-tax-ops-de-0d',
    '11111111-1111-1111-1111-111111111112',   -- Germany
    '22222222-2222-2222-2222-222222222222',   -- KPMG Germany opco
    '33333333-3333-3333-3333-333333333332',   -- Tax function group
    '44444444-4444-4444-4444-444444444441',   -- Financial Services
    '55555555-5555-5555-5555-555555555551',   -- Data & Analytics offering
    'confidential', 'internal', 'internal', 'high', 'EU',
    TRUE,  FALSE, '7 years', '99.5% uptime · 4hr support SLA',
    ARRAY['SOX', 'GDPR'], 'Tax',
    NULL, 142, TRUE,
    NOW() - INTERVAL '17 days',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '17 days'
  ),

  -- ── Asset 2: Client Onboarding Prototype ──────────────────────────────────
  (
    'a0000001-0000-0000-0000-000000000002',
    'Client Onboarding Prototype-d',
    'Validated prototype for the end-to-end client onboarding experience-d.',
    'Approved prototype asset for client onboarding journey design. Built in Prototype Lab and validated by the Advisory Experience team. Covers KYC steps, document upload, and welcome flow. Ready for handoff to Solution Studio-d.',
    'prototype', 'ga',
    'prototype-builder', 'project', 'p0000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-exp-team-us-0d',
    '11111111-1111-1111-1111-111111111111',   -- United States
    '22222222-2222-2222-2222-222222222221',   -- KPMG US opco
    '33333333-3333-3333-3333-333333333331',   -- Advisory function group
    '44444444-4444-4444-4444-444444444444',   -- Consumer & Retail
    '55555555-5555-5555-5555-555555555552',   -- Systems Integration
    'internal', 'internal', 'client-facing', 'medium', 'US',
    FALSE, TRUE,  '3 years', NULL,
    ARRAY['AML'], 'Advisory',
    NULL, 87, TRUE,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '12 days'
  ),

  -- ── Asset 3: Compliance Reporting App ────────────────────────────────────
  (
    'a0000001-0000-0000-0000-000000000003',
    'Compliance Reporting App-d',
    'Production-ready application for regulatory compliance report generation-d.',
    'Full-stack compliance reporting application built and certified by the Audit Engineering team. Supports UK regulatory frameworks, automated scheduling, and PDF/Excel export. Now on v2.0.0 with enhanced audit trail and GDPR data-subject export functionality-d.',
    'application', 'ga',
    'app-builder', 'application', 'a0000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-eng-team-uk-0d',
    '11111111-1111-1111-1111-111111111113',   -- United Kingdom
    '22222222-2222-2222-2222-222222222223',   -- KPMG UK opco
    '33333333-3333-3333-3333-333333333333',   -- Audit function group
    '44444444-4444-4444-4444-444444444441',   -- Financial Services
    '55555555-5555-5555-5555-555555555551',   -- Data & Analytics offering
    'internal', 'cloud', 'internal', 'high', 'UK',
    FALSE, FALSE, '5 years', '99.9% uptime · 2hr P1 SLA',
    ARRAY['ISO-27001', 'GDPR'], 'Audit',
    NULL, 213, TRUE,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 days'
  ),

  -- ── Asset 4: Client Proposal Assistant (preview) ─────────────────────────
  (
    'a0000001-0000-0000-0000-000000000004',
    'Client Proposal Assistant-d',
    'AI agent that drafts and refines client proposals using approved templates-d.',
    'Preview-stage AI agent for proposal drafting and reuse guidance. Powered by Agent Forge, retrieves relevant prior proposals from AI Navigator, and structures outputs against the engagement template library. Pending full GA certification-d.',
    'agent', 'preview',
    'forge', 'agent_spec', 'f0000000-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-agent-team-in-d',
    '11111111-1111-1111-1111-111111111114',   -- India
    '22222222-2222-2222-2222-222222222224',   -- KPMG India opco
    '33333333-3333-3333-3333-333333333331',   -- Advisory function group
    '44444444-4444-4444-4444-444444444442',   -- Healthcare
    '55555555-5555-5555-5555-555555555553',   -- AI & Automation offering
    'restricted', 'internal', 'internal', 'high', 'IN',
    TRUE,  FALSE, '2 years', NULL,
    ARRAY['GDPR'], 'Advisory',
    NULL, 31, FALSE,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
  ),

  -- ── Asset 5: Analytics Data Product ──────────────────────────────────────
  (
    'a0000001-0000-0000-0000-000000000005',
    'Analytics Data Product-d',
    'Governed dataset promoted via Request Hub intake — client engagement KPIs-d.',
    'Reusable analytics data product promoted via Request Hub intake workflow. Contains aggregated client engagement metrics and deal pipeline KPIs. Classified as confidential due to client-identifiable fields. Approved for internal analytics teams only-d.',
    'dataset', 'ga',
    'intake', 'request', 'i0000000-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-analytics-us-0d',
    '11111111-1111-1111-1111-111111111111',   -- United States
    '22222222-2222-2222-2222-222222222221',   -- KPMG US opco
    '33333333-3333-3333-3333-333333333334',   -- Backoffice function group
    '44444444-4444-4444-4444-444444444443',   -- Energy
    '55555555-5555-5555-5555-555555555551',   -- Data & Analytics offering
    'confidential', 'internal', 'internal', 'medium', 'US',
    TRUE,  FALSE, '6 years', NULL,
    ARRAY['SOX', 'CCPA'], 'Analytics',
    NULL, 76, FALSE,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '6 days'
  ),

  -- ── Asset 6: ESG Disclosure Workflow ─────────────────────────────────────
  (
    'a0000001-0000-0000-0000-000000000006',
    'ESG Disclosure Workflow-d',
    'Automated workflow for CSRD and GRI ESG disclosure collection and validation-d.',
    'Governed multi-step workflow for ESG disclosure data collection, validation, and audit trail generation. Integrates with the reporting layer for CSRD and GRI compliance. Certified for use across EU and UK jurisdictions-d.',
    'workflow', 'ga',
    'forge', 'workflow', 'f0000000-0000-0000-0000-000000000006',
    '22222222-2222-2222-2222-advisory-de-0d',
    '11111111-1111-1111-1111-111111111112',   -- Germany
    '22222222-2222-2222-2222-222222222222',   -- KPMG Germany opco
    '33333333-3333-3333-3333-333333333331',   -- Advisory function group
    '44444444-4444-4444-4444-444444444441',   -- Financial Services
    '55555555-5555-5555-5555-555555555553',   -- AI & Automation offering
    'confidential', 'internal', 'internal', 'high', 'EU',
    FALSE, FALSE, '10 years', '99.5% uptime · 4hr support SLA',
    ARRAY['CSRD', 'GRI', 'GDPR'], 'Advisory',
    NULL, 58, TRUE,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
  )

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. ASSET VERSIONS  (catalog.asset_versions)
--
--    Column notes:
--      version_tag  — text semver string (not an integer)
--      is_current   — boolean; only one TRUE per asset_id
--      changelog    — nullable prose (not snapshot_json)
--      released_by  — opaque user identifier string
-- ---------------------------------------------------------------------------

INSERT INTO catalog.asset_versions (
  id, asset_id, version_tag, is_current, changelog, released_at, released_by, created_at
)
VALUES
  -- Asset 1: Tax Review Workflow (1 version)
  ('v0000001-0000-0000-0001-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   '1.0.0', TRUE,
   'Initial GA release. Multi-approver routing and EU compliance gates-d.',
   NOW() - INTERVAL '17 days', 'usr-tax-ops-de-d',
   NOW() - INTERVAL '17 days'),

  -- Asset 2: Client Onboarding Prototype (1 version)
  ('v0000001-0000-0000-0002-000000000001',
   'a0000001-0000-0000-0000-000000000002',
   '1.0.0', TRUE,
   'Initial GA release. KYC, document upload, and welcome flow-d.',
   NOW() - INTERVAL '12 days', 'usr-exp-team-us-d',
   NOW() - INTERVAL '12 days'),

  -- Asset 3: Compliance Reporting App (2 versions)
  ('v0000001-0000-0000-0003-000000000001',
   'a0000001-0000-0000-0000-000000000003',
   '1.0.0', FALSE,
   'Initial GA release. UK regulatory report templates-d.',
   NOW() - INTERVAL '11 days', 'usr-eng-team-uk-d',
   NOW() - INTERVAL '11 days'),
  ('v0000001-0000-0000-0003-000000000002',
   'a0000001-0000-0000-0000-000000000003',
   '2.0.0', TRUE,
   'Enhanced audit trail; added GDPR data-subject export and PDF/Excel formatting-d.',
   NOW() - INTERVAL '10 days', 'usr-eng-team-uk-d',
   NOW() - INTERVAL '10 days'),

  -- Asset 4: Client Proposal Assistant (1 preview version)
  ('v0000001-0000-0000-0004-000000000001',
   'a0000001-0000-0000-0000-000000000004',
   '0.1.0', TRUE,
   'Initial preview release. Pending full certification-d.',
   NOW() - INTERVAL '8 days', 'usr-agent-team-in-d',
   NOW() - INTERVAL '8 days'),

  -- Asset 5: Analytics Data Product (1 version)
  ('v0000001-0000-0000-0005-000000000001',
   'a0000001-0000-0000-0000-000000000005',
   '1.0.0', TRUE,
   'Initial GA release. Promoted from Request Hub intake workflow-d.',
   NOW() - INTERVAL '6 days', 'usr-analytics-us-d',
   NOW() - INTERVAL '6 days'),

  -- Asset 6: ESG Disclosure Workflow (1 version)
  ('v0000001-0000-0000-0006-000000000001',
   'a0000001-0000-0000-0000-000000000006',
   '1.0.0', TRUE,
   'Initial GA release. CSRD and GRI framework alignment-d.',
   NOW() - INTERVAL '4 days', 'usr-advisory-de-d',
   NOW() - INTERVAL '4 days')

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. ASSET SOURCE REFS  (catalog.asset_source_refs)
--
--    Column notes:
--      ref_type — enum: forge_asset_id | github_repo | dbt_model |
--                       confluence_page | jira_project | other
--      ref_value — the raw ID / path / URL in the source system
--      href      — optional deep-link shown in the UI
-- ---------------------------------------------------------------------------

INSERT INTO catalog.asset_source_refs (
  id, asset_id, ref_type, ref_value, label, href, is_primary, added_by, added_at
)
VALUES
  ('r0000001-0000-0000-0001-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   'forge_asset_id', 'f0000000-0000-0000-0000-000000000001',
   'Tax Review Workflow in Agent Forge-d', NULL,
   TRUE, 'usr-tax-ops-de-d', NOW() - INTERVAL '17 days'),

  ('r0000001-0000-0000-0002-000000000001',
   'a0000001-0000-0000-0000-000000000002',
   'forge_asset_id', 'p0000000-0000-0000-0000-000000000002',
   'Client Onboarding Prototype in Prototype Lab-d', NULL,
   TRUE, 'usr-exp-team-us-d', NOW() - INTERVAL '12 days'),

  ('r0000001-0000-0000-0003-000000000001',
   'a0000001-0000-0000-0000-000000000003',
   'github_repo', 'kpmg-internal/compliance-reporting-app-d',
   'GitHub — compliance-reporting-app-d', NULL,
   TRUE, 'usr-eng-team-uk-d', NOW() - INTERVAL '10 days'),

  ('r0000001-0000-0000-0004-000000000001',
   'a0000001-0000-0000-0000-000000000004',
   'forge_asset_id', 'f0000000-0000-0000-0000-000000000004',
   'Client Proposal Assistant in Agent Forge-d', NULL,
   TRUE, 'usr-agent-team-in-d', NOW() - INTERVAL '8 days'),

  ('r0000001-0000-0000-0005-000000000001',
   'a0000001-0000-0000-0000-000000000005',
   'dbt_model', 'analytics.engagement_data_product_d',
   'dbt — analytics.engagement_data_product-d', NULL,
   TRUE, 'usr-analytics-us-d', NOW() - INTERVAL '6 days'),

  ('r0000001-0000-0000-0006-000000000001',
   'a0000001-0000-0000-0000-000000000006',
   'forge_asset_id', 'f0000000-0000-0000-0000-000000000006',
   'ESG Disclosure Workflow in Agent Forge-d', NULL,
   TRUE, 'usr-advisory-de-d', NOW() - INTERVAL '4 days')

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. TAXONOMY CLASSIFICATIONS  (catalog.asset_classifications)
--
--    JOIN target: metadata.taxonomy_terms (term_id must exist above).
--    scheme_code is denormalised here for indexed filtering.
-- ---------------------------------------------------------------------------

INSERT INTO catalog.asset_classifications (
  id, asset_id, term_id, scheme_code, classified_by, classified_at
)
VALUES
  -- Tax Review Workflow → Tax (service_line) + Process Automation (capability)
  ('c0000001-0001-0000-0001-000000000001', 'a0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000101', 'service_line', 'system-d', NOW() - INTERVAL '17 days'),
  ('c0000001-0001-0000-0001-000000000002', 'a0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000202', 'capability',   'system-d', NOW() - INTERVAL '17 days'),

  -- Client Onboarding Prototype → Advisory (service_line) + Process Automation (capability)
  ('c0000001-0002-0000-0001-000000000001', 'a0000001-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000103', 'service_line', 'system-d', NOW() - INTERVAL '12 days'),
  ('c0000001-0002-0000-0001-000000000002', 'a0000001-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000202', 'capability',   'system-d', NOW() - INTERVAL '12 days'),

  -- Compliance Reporting App → Audit (service_line) + Reporting (capability)
  ('c0000001-0003-0000-0001-000000000001', 'a0000001-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000102', 'service_line', 'system-d', NOW() - INTERVAL '10 days'),
  ('c0000001-0003-0000-0001-000000000002', 'a0000001-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000204', 'capability',   'system-d', NOW() - INTERVAL '10 days'),

  -- Client Proposal Assistant → Advisory (service_line) + AI & ML (capability)
  ('c0000001-0004-0000-0001-000000000001', 'a0000001-0000-0000-0000-000000000004', 't0000001-0000-0000-0000-000000000103', 'service_line', 'system-d', NOW() - INTERVAL '8 days'),
  ('c0000001-0004-0000-0001-000000000002', 'a0000001-0000-0000-0000-000000000004', 't0000001-0000-0000-0000-000000000203', 'capability',   'system-d', NOW() - INTERVAL '8 days'),

  -- Analytics Data Product → Advisory (service_line) + Data & Analytics (capability)
  ('c0000001-0005-0000-0001-000000000001', 'a0000001-0000-0000-0000-000000000005', 't0000001-0000-0000-0000-000000000103', 'service_line', 'system-d', NOW() - INTERVAL '6 days'),
  ('c0000001-0005-0000-0001-000000000002', 'a0000001-0000-0000-0000-000000000005', 't0000001-0000-0000-0000-000000000201', 'capability',   'system-d', NOW() - INTERVAL '6 days'),

  -- ESG Disclosure Workflow → Advisory (service_line) + Process Automation (capability)
  ('c0000001-0006-0000-0001-000000000001', 'a0000001-0000-0000-0000-000000000006', 't0000001-0000-0000-0000-000000000103', 'service_line', 'system-d', NOW() - INTERVAL '4 days'),
  ('c0000001-0006-0000-0001-000000000002', 'a0000001-0000-0000-0000-000000000006', 't0000001-0000-0000-0000-000000000202', 'capability',   'system-d', NOW() - INTERVAL '4 days')

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. ASSET TAGS  (catalog.asset_tags)
--
--    JOIN target: metadata.tags (tag_id must exist above).
--    PK is typically (asset_id, tag_id).
-- ---------------------------------------------------------------------------

INSERT INTO catalog.asset_tags (asset_id, tag_id, tagged_by, tagged_at)
VALUES
  -- Tax Review Workflow → governance, pii-sensitive, audit-ready
  ('a0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000001', 'system-d', NOW() - INTERVAL '17 days'),
  ('a0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000002', 'system-d', NOW() - INTERVAL '17 days'),
  ('a0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000003', 'system-d', NOW() - INTERVAL '17 days'),

  -- Client Onboarding Prototype → reusable, client-facing
  ('a0000001-0000-0000-0000-000000000002', 'g0000001-0000-0000-0000-000000000005', 'system-d', NOW() - INTERVAL '12 days'),
  ('a0000001-0000-0000-0000-000000000002', 'g0000001-0000-0000-0000-000000000004', 'system-d', NOW() - INTERVAL '12 days'),

  -- Compliance Reporting App → governance, audit-ready, reusable
  ('a0000001-0000-0000-0000-000000000003', 'g0000001-0000-0000-0000-000000000001', 'system-d', NOW() - INTERVAL '10 days'),
  ('a0000001-0000-0000-0000-000000000003', 'g0000001-0000-0000-0000-000000000003', 'system-d', NOW() - INTERVAL '10 days'),
  ('a0000001-0000-0000-0000-000000000003', 'g0000001-0000-0000-0000-000000000005', 'system-d', NOW() - INTERVAL '10 days'),

  -- Client Proposal Assistant → ai-powered, reusable
  ('a0000001-0000-0000-0000-000000000004', 'g0000001-0000-0000-0000-000000000006', 'system-d', NOW() - INTERVAL '8 days'),
  ('a0000001-0000-0000-0000-000000000004', 'g0000001-0000-0000-0000-000000000005', 'system-d', NOW() - INTERVAL '8 days'),

  -- Analytics Data Product → data-product, pii-sensitive, governance
  ('a0000001-0000-0000-0000-000000000005', 'g0000001-0000-0000-0000-000000000007', 'system-d', NOW() - INTERVAL '6 days'),
  ('a0000001-0000-0000-0000-000000000005', 'g0000001-0000-0000-0000-000000000002', 'system-d', NOW() - INTERVAL '6 days'),
  ('a0000001-0000-0000-0000-000000000005', 'g0000001-0000-0000-0000-000000000001', 'system-d', NOW() - INTERVAL '6 days'),

  -- ESG Disclosure Workflow → governance, audit-ready
  ('a0000001-0000-0000-0000-000000000006', 'g0000001-0000-0000-0000-000000000001', 'system-d', NOW() - INTERVAL '4 days'),
  ('a0000001-0000-0000-0000-000000000006', 'g0000001-0000-0000-0000-000000000003', 'system-d', NOW() - INTERVAL '4 days')

ON CONFLICT DO NOTHING;

COMMIT;
