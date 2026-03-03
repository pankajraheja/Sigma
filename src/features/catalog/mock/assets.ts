// ---------------------------------------------------------------------------
// Catalog mock data — 12 representative enterprise assets.
//
// Covers all filter dimensions: kind, publication status, country, opco,
// function group, industry sector, service offering, NFRs, PII, etc.
// Used only until backend integration ships.
// ---------------------------------------------------------------------------

import type { CatalogAsset } from '../types'

export const MOCK_CATALOG_ASSETS: CatalogAsset[] = [

  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    id:           'cust-360-ds',
    name:         'Customer 360 Dataset',
    owner:        'Data Architecture',
    domain:       'Governance',
    shortSummary: 'Unified golden record for every customer entity — merges CRM, support, billing, and usage signals.',
    description:
      'The Customer 360 Dataset provides a single governed view of every customer entity by merging CRM, support ticketing, billing, and usage telemetry. Updated nightly via the enterprise ingestion pipeline. All consuming teams must complete the Data Governance onboarding module before accessing PII fields.',
    kind:              'Dataset',
    publicationStatus: 'approved',
    country:           ['US', 'UK', 'AU', 'SG'],
    opco:              ['OpCo Americas', 'OpCo EMEA', 'OpCo APAC'],
    functionGroup:     'Technology',
    industrySector:    'Banking',
    serviceOffering:   'Data & Analytics',
    tags:              ['customer', 'golden-record', 'crm', 'pii', 'nightly-refresh'],
    nfrs: {
      dataClassification: 'Confidential',
      hostingType:        'Cloud',
      containsPII:        true,
      sla:                '99.9%',
      retentionPolicy:    '7 years',
      complianceTags:     ['GDPR', 'CCPA', 'SOX'],
    },
    sourceModule:    'catalog',
    linkedResources: [
      { label: 'Data Dictionary',   href: '#', kind: 'documentation' },
      { label: 'Lineage Graph',     href: '#', kind: 'lineage' },
      { label: 'Runbook',           href: '#', kind: 'runbook' },
      { label: 'GitHub Source',     href: '#', kind: 'github' },
    ],
    currentVersion: '3.1.2',
    versions: [
      { version: '3.1.2', releasedAt: '2026-02-15', changedBy: 'Data Architecture', summary: 'Added SG market segment and address normalisation fields.' },
      { version: '3.0.0', releasedAt: '2025-11-01', changedBy: 'Data Architecture', summary: 'Unified billing model — merged legacy v2 billing schema.' },
      { version: '2.4.1', releasedAt: '2025-07-10', changedBy: 'CRM Team',          summary: 'Aligned with CRM V2 schema; added support ticket join key.' },
    ],
    auditLog: [
      { action: 'Status changed: draft → approved',    performedBy: 'J. Rodriguez',           at: '2025-11-05' },
      { action: 'Certification renewed (2026 cycle)',   performedBy: 'Data Governance Office', at: '2026-01-10' },
      { action: 'Version 3.1.2 published',              performedBy: 'Data Architecture',      at: '2026-02-15' },
    ],
    certification: {
      certifiedBy: 'Data Governance Office',
      certifiedAt: '2026-01-10',
      validUntil:  '2027-01-10',
      standard:    'Enterprise Metadata Standard v3.0',
      score:       97,
    },
    createdAt:   '2023-05-01',
    updatedAt:   '2026-02-15',
    publishedAt: '2025-11-05',
    usageCount:  412,
    featured:    true,
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    id:           'prod-rec-model',
    name:         'Product Recommendation Model',
    owner:        'ML Platform',
    domain:       'AI & Automation',
    shortSummary: 'Collaborative-filtering model serving personalised product recommendations at <30 ms p99.',
    description:
      'Trained on 24 months of behavioural sequences across web, mobile, and in-branch channels. Serves real-time and batch recommendations. Integrated with the A/B testing framework. Governance-approved for use in regulated markets with mandatory model card review.',
    kind:              'Model',
    publicationStatus: 'approved',
    country:           ['US', 'AU', 'IN'],
    opco:              ['OpCo Americas', 'OpCo APAC'],
    functionGroup:     'Technology',
    industrySector:    'Banking',
    serviceOffering:   'AI Services',
    tags:              ['recommendations', 'collaborative-filtering', 'real-time', 'personalisation'],
    nfrs: {
      dataClassification: 'Internal',
      hostingType:        'Cloud',
      containsPII:        false,
      sla:                '99.95%',
      complianceTags:     ['SR11-7'],
    },
    sourceModule:    'forge',
    sourceRef:       'forge-pipeline-prod-rec-v3',
    linkedResources: [
      { label: 'Model Card',          href: '#', kind: 'documentation' },
      { label: 'Training Pipeline',   href: '#', kind: 'source' },
      { label: 'Evaluation Report',   href: '#', kind: 'documentation' },
    ],
    currentVersion: '3.0.0',
    versions: [
      { version: '3.0.0', releasedAt: '2026-02-24', changedBy: 'ML Platform', summary: 'Upgraded to transformer architecture; +8% NDCG improvement.' },
      { version: '2.2.1', releasedAt: '2025-09-14', changedBy: 'ML Platform', summary: 'Hot-fix for cold-start user edge case.' },
    ],
    auditLog: [
      { action: 'Status changed: in-review → approved', performedBy: 'Model Risk Committee', at: '2025-08-20' },
      { action: 'Version 3.0.0 published',               performedBy: 'ML Platform',          at: '2026-02-24' },
    ],
    certification: {
      certifiedBy: 'Model Risk Committee',
      certifiedAt: '2025-08-20',
      validUntil:  '2026-08-20',
      standard:    'Model Risk Management Standard v2.1',
      score:       92,
    },
    createdAt:   '2023-11-01',
    updatedAt:   '2026-02-24',
    publishedAt: '2025-08-20',
    usageCount:  1247,
    featured:    true,
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    id:           'fraud-detect-api',
    name:         'Fraud Detection API',
    owner:        'Fraud Intelligence',
    domain:       'Security',
    shortSummary: 'Real-time transaction scoring API — evaluates fraud probability using 40+ behavioural signals.',
    description:
      'REST API endpoint that scores inbound payment and account events for fraud probability in real-time. Uses ensemble ML backed by gradient-boosted trees and neural networks. Returns a score (0–1) with a human-readable risk tier. Rate-limited per consuming team. SLA: 30 ms p99 for 99.9% of requests.',
    kind:              'API',
    publicationStatus: 'approved',
    country:           ['US', 'UK', 'SG', 'DE'],
    opco:              ['OpCo Americas', 'OpCo EMEA'],
    functionGroup:     'Risk',
    industrySector:    'Banking',
    serviceOffering:   'Risk & Compliance',
    tags:              ['fraud', 'real-time', 'scoring', 'ml-backed', 'payments'],
    nfrs: {
      dataClassification: 'Confidential',
      hostingType:        'Cloud',
      containsPII:        true,
      sla:                '99.99%',
      retentionPolicy:    '5 years',
      complianceTags:     ['PCI-DSS', 'SOX', 'GDPR'],
    },
    sourceModule:    'app-builder',
    linkedResources: [
      { label: 'API Reference',    href: '#', kind: 'documentation' },
      { label: 'OpenAPI Schema',   href: '#', kind: 'source' },
      { label: 'Runbook',          href: '#', kind: 'runbook' },
      { label: 'Jira Epic',        href: '#', kind: 'jira' },
    ],
    currentVersion: '2.4.0',
    versions: [
      { version: '2.4.0', releasedAt: '2026-02-25', changedBy: 'Fraud Intelligence', summary: 'Added device fingerprint signal; improved score precision by 6%.' },
      { version: '2.3.1', releasedAt: '2025-12-05', changedBy: 'Fraud Intelligence', summary: 'Performance patch — reduced p99 latency from 45 ms to 28 ms.' },
      { version: '2.0.0', releasedAt: '2025-06-01', changedBy: 'Fraud Intelligence', summary: 'Major version: migrated to ensemble model and REST v2 contract.' },
    ],
    auditLog: [
      { action: 'Status changed: draft → approved',   performedBy: 'Security Review Board', at: '2025-06-15' },
      { action: 'PCI-DSS scope confirmed',             performedBy: 'Compliance Team',       at: '2025-07-01' },
      { action: 'Version 2.4.0 published',             performedBy: 'Fraud Intelligence',    at: '2026-02-25' },
    ],
    certification: {
      certifiedBy: 'Security Review Board',
      certifiedAt: '2025-06-15',
      validUntil:  '2026-06-15',
      standard:    'Enterprise API Security Standard v1.4',
      score:       99,
    },
    createdAt:   '2022-08-10',
    updatedAt:   '2026-02-25',
    publishedAt: '2025-06-15',
    usageCount:  931,
    featured:    true,
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    id:           'revenue-dash',
    name:         'Revenue Analytics Dashboard',
    owner:        'Finance Analytics',
    domain:       'Development',
    shortSummary: 'Board-level ARR, MRR, and churn waterfall charts refreshed daily from the finance data warehouse.',
    description:
      'Executive-facing revenue dashboard consolidating ARR, MRR, NRR, gross churn, and segment waterfall charts. Data refreshed nightly from the finance DWH. Distributed to the board, CFO office, and senior finance leadership. Access is role-restricted to Finance Admin and above.',
    kind:              'Dashboard',
    publicationStatus: 'approved',
    country:           ['US', 'UK', 'CA'],
    opco:              ['OpCo Americas', 'OpCo EMEA'],
    functionGroup:     'Finance',
    industrySector:    'Banking',
    serviceOffering:   'Data & Analytics',
    tags:              ['revenue', 'arr', 'mrr', 'finance', 'board-level', 'nightly-refresh'],
    nfrs: {
      dataClassification: 'Restricted',
      hostingType:        'Cloud',
      containsPII:        false,
      retentionPolicy:    '10 years',
      complianceTags:     ['SOX'],
    },
    sourceModule:    'prototype-builder',
    linkedResources: [
      { label: 'Finance DWH Schema', href: '#', kind: 'lineage' },
      { label: 'Board Pack Template', href: '#', kind: 'documentation' },
    ],
    currentVersion: '1.4.0',
    versions: [
      { version: '1.4.0', releasedAt: '2026-02-27', changedBy: 'Finance Analytics', summary: 'Added segment NRR waterfall and cohort retention charts.' },
      { version: '1.3.0', releasedAt: '2025-10-01', changedBy: 'Finance Analytics', summary: 'Migrated from legacy BI platform to new cloud stack.' },
    ],
    auditLog: [
      { action: 'Status changed: submitted → approved', performedBy: 'CFO Office',      at: '2025-10-10' },
      { action: 'Version 1.4.0 published',              performedBy: 'Finance Analytics', at: '2026-02-27' },
    ],
    certification: {
      certifiedBy: 'CFO Office',
      certifiedAt: '2025-10-10',
      validUntil:  '2026-10-10',
      standard:    'Financial Reporting Standard v2.0',
      score:       95,
    },
    createdAt:   '2024-01-15',
    updatedAt:   '2026-02-27',
    publishedAt: '2025-10-10',
    usageCount:  556,
    featured:    false,
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    id:           'employee-dir',
    name:         'Employee Directory Dataset',
    owner:        'HR Data Services',
    domain:       'Governance',
    shortSummary: 'Authoritative employee roster with org hierarchy, role bindings, and RBAC group memberships.',
    description:
      'Canonical employee dataset covering org hierarchy, cost-centre codes, role classifications, RBAC group assignments, and employment status. Feeds IAM provisioning, access reviews, and workforce analytics. PII-classified — consumers require HR Data Steward approval.',
    kind:              'Dataset',
    publicationStatus: 'approved',
    country:           ['US', 'UK', 'AU', 'SG', 'IN', 'DE', 'CA', 'JP'],
    opco:              ['OpCo Americas', 'OpCo EMEA', 'OpCo APAC', 'OpCo ANZ', 'OpCo India'],
    functionGroup:     'HR',
    industrySector:    'Banking',
    serviceOffering:   'Digital Experience',
    tags:              ['hr', 'employees', 'org-hierarchy', 'pii', 'iam'],
    nfrs: {
      dataClassification: 'Confidential',
      hostingType:        'On-Premise',
      containsPII:        true,
      retentionPolicy:    'Active employment + 7 years',
      complianceTags:     ['GDPR', 'SOX'],
    },
    sourceModule:    'catalog',
    linkedResources: [
      { label: 'Data Dictionary', href: '#', kind: 'documentation' },
      { label: 'HR Access Policy', href: '#', kind: 'runbook' },
    ],
    currentVersion: '2.0.1',
    versions: [
      { version: '2.0.1', releasedAt: '2026-02-10', changedBy: 'HR Data Services', summary: 'Added India and JP entities following global expansion.' },
      { version: '2.0.0', releasedAt: '2025-09-01', changedBy: 'HR Data Services', summary: 'Schema revamp — normalised role taxonomy alignment.' },
    ],
    auditLog: [
      { action: 'Status changed: draft → approved',  performedBy: 'HR Data Steward',  at: '2025-09-05' },
      { action: 'Version 2.0.1 published',            performedBy: 'HR Data Services', at: '2026-02-10' },
    ],
    certification: {
      certifiedBy: 'HR Data Steward',
      certifiedAt: '2025-09-05',
      validUntil:  '2026-09-05',
      standard:    'Enterprise Metadata Standard v3.0',
      score:       93,
    },
    createdAt:   '2021-03-01',
    updatedAt:   '2026-02-10',
    publishedAt: '2025-09-05',
    usageCount:  178,
    featured:    false,
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    id:           'supply-chain-pipeline',
    name:         'Supply Chain Data Pipeline',
    owner:        'Operations Data',
    domain:       'Integration',
    shortSummary: 'End-to-end pipeline ingesting ERP, WMS, and 3PL events into the data lake.',
    description:
      'Managed Apache Kafka → Spark Structured Streaming pipeline ingesting inventory positions, fulfilment events, and logistics signals from SAP ERP, Manhattan WMS, and three 3PL APIs. Normalises and writes to the enterprise data lake (Delta format) with row-level governance tags.',
    kind:              'Pipeline',
    publicationStatus: 'approved',
    country:           ['US', 'AU'],
    opco:              ['OpCo Americas', 'OpCo ANZ'],
    functionGroup:     'Operations',
    industrySector:    'Banking',
    serviceOffering:   'Data & Analytics',
    tags:              ['supply-chain', 'erp', 'kafka', 'streaming', 'data-lake'],
    nfrs: {
      dataClassification: 'Internal',
      hostingType:        'Hybrid',
      containsPII:        false,
      sla:                '99.5%',
      complianceTags:     [],
    },
    sourceModule:    'forge',
    linkedResources: [
      { label: 'Architecture Diagram', href: '#', kind: 'documentation' },
      { label: 'Runbook',              href: '#', kind: 'runbook' },
      { label: 'GitHub Repo',          href: '#', kind: 'github' },
    ],
    currentVersion: '1.2.0',
    versions: [
      { version: '1.2.0', releasedAt: '2026-02-26', changedBy: 'Operations Data', summary: 'Added third 3PL connector; improved fault tolerance.' },
      { version: '1.0.0', releasedAt: '2025-05-15', changedBy: 'Operations Data', summary: 'Initial production release.' },
    ],
    auditLog: [
      { action: 'Status changed: submitted → approved', performedBy: 'Platform Engineering', at: '2025-05-20' },
      { action: 'Version 1.2.0 published',               performedBy: 'Operations Data',      at: '2026-02-26' },
    ],
    certification: {
      certifiedBy: 'Platform Engineering',
      certifiedAt: '2025-05-20',
      validUntil:  '2026-05-20',
      standard:    'Integration Platform Standard v1.0',
      score:       88,
    },
    createdAt:   '2024-11-01',
    updatedAt:   '2026-02-26',
    publishedAt: '2025-05-20',
    usageCount:  318,
    featured:    false,
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    id:           'nlp-classifier',
    name:         'NLP Text Classifier',
    owner:        'AI Research',
    domain:       'AI & Automation',
    shortSummary: 'Fine-tuned transformer for multi-label support ticket routing and content classification.',
    description:
      'Multi-label text classification model fine-tuned on 2M internal support tickets and knowledge base articles. Handles ticket routing, content moderation flags, and internal knowledge tagging. Currently under model risk review for regulated-market deployment.',
    kind:              'Model',
    publicationStatus: 'in-review',
    country:           ['US'],
    opco:              ['OpCo Americas'],
    functionGroup:     'Technology',
    industrySector:    'Banking',
    serviceOffering:   'AI Services',
    tags:              ['nlp', 'classification', 'transformer', 'support-routing'],
    nfrs: {
      dataClassification: 'Internal',
      hostingType:        'Cloud',
      containsPII:        false,
      complianceTags:     ['SR11-7'],
    },
    sourceModule:    'forge',
    linkedResources: [
      { label: 'Model Card (Draft)', href: '#', kind: 'documentation' },
      { label: 'GitHub Repo',        href: '#', kind: 'github' },
    ],
    currentVersion: '0.9.2',
    versions: [
      { version: '0.9.2', releasedAt: '2026-02-05', changedBy: 'AI Research', summary: 'Pre-release — under model risk review.' },
    ],
    auditLog: [
      { action: 'Status changed: submitted → in-review', performedBy: 'Model Risk Committee', at: '2026-01-20' },
    ],
    createdAt:  '2025-10-15',
    updatedAt:  '2026-02-05',
    usageCount: 8,
    featured:   false,
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    id:           'tax-report-template',
    name:         'Enterprise Tax Reporting Template',
    owner:        'Finance & Legal',
    domain:       'Development',
    shortSummary: 'Approved scaffolding template for multi-jurisdiction corporate tax reporting packages.',
    description:
      'Governed template for assembling quarterly and annual corporate tax reporting packages across US, UK, AU, SG, DE, and CA jurisdictions. Pre-wired with jurisdiction-specific data source bindings, sign-off workflow stubs, and XBRL output formatting.',
    kind:              'Template',
    publicationStatus: 'approved',
    country:           ['US', 'UK', 'AU', 'SG', 'DE', 'CA'],
    opco:              ['OpCo Americas', 'OpCo EMEA', 'OpCo ANZ'],
    functionGroup:     'Legal',
    industrySector:    'Banking',
    serviceOffering:   'Risk & Compliance',
    tags:              ['tax', 'reporting', 'template', 'multi-jurisdiction', 'xbrl'],
    nfrs: {
      dataClassification: 'Restricted',
      hostingType:        'On-Premise',
      containsPII:        false,
      retentionPolicy:    '10 years',
      complianceTags:     ['SOX', 'CRD-IV'],
    },
    sourceModule:    'prototype-builder',
    linkedResources: [
      { label: 'Template Usage Guide', href: '#', kind: 'documentation' },
      { label: 'XBRL Schema Reference', href: '#', kind: 'source' },
    ],
    currentVersion: '2.1.0',
    versions: [
      { version: '2.1.0', releasedAt: '2026-01-15', changedBy: 'Finance & Legal', summary: 'Added CA and SG jurisdiction packs.' },
      { version: '2.0.0', releasedAt: '2025-03-01', changedBy: 'Finance & Legal', summary: 'Migrated to new scaffold standard; XBRL v2.1 support.' },
    ],
    auditLog: [
      { action: 'Status changed: submitted → approved', performedBy: 'Legal Governance Board', at: '2025-03-10' },
      { action: 'Version 2.1.0 published',               performedBy: 'Finance & Legal',        at: '2026-01-15' },
    ],
    certification: {
      certifiedBy: 'Legal Governance Board',
      certifiedAt: '2025-03-10',
      validUntil:  '2026-03-10',
      standard:    'Enterprise Templates Standard v1.0',
      score:       100,
    },
    createdAt:   '2023-01-01',
    updatedAt:   '2026-01-15',
    publishedAt: '2025-03-10',
    usageCount:  203,
    featured:    false,
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    id:           'partner-connector',
    name:         'Partner Data Connector',
    owner:        'Partner Engineering',
    domain:       'Integration',
    shortSummary: 'Governed inbound connector for strategic partner data — handles schema validation and PII redaction at ingestion.',
    description:
      'Pre-built connector for partner data exchange implementing partner-specific schema validation, automated PII field redaction, and lineage tagging on all ingested records. Submitted for security review pending final penetration test sign-off.',
    kind:              'Connector',
    publicationStatus: 'submitted',
    country:           ['US', 'UK'],
    opco:              ['OpCo Americas', 'OpCo EMEA'],
    functionGroup:     'Technology',
    industrySector:    'Banking',
    serviceOffering:   'Digital Experience',
    tags:              ['partner', 'inbound', 'pii-redaction', 'lineage', 'schema-validation'],
    nfrs: {
      dataClassification: 'Confidential',
      hostingType:        'Cloud',
      containsPII:        true,
      complianceTags:     ['GDPR'],
    },
    sourceModule:    'app-builder',
    linkedResources: [
      { label: 'Security Review Ticket', href: '#', kind: 'jira' },
      { label: 'GitHub Repo',             href: '#', kind: 'github' },
    ],
    currentVersion: '0.4.0',
    versions: [
      { version: '0.4.0', releasedAt: '2026-02-08', changedBy: 'Partner Engineering', summary: 'Submitted for security review; PII redaction confirmed.' },
    ],
    auditLog: [
      { action: 'Status changed: draft → submitted', performedBy: 'Partner Engineering', at: '2026-02-08' },
    ],
    createdAt:  '2025-12-01',
    updatedAt:  '2026-02-08',
    usageCount: 0,
    featured:   false,
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    id:           'claims-skill',
    name:         'Claims Processing Skill',
    owner:        'Insurance AI',
    domain:       'AI & Automation',
    shortSummary: 'Reusable FORGE skill for automated first-notice-of-loss triage and claims routing.',
    description:
      'Agent skill registered in FORGE for automated FNOL (First Notice of Loss) classification and claims routing. Uses NLP to extract loss event details, assigns a damage severity tier, and routes to the appropriate claims handler queue. Under model risk review for insurance market deployment.',
    kind:              'Skill',
    publicationStatus: 'in-review',
    country:           ['US', 'UK', 'AU'],
    opco:              ['OpCo Americas', 'OpCo EMEA', 'OpCo ANZ'],
    functionGroup:     'Operations',
    industrySector:    'Insurance',
    serviceOffering:   'AI Services',
    tags:              ['insurance', 'claims', 'fnol', 'nlp', 'triage'],
    nfrs: {
      dataClassification: 'Confidential',
      hostingType:        'Cloud',
      containsPII:        true,
      sla:                '99.5%',
      complianceTags:     ['GDPR', 'IAIS'],
    },
    sourceModule:    'forge',
    linkedResources: [
      { label: 'Skill Spec',       href: '#', kind: 'documentation' },
      { label: 'FORGE Pipeline',   href: '#', kind: 'source' },
    ],
    currentVersion: '0.2.1',
    versions: [
      { version: '0.2.1', releasedAt: '2026-01-28', changedBy: 'Insurance AI', summary: 'Improved FNOL entity extraction; under review.' },
    ],
    auditLog: [
      { action: 'Status changed: submitted → in-review', performedBy: 'Model Risk Committee', at: '2026-02-01' },
    ],
    createdAt:  '2025-11-01',
    updatedAt:  '2026-01-28',
    usageCount: 5,
    featured:   false,
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    id:           'risk-exposure-dash',
    name:         'Risk Exposure Dashboard',
    owner:        'Quantitative Risk',
    domain:       'Security',
    shortSummary: 'Live counterparty and market risk exposure visualisation for the risk management desk.',
    description:
      'Real-time dashboard showing counterparty credit exposure, market VaR, and limit utilisation across trading portfolios. Restricted to risk management desk and senior leadership. Feeds from the enterprise risk engine updated every 15 minutes during trading hours.',
    kind:              'Dashboard',
    publicationStatus: 'approved',
    country:           ['US', 'UK', 'SG', 'DE'],
    opco:              ['OpCo Americas', 'OpCo EMEA'],
    functionGroup:     'Risk',
    industrySector:    'Capital Markets',
    serviceOffering:   'Risk & Compliance',
    tags:              ['risk', 'var', 'counterparty', 'market-risk', 'real-time'],
    nfrs: {
      dataClassification: 'Restricted',
      hostingType:        'On-Premise',
      containsPII:        false,
      sla:                '99.9%',
      complianceTags:     ['FRTB', 'Basel-III'],
    },
    sourceModule:    'prototype-builder',
    linkedResources: [
      { label: 'Risk Engine Docs', href: '#', kind: 'documentation' },
      { label: 'Runbook',          href: '#', kind: 'runbook' },
    ],
    currentVersion: '4.0.0',
    versions: [
      { version: '4.0.0', releasedAt: '2026-02-22', changedBy: 'Quantitative Risk', summary: 'FRTB-SA compliance update; added intraday PnL attribution.' },
      { version: '3.5.0', releasedAt: '2025-08-01', changedBy: 'Quantitative Risk', summary: 'Added counterparty netting set view.' },
    ],
    auditLog: [
      { action: 'Status changed: submitted → approved', performedBy: 'Chief Risk Officer', at: '2025-01-15' },
      { action: 'FRTB scope confirmed',                  performedBy: 'Compliance Team',    at: '2025-07-01' },
      { action: 'Version 4.0.0 published',               performedBy: 'Quantitative Risk',  at: '2026-02-22' },
    ],
    certification: {
      certifiedBy: 'Chief Risk Officer',
      certifiedAt: '2025-01-15',
      validUntil:  '2026-01-15',
      standard:    'Risk Data Standards v2.0',
      score:       96,
    },
    createdAt:   '2022-01-10',
    updatedAt:   '2026-02-22',
    publishedAt: '2025-01-15',
    usageCount:  147,
    featured:    false,
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    id:           'mktg-attr-report',
    name:         'Marketing Attribution Report',
    owner:        'Growth Analytics',
    domain:       'Development',
    shortSummary: 'Multi-touch attribution report comparing first-touch, last-touch, and data-driven models across paid and organic channels.',
    description:
      'Quarterly and on-demand marketing attribution report comparing first-touch, last-touch, and Google data-driven attribution models across all paid search, display, social, and organic channels. Used by the CMO office and growth team for budget allocation decisions.',
    kind:              'Report',
    publicationStatus: 'approved',
    country:           ['US', 'UK', 'CA'],
    opco:              ['OpCo Americas', 'OpCo EMEA'],
    functionGroup:     'Marketing',
    industrySector:    'Banking',
    serviceOffering:   'Digital Experience',
    tags:              ['marketing', 'attribution', 'multi-touch', 'paid-channels', 'growth'],
    nfrs: {
      dataClassification: 'Internal',
      hostingType:        'Cloud',
      containsPII:        false,
      complianceTags:     [],
    },
    sourceModule:    'prototype-builder',
    linkedResources: [
      { label: 'Report Methodology', href: '#', kind: 'documentation' },
      { label: 'Data Source Lineage', href: '#', kind: 'lineage' },
    ],
    currentVersion: '1.1.0',
    versions: [
      { version: '1.1.0', releasedAt: '2026-02-18', changedBy: 'Growth Analytics', summary: 'Added data-driven attribution model comparison.' },
    ],
    auditLog: [
      { action: 'Status changed: submitted → approved', performedBy: 'CMO Office',       at: '2025-07-15' },
      { action: 'Version 1.1.0 published',              performedBy: 'Growth Analytics', at: '2026-02-18' },
    ],
    certification: {
      certifiedBy: 'CMO Office',
      certifiedAt: '2025-07-15',
      validUntil:  '2026-07-15',
      standard:    'Enterprise Metadata Standard v3.0',
      score:       89,
    },
    createdAt:   '2024-04-01',
    updatedAt:   '2026-02-18',
    publishedAt: '2025-07-15',
    usageCount:  203,
    featured:    false,
  },
]

