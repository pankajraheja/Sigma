import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  Database,
  Globe,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import { Card, CardBody, CardFooter } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AssetKindBadge from './components/AssetKindBadge'
import PublicationStatusBadge from './components/PublicationStatusBadge'
import { useCatalogAssets } from './hooks/useCatalogAssets'
import type { BackendAsset } from './api/types'

// Quick filter chips — link to discovery pre-filtered by kind
const KIND_CHIPS = ['Dataset', 'API', 'Model', 'Dashboard', 'Pipeline', 'Skill'] as const

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
  loading,
}: {
  label:    string
  value:    string | number
  icon:     React.ElementType
  sub?:     string
  loading?: boolean
}) {
  return (
    <div className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4 shadow-card">
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary-50 border border-primary-100 shrink-0">
        <Icon size={17} className="text-primary-600" strokeWidth={1.75} />
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-12 bg-surface-subtle rounded animate-pulse" />
        ) : (
          <div className="text-2xl font-bold text-ink tracking-tight leading-none">{value}</div>
        )}
        <div className="text-[12px] text-ink-muted mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-ink-faint mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function FeaturedAssetCard({ asset }: { asset: BackendAsset }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <AssetKindBadge kind={asset.asset_kind} />
            <PublicationStatusBadge status={asset.publication_status} />
          </div>
        </div>

        <h3 className="text-[15px] font-semibold text-ink leading-snug mb-2">
          {asset.name}
        </h3>
        <p className="text-[13px] text-ink-muted leading-relaxed line-clamp-3 mb-4 flex-1">
          {asset.short_summary ?? ''}
        </p>

        {/* Key meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-faint mt-auto">
          {asset.domain && <span>{asset.domain}</span>}
          {asset.domain && <span aria-hidden="true">·</span>}
          <span className="font-mono truncate max-w-[120px]" title={asset.source_module_id}>
            {asset.source_module_id}
          </span>
          {asset.contains_pii && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-warning font-medium">PII</span>
            </>
          )}
        </div>
      </CardBody>

      <CardFooter>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-faint">
            {asset.usage_count.toLocaleString()} uses
          </span>
          <Link
            to={`/catalog/assets/${asset.id}`}
            className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            View <ArrowRight size={11} strokeWidth={2} />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

function RecentAssetRow({ asset }: { asset: BackendAsset }) {
  return (
    <Link
      to={`/catalog/assets/${asset.id}`}
      className="flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-surface hover:bg-surface-subtle hover:border-primary-200 transition-all group"
    >
      <div className="flex items-center gap-2 shrink-0">
        <AssetKindBadge kind={asset.asset_kind} size="sm" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink truncate">{asset.name}</p>
        <p className="text-[11px] text-ink-faint truncate">
          {asset.domain ?? '—'} · {asset.source_module_id}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <PublicationStatusBadge status={asset.publication_status} size="sm" />
        <ArrowRight
          size={12}
          strokeWidth={2}
          className="text-ink-faint group-hover:text-primary-600 transition-colors"
        />
      </div>
    </Link>
  )
}

// ── Skeleton rows for loading state ──────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-card space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-surface-subtle rounded" />
        <div className="h-5 w-12 bg-surface-subtle rounded" />
      </div>
      <div className="h-4 w-3/4 bg-surface-subtle rounded" />
      <div className="h-3 w-full bg-surface-subtle rounded" />
      <div className="h-3 w-2/3 bg-surface-subtle rounded" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-surface animate-pulse">
      <div className="h-5 w-14 bg-surface-subtle rounded" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-1/2 bg-surface-subtle rounded" />
        <div className="h-3 w-1/3 bg-surface-subtle rounded" />
      </div>
      <div className="h-5 w-12 bg-surface-subtle rounded" />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogHomePage() {
  // Fetch all assets up to 100 for KPIs, featured, and recent sections
  const { data, loading, error } = useCatalogAssets({ pageSize: 100, sort: 'updated_at', order: 'desc' })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const kpis = useMemo(() => {
    const gaCount      = items.filter((a) => a.publication_status === 'ga').length
    const countrySet   = new Set(items.map((a) => a.primary_country_id).filter(Boolean))
    const domainSet    = new Set(items.map((a) => a.domain).filter(Boolean))
    return { gaCount, countries: countrySet.size, domains: domainSet.size }
  }, [items])

  const featuredAssets = useMemo(() => items.filter((a) => a.featured), [items])
  const recentAssets   = useMemo(() => items.slice(0, 6), [items])

  return (
    <div>
      {/* ── Hero band ───────────────────────────────────────────────────── */}
      <section
        className="relative bg-primary-900 overflow-hidden"
        aria-labelledby="catalog-home-heading"
      >
        <div className="absolute inset-0 bg-grid-subtle opacity-30" aria-hidden="true" />
        <div
          className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-primary-950/40 to-transparent"
          aria-hidden="true"
        />

        <div className="relative px-8 py-16 max-w-6xl mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5" aria-hidden="true">
            <div className="h-px w-8 bg-ribbon" />
            <span className="text-ribbon text-[11px] font-semibold tracking-[0.18em] uppercase">
              AI-Powered Discovery
            </span>
          </div>

          <h1
            id="catalog-home-heading"
            className="text-[2.25rem] font-bold tracking-tight text-ink-inverse leading-tight mb-4 max-w-lg"
          >
            AI Navigator
          </h1>

          <p className="text-[14px] text-ink-inverse/60 max-w-2xl mb-8 leading-relaxed">
            AI Navigator is the semantic discovery layer for approved enterprise assets. Discover,
            understand, compare, and reuse certified AI models, datasets, APIs, applications,
            workflows, and prototypes across SigAI — all governed, classified, and published
            through the SigAI governance workflow.
          </p>

          {/* Semantic search — UI placeholder, no backend yet */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-8">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-inverse/40 pointer-events-none"
                strokeWidth={2}
              />
              <input
                type="search"
                placeholder="Search assets, owners, tags, domains…"
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-ink-inverse/10 border border-ink-inverse/20 text-[13px] text-ink-inverse placeholder:text-ink-inverse/40 focus:outline-none focus:ring-2 focus:ring-ribbon/60 focus:border-ribbon/40 transition-colors"
                readOnly
                aria-label="Semantic search — not yet connected"
              />
            </div>
            <Link to="/catalog/discovery">
              <Button variant="inverse" size="md">
                Browse all
                <ArrowRight size={14} strokeWidth={2} />
              </Button>
            </Link>
          </div>

          {/* Quick filter chips by kind */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by asset kind">
            {KIND_CHIPS.map((kind) => (
              <Link
                key={kind}
                to={`/catalog/discovery?kind=${encodeURIComponent(kind)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ink-inverse/8 border border-ink-inverse/15 text-[11px] font-medium text-ink-inverse/70 hover:text-ink-inverse hover:bg-ink-inverse/14 hover:border-ink-inverse/25 transition-colors"
              >
                {kind}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Total Assets"   value={total}             icon={Database}     sub="all kinds"            loading={loading} />
          <KpiCard label="GA Assets"      value={kpis.gaCount}      icon={CheckCircle2} sub="certified & live"     loading={loading} />
          <KpiCard label="Countries"      value={kpis.countries}    icon={Globe}        sub="geographic coverage"  loading={loading} />
          <KpiCard label="Domains"        value={kpis.domains}      icon={Sparkles}     sub="taxonomy domains"     loading={loading} />
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="px-8 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-2 px-4 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-[12px]">
            <AlertCircle size={13} strokeWidth={2} />
            {error} — showing cached data or empty state.
          </div>
        </div>
      )}

      {/* ── Featured assets ─────────────────────────────────────────────── */}
      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            id="featured-heading"
            eyebrow="Featured"
            title="Featured Assets"
            subtitle="High-value assets recommended by the Data Governance Office"
            action={
              <Link
                to="/catalog/discovery?status=ga"
                className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                All GA assets <ArrowRight size={12} strokeWidth={2} />
              </Link>
            }
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredAssets.map((asset) => (
                <FeaturedAssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-[13px] text-ink-faint border border-dashed border-border rounded-lg">
              No featured assets yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Recently updated ────────────────────────────────────────────── */}
      <div className="px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            id="recent-heading"
            eyebrow="Recently Updated"
            title="Latest Activity"
            subtitle={
              loading
                ? 'Loading…'
                : `${total} asset${total !== 1 ? 's' : ''} registered${kpis.domains > 0 ? ` across ${kpis.domains} domain${kpis.domains !== 1 ? 's' : ''}` : ''}`
            }
            action={
              <Link
                to="/catalog/discovery"
                className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                Browse all <ArrowRight size={12} strokeWidth={2} />
              </Link>
            }
          />

          <div className="space-y-2 mb-6">
            {loading ? (
              [0, 1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
            ) : recentAssets.length > 0 ? (
              recentAssets.map((asset) => (
                <RecentAssetRow key={asset.id} asset={asset} />
              ))
            ) : (
              <div className="flex items-center gap-2 justify-center py-10 text-[13px] text-ink-faint border border-dashed border-border rounded-lg">
                <Loader2 size={14} strokeWidth={1.75} />
                No assets found.
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Link to="/catalog/discovery">
              <Button variant="outline">
                Explore all assets
                <ArrowRight size={14} strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Governance banner ───────────────────────────────────────────── */}
      <section
        className="bg-primary-50 border-t border-primary-100 px-8 py-8"
        aria-labelledby="governance-banner-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary-100 shrink-0 mt-0.5">
                <ShieldCheck size={18} className="text-primary-600" strokeWidth={1.75} />
              </div>
              <div>
                <h2
                  id="governance-banner-heading"
                  className="text-[14px] font-semibold text-ink mb-1"
                >
                  All assets governed by enterprise standards
                </h2>
                <p className="text-[13px] text-ink-muted max-w-xl leading-relaxed">
                  Every asset in AI Navigator has passed certification review. Metadata conforms to
                  the Enterprise Metadata Standard v3.0. Taxonomy bindings follow the corporate
                  classification hierarchy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/admin/metadata">
                <Button variant="outline" size="sm">
                  <BookOpen size={13} strokeWidth={1.75} />
                  Metadata Standard
                </Button>
              </Link>
              <Link to="/admin/taxonomy">
                <Button variant="ghost" size="sm">
                  Taxonomy →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
