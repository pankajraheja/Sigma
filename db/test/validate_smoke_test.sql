-- =============================================================================
-- db/test/validate_smoke_test.sql
-- SigAI Platform — Governance + Catalog backbone smoke test validation
--
-- Validates that the seed data from seed_smoke_test.sql correctly represents
-- the full platform flow and that all relationships hold.
--
-- Run AFTER seed_smoke_test.sql has been applied.
--
-- Each query is self-contained and labelled. Expected results are documented
-- in comments above each query.
--
-- EXECUTION:
--   psql -d <database> -f db/test/validate_smoke_test.sql
--
-- Target: PostgreSQL 16
-- =============================================================================


-- =============================================================================
-- VALIDATION 1 — Submission exists with correct governance state
--
-- Expected: 1 row
--   governance_status = 'approved'
--   source_entity_type = 'workflow'
--   source_entity_id = cafecafe-0000-4000-8000-000000000042
--   contains_pii = true
--   data_classification = 'confidential'
--   submission_source_module = 'forge'
--   pipeline_is_resolved = true  (resolved_at IS NOT NULL)
-- =============================================================================

\echo ''
\echo '=== VALIDATION 1: Submission exists with correct governance state ==='

SELECT
    s.id                                          AS submission_id,
    m.module_key                                  AS submission_source_module,
    s.source_entity_type,
    s.source_entity_id,
    s.governance_status,
    s.data_classification,
    s.hosting_type,
    s.contains_pii,
    s.is_client_facing,
    s.business_criticality,
    s.data_residency,
    s.compliance_tags,
    s.resolved_at IS NOT NULL                     AS pipeline_is_resolved,
    s.resolver_notes IS NOT NULL                  AS has_resolver_notes,
    s.updated_at > s.created_at                   AS updated_at_trigger_fired
FROM governance.asset_submissions  s
JOIN platform.modules              m ON m.id = s.source_module_id
WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042';


-- =============================================================================
-- VALIDATION 2 — Stage review pipeline: stage run + reviewer decision
--
-- Expected: 1 row
--   stage_code = 'nfr_review'
--   stage_run_status = 'passed'
--   review_decision = 'approve'
--   review_comments IS NOT NULL
-- =============================================================================

\echo ''
\echo '=== VALIDATION 2: Stage review pipeline (stage run + reviewer decision) ==='

SELECT
    s.governance_status                           AS submission_status,
    sc.code                                       AS stage_code,
    sc.name                                       AS stage_name,
    sr.status                                     AS stage_run_status,
    sr.completed_at IS NOT NULL                   AS stage_completed,
    rv.decision                                   AS review_decision,
    rv.comments IS NOT NULL                       AS review_has_comments,
    rv.reviewed_at
FROM governance.asset_submissions        s
JOIN governance.submission_stage_runs    sr ON sr.submission_id = s.id
JOIN governance.stage_configs            sc ON sc.id = sr.stage_id
JOIN governance.submission_reviews       rv ON rv.stage_run_id = sr.id
WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
ORDER BY sc.sequence_order;


-- =============================================================================
-- VALIDATION 3 — Promotion chain: submission → promotions → catalog
--
-- Expected: 2 rows (one preview promotion, one ga promotion)
--   Row 1: from_status = NULL, to_status = 'preview'
--   Row 2: from_status = 'preview', to_status = 'ga'
--   Both rows reference the same submission and catalog asset.
-- =============================================================================

\echo ''
\echo '=== VALIDATION 3: Promotion chain (submission → promotions → catalog) ==='

SELECT
    pp.promoted_at,
    pp.from_status,
    pp.to_status,
    ca.name                                       AS catalog_asset_name,
    ca.publication_status                         AS current_catalog_status,
    ca.published_at IS NOT NULL                   AS asset_has_published_at,
    s.governance_status                           AS submission_governance_status
FROM governance.publication_promotions   pp
JOIN catalog.assets                      ca ON ca.id = pp.catalog_asset_id
JOIN governance.asset_submissions        s  ON s.id  = pp.submission_id
WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
ORDER BY pp.promoted_at;


-- =============================================================================
-- VALIDATION 4 — Catalog asset exists with correct published state
--
-- Expected: 1 row
--   publication_status = 'ga'
--   asset_kind = 'pipeline'
--   domain = 'risk_compliance'
--   contains_pii = true  (NFR denormalised from submission)
--   data_classification = 'confidential'
--   source_traceability_complete = true  (all three source fields set)
--   governance_link_present = true  (approved_submission_id set)
--   discoverable = true  (publication_status IN ('ga','preview'))
-- =============================================================================

