import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Globe,
  Calendar,
  BarChart2,
  Tag,
  Info,
  ArrowRight,
} from 'lucide-react'
import { Panel, PanelRow } from '../../components/ui/Panel'
import { Card, CardBody, CardFooter } from '../../components/ui/Card'
import {
  getAssetById,
  getRelatedAssets,
  type CatalogAsset,
  type AssetType,
} from './data/mockAssets'
import type { AssetStatus } from '../../standards/metadataRules'

// ── Config ────────────────────────────────────────────────────────────────────

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

// ── Related asset card ────────────────────────────────────────────────────────

function RelatedAssetCard({ asset }: { asset: CatalogAsset }) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-sm border ${TYPE_CLASSES[asset.type]}`}
          >
            {TYPE_LABEL[asset.type]}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-sm border ${STATUS_CLASSES[asset.status]}`}
          >
            <span
              className={`w-1 h-1 rounded-full shrink-0 ${STATUS_DOT[asset.status]}`}
              aria-hidden="true"
            />
            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-ink leading-snug mb-1">
          {asset.name}
        </p>
        <p className="text-[11px] text-ink-faint">{asset.owner}</p>
      </CardBody>
      <CardFooter>
        <Link
          to={`/catalog/asset/${asset.id}`}
          className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          View <ArrowRight size={11} strokeWidth={2} />
        </Link>
      </CardFooter>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogAssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const asset   = id ? getAssetById(id) : undefined

  // Guard: unknown asset → back to catalog home
  if (!asset) {
    return <Navigate to="/catalog" replace />
  }

  const related = getRelatedAssets(asset)

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto">
        {/* ── Breadcrumb ──────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-[12px] text-ink-faint mb-6" aria-label="Breadcrumb">
          <Link to="/catalog" className="hover:text-primary-600 transition-colors">
            Catalog
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/catalog/discovery" className="hover:text-primary-600 transition-colors">
            Discovery
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink truncate max-w-[200px]">{asset.name}</span>
        </nav>

        {/* ── Back link ────────────────────────────────────────── */}
        <Link
          to="/catalog/discovery"
          className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-primary-600 transition-colors mb-6"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back to Discovery
        </Link>

        {/* ── Asset header band ────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-6 shadow-card">
          {/* Type + status */}
          <div className="flex items-center gap-2 mb-4">
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

          {/* Name */}
          <h1 className="text-2xl font-bold text-ink tracking-tight mb-2">
            {asset.name}
          </h1>

          {/* Domain + owner inline */}
          <div className="flex items-center gap-3 text-[13px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Globe size={12} strokeWidth={1.75} className="text-ink-faint" />
              {asset.domain}
            </span>
            <span className="text-border-strong" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <User size={12} strokeWidth={1.75} className="text-ink-faint" />
              {asset.owner}
            </span>
          </div>
        </div>

        {/* ── Two-column body ──────────────────────────────────── */}
        <div className="flex gap-6">
          {/* Left: main content */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Description panel */}
            <Panel title="Description" Icon={Info}>
              <div className="px-4 py-3">
                <p className="text-[13px] text-ink leading-relaxed">
                  {asset.description}
                </p>
              </div>
            </Panel>

            {/* Metadata panel */}
            <Panel title="Metadata" Icon={BarChart2} meta="Required fields">
              <PanelRow>
                <span className="text-ink-faint w-24 shrink-0">Name</span>
                <span className="text-ink font-medium">{asset.name}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-24 shrink-0">Owner</span>
                <span className="text-ink">{asset.owner}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-24 shrink-0">Domain</span>
                <span className="text-ink">{asset.domain}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-24 shrink-0">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-sm border ${STATUS_CLASSES[asset.status]}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[asset.status]}`}
                    aria-hidden="true"
                  />
                  {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                </span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-24 shrink-0">Type</span>
                <span className="text-ink">{TYPE_LABEL[asset.type]}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-24 shrink-0">Updated</span>
                <span className="flex items-center gap-1.5 text-ink">
                  <Calendar size={11} strokeWidth={1.75} className="text-ink-faint" />
                  {new Date(asset.updatedAt).toLocaleDateString('en-US', {
                    year:  'numeric',
                    month: 'long',
                    day:   'numeric',
                  })}
                </span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-24 shrink-0">Usage</span>
                <span className="flex items-center gap-1.5 text-ink">
                  <BarChart2 size={11} strokeWidth={1.75} className="text-ink-faint" />
                  {asset.usageCount.toLocaleString()} references
                </span>
              </PanelRow>
            </Panel>

            {/* Tags panel */}
            <Panel title="Tags" Icon={Tag} meta={`${asset.tags.length} tags`}>
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {asset.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-sm bg-surface-subtle border border-border text-[11px] font-mono text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Panel>
          </div>

          {/* Right: sidebar */}
          <aside className="w-64 shrink-0 space-y-5">
            {/* Quick stats */}
            <div className="bg-surface border border-border rounded-md p-4 shadow-card">
              <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-faint mb-3">
                At a Glance
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-ink-muted">Usage count</span>
                  <span className="text-[13px] font-semibold text-ink">{asset.usageCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-ink-muted">Asset type</span>
                  <span className="text-[12px] text-ink">{TYPE_LABEL[asset.type]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-ink-muted">Last updated</span>
                  <span className="text-[12px] text-ink">
                    {new Date(asset.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day:   'numeric',
                      year:  'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-ink-muted">Tag count</span>
                  <span className="text-[12px] text-ink">{asset.tags.length}</span>
                </div>
              </div>
            </div>

            {/* Related assets */}
            {related.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-faint mb-3">
                  Related in {asset.domain}
                </div>
                <div className="space-y-3">
                  {related.map(rel => (
                    <RelatedAssetCard key={rel.id} asset={rel} />
                  ))}
                </div>
              </div>
            )}

            {/* Back to discovery */}
            <Link
              to="/catalog/discovery"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-md border border-border bg-surface hover:bg-surface-subtle text-[12px] font-medium text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={12} strokeWidth={2} />
              Back to Discovery
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