// ── Derived lookups ──────────────────────────────────────────────────────────

export function getAssetById(id: string): CatalogAsset | undefined {
  return MOCK_CATALOG_ASSETS.find((a) => a.id === id)
}

export function getRelatedAssets(asset: CatalogAsset, limit = 3): CatalogAsset[] {
  return MOCK_CATALOG_ASSETS
    .filter((a) => a.id !== asset.id && a.domain === asset.domain)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}

export function getFeaturedAssets(): CatalogAsset[] {
  return MOCK_CATALOG_ASSETS.filter((a) => a.featured)
}

export function getRecentAssets(limit = 6): CatalogAsset[] {
  return [...MOCK_CATALOG_ASSETS]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
}

// ── Filter dimension value lists (for building filter panels) ────────────────

export const ALL_KINDS = [
  'Dataset', 'API', 'Report', 'Model', 'Dashboard', 'Pipeline', 'Template', 'Skill', 'Connector',
] as const

export const ALL_PUBLICATION_STATUSES = [
  'approved', 'in-review', 'submitted', 'draft', 'deprecated', 'archived',
] as const

export const ALL_COUNTRIES = [...new Set(MOCK_CATALOG_ASSETS.flatMap((a) => a.country))].sort()

export const ALL_OPCOS = [...new Set(MOCK_CATALOG_ASSETS.flatMap((a) => a.opco))].sort()

export const ALL_FUNCTION_GROUPS = [...new Set(MOCK_CATALOG_ASSETS.map((a) => a.functionGroup))].sort()

export const ALL_INDUSTRY_SECTORS = [...new Set(MOCK_CATALOG_ASSETS.map((a) => a.industrySector))].sort()

export const ALL_SERVICE_OFFERINGS = [...new Set(MOCK_CATALOG_ASSETS.map((a) => a.serviceOffering))].sort()

export const ALL_DATA_CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const

export const ALL_HOSTING_TYPES = ['Cloud', 'On-Premise', 'Hybrid', 'SaaS'] as const