\echo ''
\echo '=== VALIDATION 4: Catalog asset exists with correct published state ==='

SELECT
    ca.id                                         AS catalog_asset_id,
    ca.name,
    ca.asset_kind,
    ca.domain,
    ca.publication_status,
    ca.data_classification,
    ca.hosting_type,
    ca.audience_type,
    ca.business_criticality,
    ca.data_residency,
    ca.contains_pii,
    ca.is_client_facing,
    ca.compliance_tags,
    ca.usage_count,
    ca.featured,
    ca.published_at IS NOT NULL                       AS has_published_at,
    ca.approved_submission_id IS NOT NULL             AS governance_link_present,
    (ca.source_module_id IS NOT NULL
     AND ca.source_entity_type IS NOT NULL
     AND ca.source_entity_id IS NOT NULL)             AS source_traceability_complete,
    ca.publication_status IN ('ga', 'preview')        AS discoverable,
    ca.updated_at > ca.created_at                     AS updated_at_trigger_fired
FROM catalog.assets ca
WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042';


-- =============================================================================
-- VALIDATION 5 — Source traceability: submission ↔ catalog asset match
--
-- Expected: 1 row with all traceability fields matching between
-- governance.asset_submissions and catalog.assets.
--   source_fields_match = true for all three columns
-- =============================================================================

\echo ''
\echo '=== VALIDATION 5: Source traceability preserved across submission and catalog ==='

SELECT
    m.module_key                                  AS source_module,
    s.source_entity_type                          AS submission_entity_type,
    ca.source_entity_type                         AS catalog_entity_type,
    s.source_entity_id                            AS submission_entity_id,
    ca.source_entity_id                           AS catalog_entity_id,
    -- Verify all three source fields are consistent across submission and catalog
    (s.source_module_id = ca.source_module_id)    AS module_id_matches,
    (s.source_entity_type = ca.source_entity_type) AS entity_type_matches,
    (s.source_entity_id = ca.source_entity_id)    AS entity_id_matches,
    ca.approved_submission_id = s.id              AS submission_link_correct
FROM catalog.assets                ca
JOIN governance.asset_submissions  s  ON s.id = ca.approved_submission_id
JOIN platform.modules              m  ON m.id = s.source_module_id
WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042';


-- =============================================================================
-- VALIDATION 6 — Org dimensions join correctly
--
-- Expected: 1 row with all five org dimension names resolved via JOIN.
-- This confirms:
--   (a) org FK columns are set on catalog.assets
--   (b) JOINs to org.* tables resolve correctly
--   (c) org reference data is consistent between submission and catalog
-- =============================================================================

\echo ''
\echo '=== VALIDATION 6: Org dimensions join correctly on catalog.assets ==='

SELECT
    ca.name                                       AS asset_name,
    co.name                                       AS country_name,
    co.iso_alpha2                                 AS country_code,
    co.region                                     AS country_region,
    op.name                                       AS opco_name,
    fg.name                                       AS function_group_name,
    isec.name                                     AS industry_sector_name,
    so.name                                       AS service_offering_name,
    -- Confirm org FKs are consistent between submission and catalog
    (s.primary_country_id = ca.primary_country_id)  AS country_fk_matches,
    (s.opco_id = ca.opco_id)                        AS opco_fk_matches,
    (s.function_group_id = ca.function_group_id)    AS function_group_fk_matches,
    (s.industry_sector_id = ca.industry_sector_id)  AS industry_sector_fk_matches,
    (s.service_offering_id = ca.service_offering_id) AS service_offering_fk_matches
FROM catalog.assets                  ca
JOIN governance.asset_submissions    s    ON s.id    = ca.approved_submission_id
JOIN org.countries                   co   ON co.id   = ca.primary_country_id
JOIN org.opcos                       op   ON op.id   = ca.opco_id
JOIN org.function_groups             fg   ON fg.id   = ca.function_group_id
JOIN org.industry_sectors            isec ON isec.id = ca.industry_sector_id
JOIN org.service_offerings           so   ON so.id   = ca.service_offering_id
WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042';


-- =============================================================================
-- VALIDATION 7 — Status separation: governance_status ≠ publication_status
--
-- Expected: 1 row demonstrating the two status axes are independent columns
-- on different tables with different value sets.
--
--   governance_status = 'approved'   (governance.asset_submissions)
--   publication_status = 'ga'        (catalog.assets)
--   statuses_are_independent = true  (different values, different tables)
--
-- This is the core architecture principle: governance lifecycle and catalog
-- publication lifecycle are distinct and do not share an enum.
-- =============================================================================

