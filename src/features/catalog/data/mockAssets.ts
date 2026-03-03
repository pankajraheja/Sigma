// ---------------------------------------------------------------------------
// mockAssets.ts
//
// Static mock data for the Catalog feature. No backend required.
// Conforms to metadataRules: required fields (name, owner, domain),
// recommended fields (description, status, tags).
// ---------------------------------------------------------------------------

import type { AssetStatus } from '../../../standards/metadataRules'

export type AssetType =
  | 'table'
  | 'report'
  | 'api'
  | 'model'
  | 'dashboard'
  | 'pipeline'

export interface CatalogAsset {
  id:          string
  name:        string
  owner:       string        // required
  domain:      string        // required
  description: string        // recommended
  status:      AssetStatus   // recommended
  tags:        string[]      // recommended — lowercase, hyphens only
  type:        AssetType
  updatedAt:   string        // ISO date
  usageCount:  number
}

export const MOCK_ASSETS: CatalogAsset[] = [
  // ── Governance domain ───────────────────────────────────────────────────
  {
    id:          'cust-360',
    name:        'Customer 360 View',
    owner:       'Data Architecture',
    domain:      'Governance',
    description: 'Unified golden record for all customer entities — merges CRM, support, billing, and usage signals into a single governed profile.',
    status:      'active',
    tags:        ['customer', 'golden-record', 'crm', 'pii'],
    type:        'table',
    updatedAt:   '2026-02-28',
    usageCount:  412,
  },
  {
    id:          'ent-taxonomy',
    name:        'Enterprise Taxonomy Tree',
    owner:       'Data Governance Office',
    domain:      'Governance',
    description: 'Master classification hierarchy for all enterprise domains, capabilities, and sub-functions. Authoritative source for all taxonomy bindings.',
    status:      'active',
    tags:        ['taxonomy', 'classification', 'hierarchy', 'governance'],
    type:        'table',
    updatedAt:   '2026-02-20',
    usageCount:  289,
  },
  {
    id:          'employee-dir',
    name:        'Employee Directory',
    owner:       'HR Data Services',
    domain:      'Governance',
    description: 'Authoritative employee roster with org hierarchy, role bindings, cost-centre codes, and RBAC group memberships.',
    status:      'active',
    tags:        ['hr', 'employees', 'org-hierarchy', 'pii'],
    type:        'table',
    updatedAt:   '2026-02-15',
    usageCount:  178,
  },
  {
    id:          'compliance-log',
    name:        'Compliance Audit Log',
    owner:       'Risk & Compliance',
    domain:      'Governance',
    description: 'Immutable append-only log of all access and change events for SOX, GDPR, and internal audit obligations. Archived after 7-year retention.',
    status:      'archived',
    tags:        ['compliance', 'audit', 'sox', 'gdpr', 'immutable'],
    type:        'table',
    updatedAt:   '2025-12-01',
    usageCount:  34,
  },

  // ── Security domain ─────────────────────────────────────────────────────
  {
    id:          'fraud-api',
    name:        'Fraud Detection API',
    owner:       'Fraud Intelligence',
    domain:      'Security',
    description: 'Real-time transaction scoring API that evaluates fraud probability using ML signal fusion across 40+ behavioural and contextual features.',
    status:      'active',
    tags:        ['fraud', 'real-time', 'scoring', 'ml-backed'],
    type:        'api',
    updatedAt:   '2026-02-25',
    usageCount:  931,
  },
  {
    id:          'risk-model',
    name:        'Risk Scoring Model',
    owner:       'Quantitative Risk',
    domain:      'Security',
    description: 'Counterparty and operational risk scoring model. Combines financial exposure, credit history, and behavioural signals into a composite risk score.',
    status:      'draft',
    tags:        ['risk', 'credit', 'ml', 'counterparty'],
    type:        'model',
    updatedAt:   '2026-02-10',
    usageCount:  12,
  },

  // ── Development domain ───────────────────────────────────────────────────
  {
    id:          'revenue-dash',
    name:        'Revenue Analytics Dashboard',
    owner:       'Finance Analytics',
    domain:      'Development',
    description: 'Board-level revenue overview — ARR, MRR, churn rate, and segment waterfall charts updated daily from the finance data warehouse.',
    status:      'active',
    tags:        ['revenue', 'arr', 'mrr', 'finance', 'board-level'],
    type:        'dashboard',
    updatedAt:   '2026-02-27',
    usageCount:  556,
  },
  {
    id:          'mktg-attr',
    name:        'Marketing Attribution Report',
    owner:       'Growth Analytics',
    domain:      'Development',
    description: 'Multi-touch attribution model report comparing first-touch, last-touch, and data-driven attribution across all paid and organic channels.',
    status:      'active',
    tags:        ['marketing', 'attribution', 'multi-touch', 'paid-channels'],
    type:        'report',
    updatedAt:   '2026-02-18',
    usageCount:  203,
  },
  {
    id:          'devops-metrics',
    name:        'DevOps Metrics Dashboard',
    owner:       'Platform Engineering',
    domain:      'Development',
    description: 'DORA metrics dashboard — deployment frequency, lead time, MTTR, and change failure rate tracked across all engineering squads.',
    status:      'active',
    tags:        ['devops', 'dora', 'engineering', 'metrics'],
    type:        'dashboard',
    updatedAt:   '2026-02-22',
    usageCount:  147,
  },

  // ── Integration domain ───────────────────────────────────────────────────
  {
    id:          'supply-chain-pipeline',
    name:        'Supply Chain Pipeline',
    owner:       'Operations Data',
    domain:      'Integration',
    description: 'End-to-end supply chain data pipeline — ingests from ERP, WMS, and 3PL APIs, normalises inventory and fulfilment events into the data lake.',
    status:      'active',
    tags:        ['supply-chain', 'erp', 'wms', 'data-lake', 'pipeline'],
    type:        'pipeline',
    updatedAt:   '2026-02-26',
    usageCount:  318,
  },
  {
    id:          'inventory-sync',
    name:        'Inventory Sync Connector',
    owner:       'Integration Services',
    domain:      'Integration',
    description: 'Bi-directional connector syncing inventory positions between the ERP system and three 3PL warehouse management systems in near-real time.',
    status:      'active',
    tags:        ['inventory', 'connector', 'erp', '3pl', 'near-realtime'],
    type:        'api',
    updatedAt:   '2026-02-14',
    usageCount:  241,
  },
  {
    id:          'partner-feed',
    name:        'Partner Data Feed',
    owner:       'Partner Engineering',
    domain:      'Integration',
    description: 'Governed inbound data feed for strategic partner data exchange — handles schema validation, PII redaction, and lineage tagging at ingestion.',
    status:      'active',
    tags:        ['partner', 'inbound', 'pii-redaction', 'lineage'],
    type:        'api',
    updatedAt:   '2026-02-08',
    usageCount:  89,
  },

  // ── AI & Automation domain ───────────────────────────────────────────────
  {
    id:          'product-rec',
    name:        'Product Recommendation Model',
    owner:       'ML Platform',
    domain:      'AI & Automation',
    description: 'Collaborative-filtering recommendation model serving personalised product suggestions across web, mobile, and email channels at <30 ms p99.',
    status:      'active',
    tags:        ['recommendations', 'collaborative-filtering', 'real-time', 'personalisation'],
    type:        'model',
    updatedAt:   '2026-02-24',
    usageCount:  1247,
  },
  {
    id:          'churn-model',
    name:        'Churn Prediction Model',
    owner:       'Customer Science',
    domain:      'AI & Automation',
    description: 'Gradient-boosted churn propensity model trained on 24-month behavioural sequences. Deprecated in favour of the v2 deep-learning replacement.',
    status:      'deprecated',
    tags:        ['churn', 'propensity', 'gradient-boosting', 'deprecated'],
    type:        'model',
    updatedAt:   '2025-11-15',
    usageCount:  57,
  },
  {
    id:          'nlp-classifier',
    name:        'NLP Text Classifier',
    owner:       'AI Research',
    domain:      'AI & Automation',
    description: 'Fine-tuned transformer-based multi-label text classifier for support ticket routing, content moderation, and internal knowledge tagging.',
    status:      'draft',
    tags:        ['nlp', 'classification', 'transformer', 'support-routing'],
    type:        'model',
    updatedAt:   '2026-02-05',
    usageCount:  8,
  },
]

// ── Derived lookups ──────────────────────────────────────────────────────────

export const ALL_DOMAINS = [...new Set(MOCK_ASSETS.map(a => a.domain))].sort()

export const ALL_TYPES: AssetType[] = [
  'table', 'report', 'api', 'model', 'dashboard', 'pipeline',
]

export const ALL_STATUSES = ['active', 'draft', 'deprecated', 'archived'] as const

export function getAssetById(id: string): CatalogAsset | undefined {
  return MOCK_ASSETS.find(a => a.id === id)
}

export function getRelatedAssets(asset: CatalogAsset, limit = 3): CatalogAsset[] {
  return MOCK_ASSETS
    .filter(a => a.id !== asset.id && a.domain === asset.domain)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}
