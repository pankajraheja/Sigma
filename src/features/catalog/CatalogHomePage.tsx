import { Link } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  Database,
  Boxes,
  BarChart2,
  Sparkles,
} from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import { Card, CardBody, CardFooter } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  MOCK_ASSETS,
  ALL_DOMAINS,
  type CatalogAsset,
  type AssetType,
} from './data/mockAssets'
import type { AssetStatus } from '../../standards/metadataRules'

// ── Type pill config ─────────────────────────────────────────────────────────

const TYPE_LABEL: Record<AssetType, string> = {
  table:     'Table',
  report:    'Report',
  api:       'API',
  model:     'Model',
  dashboard: 'Dashboard',
  pipeline:  'Pipeline',
}

const TYPE_CLASSES: Record<AssetType, string> = {
  table:     'bg-surface-subtle text-ink-muted border-border',
  report:    'bg-primary-50 text-primary-600 border-primary-200',
  api:       'bg-info-bg text-info border-info/20',
  model:     'bg-warning-bg text-warning border-warning/20',
  dashboard: 'bg-success-bg text-success border-success/20',
  pipeline:  'bg-surface-subtle text-ink border-border-strong',
}

// ── Status pill config ───────────────────────────────────────────────────────

const STATUS_CLASSES: Record<AssetStatus, string> = {
  active:     'bg-success-bg border-success/20 text-success',
  draft:      'bg-warning-bg border-warning/20 text-warning',
  deprecated: 'bg-info-bg border-info/20 text-info',
  archived:   'bg-surface-subtle border-border text-ink-muted',
}

const STATUS_DOT: Record<AssetStatus, string> = {
  active:     'bg-success',
  draft:      'bg-warning',
  deprecated: 'bg-info',
  archived:   'bg-ink-faint',
}

// ── Derived data ─────────────────────────────────────────────────────────────

const totalAssets  = MOCK_ASSETS.length
const totalDomains = ALL_DOMAINS.length
const activeAssets = MOCK_ASSETS.filter(a => a.status === 'active').length
const recentAssets = [...MOCK_ASSETS]
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, 6)

const DOMAIN_COUNTS = Object.fromEntries(
  ALL_DOMAINS.map(d => [d, MOCK_ASSETS.filter(a => a.domain === d).length])
)

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4 shadow-card">
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary-50 shrink-0">
        <Icon size={18} className="text-primary-600" strokeWidth={1.75} />
      </div>
      <div>
        <div className="text-2xl font-bold text-ink tracking-tight">{value}</div>
        <div className="text-[12px] text-ink-muted">{label}</div>
      </div>
    </div>
  )
}

function AssetCard({ asset }: { asset: CatalogAsset }) {
  return (
    <Card>
      <CardBody>
        {/* Type + status row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-sm border ${TYPE_CLASSES[asset.type]}`}
          >
            {TYPE_LABEL[asset.type]}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-sm border ${STATUS_CLASSES[asset.status]}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[asset.status]}`}
              aria-hidden="true"
            />
            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
          </span>
        </div>

        {/* Name + description */}
        <h3 className="text-[14px] font-semibold text-ink mb-1.5 leading-snug">
          {asset.name}
        </h3>
        <p className="text-[12px] text-ink-muted leading-relaxed line-clamp-2 mb-4">
          {asset.description}
        </p>

        {/* Owner + domain */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-[11px] text-ink-faint">{asset.domain}</span>
          <span className="text-[11px] text-border-strong" aria-hidden="true">·</span>
          <span className="text-[11px] text-ink-faint">{asset.owner}</span>
        </div>
      </CardBody>

      <CardFooter>
        <Link
          to={`/catalog/asset/${asset.id}`}
          className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          View details
          <ArrowRight size={11} strokeWidth={2} />
        </Link>
      </CardFooter>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogHomePage() {
  return (
    <div>
      {/* ── Catalog hero band ─────────────────────────────────────────── */}
      <section
        className="relative bg-primary-900 overflow-hidden"
        aria-labelledby="catalog-heading"
      >
        {/* Grid texture */}
        <div className="absolute inset-0 bg-grid-subtle opacity-30" aria-hidden="true" />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-primary-950/40 to-transparent"
          aria-hidden="true"
        />

        <div className="relative px-8 py-14 max-w-6xl mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5" aria-hidden="true">
            <div className="h-px w-8 bg-ribbon" />
            <span className="text-ribbon text-[11px] font-semibold tracking-[0.18em] uppercase">
              Discovery
            </span>
          </div>

          <h1
            id="catalog-heading"
            className="text-3xl font-bold tracking-tight text-ink-inverse mb-3"
          >
            Enterprise Asset Catalog
          </h1>
          <p className="text-[14px] text-ink-inverse/60 max-w-xl mb-8 leading-relaxed">
            Browse, search, and govern the enterprise asset registry. Unified
            metadata, lineage, and classification across all data and service domains.
          </p>

          {/* Search bar — UI only, no backend */}
          <div className="relative max-w-xl">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-inverse/40 pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="search"
              placeholder="Search assets by name, owner, or tag…"
              className="w-full pl-10 pr-4 py-2.5 rounded-md bg-ink-inverse/10 border border-ink-inverse/20 text-[13px] text-ink-inverse placeholder:text-ink-inverse/40 focus:outline-none focus:ring-2 focus:ring-ribbon/60 focus:border-ribbon/40 transition-colors"
              readOnly
              aria-label="Search assets (not yet connected)"
            />
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="px-8 py-10">
        {/* Stats */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Assets"   value={totalAssets}   icon={Database} />
            <StatCard label="Domains"        value={totalDomains}  icon={Boxes} />
            <StatCard label="Active Assets"  value={activeAssets}  icon={BarChart2} />
            <StatCard label="New This Month" value={3}             icon={Sparkles} />
          </div>
        </div>

        {/* Browse by domain */}
        <section
          className="max-w-6xl mx-auto mb-10"
          aria-labelledby="domains-heading"
        >
          <SectionHeader
            id="domains-heading"
            eyebrow="Taxonomy"
            title="Browse by Domain"
            subtitle={`${totalDomains} domains · enterprise-wide`}
          />
          <div className="flex flex-wrap gap-2">
            {ALL_DOMAINS.map((domain) => (
              <Link
                key={domain}
                to={`/catalog/discovery?domain=${encodeURIComponent(domain)}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-subtle hover:border-primary-300 transition-colors text-[12px] font-medium text-ink"
              >
                {domain}
                <span className="text-[11px] text-ink-faint bg-surface-subtle rounded px-1.5 py-0.5 border border-border-muted">
                  {DOMAIN_COUNTS[domain]}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent assets */}
        <section
          className="max-w-6xl mx-auto"
          aria-labelledby="recent-heading"
        >
          <SectionHeader
            id="recent-heading"
            eyebrow="Recently Updated"
            title="Latest Assets"
            subtitle={`${totalAssets} total assets in the registry`}
            action={
              <Link
                to="/catalog/discovery"
                className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                Browse all
                <ArrowRight size={12} strokeWidth={2} />
              </Link>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {recentAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>

          <div className="flex justify-center">
            <Link to="/catalog/discovery">
              <Button variant="outline">
                Explore all assets
                <ArrowRight size={14} strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