\echo ''
\echo '=== VALIDATION 7: Status axes are independent (governance vs catalog) ==='

SELECT
    s.id                                              AS submission_id,
    s.governance_status,
    'governance.asset_submissions'                    AS governance_status_table,
    ca.id                                             AS catalog_asset_id,
    ca.publication_status,
    'catalog.assets'                                  AS publication_status_table,
    -- These can differ: a submission can be 'approved' while catalog is 'preview' or 'ga'
    s.governance_status <> ca.publication_status      AS statuses_are_independent,
    -- Prove they come from different tables with different value domains
    s.governance_status IN ('pending','in_review','approved','rejected','withdrawn') AS governance_uses_own_domain,
    ca.publication_status IN ('preview','ga','deprecated','retired')                 AS catalog_uses_own_domain
FROM governance.asset_submissions  s
JOIN catalog.assets                ca ON ca.approved_submission_id = s.id
WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042';


-- =============================================================================
-- VALIDATION 8 — Asset versions and source refs
--
-- Expected:
--   Version query: 1 row — v2.0.0, is_current = true
--   Source refs query: 2 rows — forge_asset_id (primary=true), github_repo (primary=false)
-- =============================================================================

\echo ''
\echo '=== VALIDATION 8a: Asset version history ==='

SELECT
    av.version,
    av.is_current,
    av.released_at,
    av.change_summary IS NOT NULL     AS has_change_summary,
    av.submission_id IS NOT NULL      AS linked_to_submission
FROM catalog.asset_versions  av
JOIN catalog.assets          ca ON ca.id = av.asset_id
WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
ORDER BY av.released_at DESC;

\echo ''
\echo '=== VALIDATION 8b: Asset source references ==='

SELECT
    asr.ref_type,
    asr.ref_value,
    asr.label,
    asr.is_primary,
    asr.href IS NOT NULL              AS has_href
FROM catalog.asset_source_refs  asr
JOIN catalog.assets             ca  ON ca.id = asr.asset_id
WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
ORDER BY asr.is_primary DESC;


-- =============================================================================
-- VALIDATION 9 — Audit trail entries exist for this asset's lifecycle
--
-- Expected: 3 rows showing the key events:
--   submitted → approved → promoted_to_ga
-- =============================================================================

\echo ''
\echo '=== VALIDATION 9: Audit trail lifecycle events ==='

SELECT
    at.action,
    at.entity_type,
    at.performed_at,
    at.performed_by IS NOT NULL                   AS has_performer,
    at.before_state IS NOT NULL                   AS has_before_state,
    at.after_state IS NOT NULL                    AS has_after_state,
    at.after_state->>'governance_status'          AS after_governance_status,
    at.after_state->>'publication_status'         AS after_publication_status
FROM governance.audit_trail  at
WHERE at.metadata->>'smoke_test' = 'true'
ORDER BY at.performed_at;


-- =============================================================================
-- VALIDATION 10 — Full pipeline view: one query showing the complete flow
--
-- Expected: 1 row aggregating the entire submission → catalog chain.
-- This is the query a governance dashboard might run.
-- =============================================================================

\echo ''
\echo '=== VALIDATION 10: Complete pipeline summary (submission → review → catalog) ==='

SELECT
    -- Source
    pm.module_key                                           AS source_module,
    s.source_entity_type,
    s.source_entity_id,

    -- Governance
    s.id                                                    AS submission_id,
    s.governance_status,
    s.submitted_at,
    s.resolved_at,

    -- Review pipeline summary
    COUNT(DISTINCT sr.id)                                   AS total_stage_runs,
    COUNT(DISTINCT CASE WHEN sr.status = 'passed' THEN sr.id END) AS passed_stages,
    COUNT(DISTINCT rv.id)                                   AS total_reviews,

    -- Catalog
    ca.id                                                   AS catalog_asset_id,
    ca.name                                                 AS catalog_asset_name,
    ca.asset_kind,
    ca.publication_status,

    -- NFR summary
    ca.data_classification,
    ca.contains_pii,
    ca.business_criticality,
    ca.compliance_tags,

    -- Promotion
    COUNT(DISTINCT pp.id)                                   AS total_promotions,
    MAX(pp.to_status)                                       AS latest_promotion_target,

    -- Traceability
    ca.source_entity_id = s.source_entity_id                AS source_trace_intact,
    ca.publication_status IN ('ga', 'preview')               AS asset_is_discoverable

