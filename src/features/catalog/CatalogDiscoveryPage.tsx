import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, SlidersHorizontal, LayoutGrid } from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import { Card, CardBody, CardFooter } from '../../components/ui/Card'
import {
  MOCK_ASSETS,
  ALL_DOMAINS,
  ALL_TYPES,
  ALL_STATUSES,
  type CatalogAsset,
  type AssetType,
} from './data/mockAssets'
import type { AssetStatus } from '../../standards/metadataRules'

// ── Config ───────────────────────────────────────────────────────────────────

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

type SortKey = 'updated' | 'name' | 'usage'

// ── Filter panel ─────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-faint mb-2">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function FilterCheckbox({
  label,
  checked,
  count,
  onChange,
}: {
  label: string
  checked: boolean
  count: number
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer group">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-border accent-primary-600 cursor-pointer"
        />
        <span className="text-[13px] text-ink group-hover:text-primary-600 transition-colors">
          {label}
        </span>
      </div>
      <span className="text-[11px] text-ink-faint">{count}</span>
    </label>
  )
}

// ── Asset card ───────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: CatalogAsset }) {
  return (
    <Card>
      <CardBody>
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

        <h3 className="text-[14px] font-semibold text-ink mb-1.5 leading-snug">
          {asset.name}
        </h3>
        <p className="text-[12px] text-ink-muted leading-relaxed line-clamp-2 mb-4">
          {asset.description}
        </p>

        <div className="flex items-center gap-2 mt-auto">
          <span className="text-[11px] font-medium text-ink-faint">{asset.domain}</span>
          <span className="text-[11px] text-border-strong" aria-hidden="true">·</span>
          <span className="text-[11px] text-ink-faint">{asset.owner}</span>
          <span className="text-[11px] text-border-strong ml-auto" aria-hidden="true">·</span>
          <span className="text-[11px] text-ink-faint">{asset.usageCount.toLocaleString()} uses</span>
        </div>
      </CardBody>

      <CardFooter>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-ink-faint font-mono"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 text-ink-faint">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
          <Link
            to={`/catalog/asset/${asset.id}`}
            className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors shrink-0 ml-2"
          >
            View <ArrowRight size={11} strokeWidth={2} />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogDiscoveryPage() {
  const [searchParams] = useSearchParams()

  // Pre-populate domain filter from ?domain= query param (set by home page chips)
  const initialDomain = searchParams.get('domain')

  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    initialDomain ? new Set([initialDomain]) : new Set()
  )
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes]       = useState<Set<string>>(new Set())
  const [sortBy, setSortBy]                     = useState<SortKey>('updated')

  // Toggle helpers
  function toggle<T extends string>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    return next
  }

  // Counts for filter labels (unfiltered totals)
  const domainCounts = useMemo(
    () => Object.fromEntries(ALL_DOMAINS.map(d => [d, MOCK_ASSETS.filter(a => a.domain === d).length])),
    []
  )
  const statusCounts = useMemo(
    () => Object.fromEntries(ALL_STATUSES.map(s => [s, MOCK_ASSETS.filter(a => a.status === s).length])),
    []
  )
  const typeCounts = useMemo(
    () => Object.fromEntries(ALL_TYPES.map(t => [t, MOCK_ASSETS.filter(a => a.type === t).length])),
    []
  )

  // Filter + sort
  const results = useMemo(() => {
    let list = MOCK_ASSETS

    if (selectedDomains.size > 0)
      list = list.filter(a => selectedDomains.has(a.domain))
    if (selectedStatuses.size > 0)
      list = list.filter(a => selectedStatuses.has(a.status))
    if (selectedTypes.size > 0)
      list = list.filter(a => selectedTypes.has(a.type))

    return [...list].sort((a, b) => {
      if (sortBy === 'name')    return a.name.localeCompare(b.name)
      if (sortBy === 'usage')   return b.usageCount - a.usageCount
      /* updated */             return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [selectedDomains, selectedStatuses, selectedTypes, sortBy])

  const hasFilters =
    selectedDomains.size > 0 || selectedStatuses.size > 0 || selectedTypes.size > 0

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <SectionHeader
          id="discovery-heading"
          eyebrow="Catalog"
          title="Asset Discovery"
          subtitle={`${results.length} of ${MOCK_ASSETS.length} assets`}
          action={
            <div className="flex items-center gap-2">
              {/* Sort control */}
              <label htmlFor="sort-select" className="text-[12px] text-ink-faint">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="text-[12px] border border-border rounded-md px-2 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="name">Name (A–Z)</option>
                <option value="usage">Most Used</option>
              </select>
            </div>
          }
        />

        {/* ── Two-column layout ──────────────────────────────────── */}
        <div className="flex gap-8">
          {/* Filter sidebar */}
          <aside
            className="w-52 shrink-0"
            aria-label="Filter assets"
          >
            <div className="bg-surface border border-border rounded-lg p-4 sticky top-4">
              {/* Sidebar heading */}
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={13} className="text-ink-faint" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-ink">Filters</span>
                {hasFilters && (
                  <button
                    onClick={() => {
                      setSelectedDomains(new Set())
                      setSelectedStatuses(new Set())
                      setSelectedTypes(new Set())
                    }}
                    className="ml-auto text-[11px] text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Domain filter */}
              <FilterSection title="Domain">
                {ALL_DOMAINS.map(domain => (
                  <FilterCheckbox
                    key={domain}
                    label={domain}
                    checked={selectedDomains.has(domain)}
                    count={domainCounts[domain] ?? 0}
                    onChange={() => setSelectedDomains(toggle(selectedDomains, domain))}
                  />
                ))}
              </FilterSection>

              {/* Status filter */}
              <FilterSection title="Status">
                {ALL_STATUSES.map(status => (
                  <FilterCheckbox
                    key={status}
                    label={status.charAt(0).toUpperCase() + status.slice(1)}
                    checked={selectedStatuses.has(status)}
                    count={statusCounts[status] ?? 0}
                    onChange={() => setSelectedStatuses(toggle(selectedStatuses, status))}
                  />
                ))}
              </FilterSection>

              {/* Type filter */}
              <FilterSection title="Asset Type">
                {ALL_TYPES.map(type => (
                  <FilterCheckbox
                    key={type}
                    label={TYPE_LABEL[type]}
                    checked={selectedTypes.has(type)}
                    count={typeCounts[type] ?? 0}
                    onChange={() => setSelectedTypes(toggle(selectedTypes, type))}
                  />
                ))}
              </FilterSection>
            </div>
          </aside>

          {/* Results grid */}
          <div className="flex-1 min-w-0">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <LayoutGrid size={32} className="text-ink-faint mb-3" strokeWidth={1} />
                <p className="text-[14px] font-medium text-ink-muted mb-1">No assets match these filters</p>
                <p className="text-[12px] text-ink-faint">Try removing some filters to see more results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