FROM governance.asset_submissions        s
JOIN platform.modules                    pm   ON pm.id   = s.source_module_id
LEFT JOIN governance.submission_stage_runs sr ON sr.submission_id = s.id
LEFT JOIN governance.submission_reviews    rv ON rv.submission_id = s.id
LEFT JOIN governance.publication_promotions pp ON pp.submission_id = s.id
LEFT JOIN catalog.assets                   ca  ON ca.approved_submission_id = s.id

WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
GROUP BY
    pm.module_key,
    s.id, s.source_entity_type, s.source_entity_id,
    s.governance_status, s.submitted_at, s.resolved_at,
    ca.id, ca.name, ca.asset_kind, ca.publication_status,
    ca.data_classification, ca.contains_pii, ca.business_criticality,
    ca.compliance_tags, ca.source_entity_id;


-- =============================================================================
-- SUMMARY CHECK — Quick pass/fail boolean assertions
--
-- Expected: every assertion column = true
-- If any column is false, that step of the pipeline did not work correctly.
-- =============================================================================

\echo ''
\echo '=== SUMMARY: Pass/fail assertions — every column must be TRUE ==='

SELECT
    -- Submission assertions
    (SELECT COUNT(*) = 1
     FROM governance.asset_submissions
     WHERE source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
       AND governance_status = 'approved'
    )                                                         AS submission_approved,

    -- Stage run assertions
    (SELECT COUNT(*) = 1
     FROM governance.submission_stage_runs sr
     JOIN governance.asset_submissions     s ON s.id = sr.submission_id
     WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
       AND sr.status = 'passed'
    )                                                         AS stage_run_passed,

    -- Review assertion
    (SELECT COUNT(*) = 1
     FROM governance.submission_reviews rv
     JOIN governance.asset_submissions  s ON s.id = rv.submission_id
     WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
       AND rv.decision = 'approve'
    )                                                         AS review_approved,

    -- Promotion assertions
    (SELECT COUNT(*) = 2
     FROM governance.publication_promotions pp
     JOIN governance.asset_submissions      s ON s.id = pp.submission_id
     WHERE s.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
    )                                                         AS two_promotions_exist,

    -- Catalog assertions
    (SELECT COUNT(*) = 1
     FROM catalog.assets
     WHERE source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
       AND publication_status = 'ga'
    )                                                         AS catalog_asset_is_ga,

    -- Source traceability assertion
    (SELECT s.source_entity_id = ca.source_entity_id
     FROM catalog.assets ca
     JOIN governance.asset_submissions s ON s.id = ca.approved_submission_id
     WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
    )                                                         AS source_trace_preserved,

    -- Org dimension assertion (all five FKs set and resolvable)
    (SELECT COUNT(*) = 1
     FROM catalog.assets ca
     JOIN org.countries         co   ON co.id   = ca.primary_country_id
     JOIN org.opcos             op   ON op.id   = ca.opco_id
     JOIN org.function_groups   fg   ON fg.id   = ca.function_group_id
     JOIN org.industry_sectors  isec ON isec.id = ca.industry_sector_id
     JOIN org.service_offerings so   ON so.id   = ca.service_offering_id
     WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
    )                                                         AS all_org_fks_resolve,

    -- Status separation assertion
    (SELECT s.governance_status <> ca.publication_status
     FROM catalog.assets ca
     JOIN governance.asset_submissions s ON s.id = ca.approved_submission_id
     WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
    )                                                         AS statuses_are_separate,

    -- Version assertion
    (SELECT COUNT(*) = 1
     FROM catalog.asset_versions av
     JOIN catalog.assets          ca ON ca.id = av.asset_id
     WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
       AND av.is_current = TRUE
    )                                                         AS current_version_exists,

    -- Source ref assertion (primary ref set)
    (SELECT COUNT(*) >= 1
     FROM catalog.asset_source_refs asr
     JOIN catalog.assets             ca ON ca.id = asr.asset_id
     WHERE ca.source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
       AND asr.is_primary = TRUE
    )                                                         AS primary_source_ref_exists,

    -- Audit trail assertion
    (SELECT COUNT(*) = 3
     FROM governance.audit_trail
     WHERE metadata->>'smoke_test' = 'true'
    )                                                         AS audit_trail_has_entries,

    -- updated_at trigger assertion (UPDATE changed updated_at)
    (SELECT updated_at > created_at
     FROM governance.asset_submissions
     WHERE source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
    )                                                         AS updated_at_trigger_fired,

    -- Discoverability assertion
    (SELECT publication_status IN ('ga', 'preview')
     FROM catalog.assets
     WHERE source_entity_id = 'cafecafe-0000-4000-8000-000000000042'
    )                                                         AS asset_is_discoverable;
