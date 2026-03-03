import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  SlidersHorizontal,
  LayoutGrid,
  ChevronDown,
  X,
  ShieldAlert,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import { Card, CardBody, CardFooter } from '../../components/ui/Card'
import AssetKindBadge from './components/AssetKindBadge'
import PublicationStatusBadge from './components/PublicationStatusBadge'
import { useCatalogAssets } from './hooks/useCatalogAssets'
import { useTaxonomyTerms } from './hooks/useTaxonomyTerms'
import type { BackendAsset, BackendPublicationStatus, CatalogListParams } from './api/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const PUBLICATION_STATUSES: { value: BackendPublicationStatus; label: string }[] = [
  { value: 'ga',         label: 'GA' },
  { value: 'preview',    label: 'Preview' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'retired',    label: 'Retired' },
]

const DATA_CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const
const HOSTING_TYPES        = ['Cloud', 'On-Premise', 'Hybrid', 'SaaS'] as const

type SortKey = 'updated_at' | 'published_at' | 'name'

const PAGE_SIZE = 24

// ── Filter section (collapsible) ──────────────────────────────────────────────

function FilterGroup({
  title,
  children,
  defaultOpen = true,
  activeCount = 0,
}: {
  title:        string
  children:     React.ReactNode
  defaultOpen?: boolean
  activeCount?: number
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border-muted last:border-0 pb-3 mb-3 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-ink-faint">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-600 text-[9px] font-bold text-ink-inverse">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`text-ink-faint transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  )
}

function FilterRadio({
  label,
  name,
  checked,
  onChange,
}: {
  label:    string
  name:     string
  checked:  boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group select-none">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 border-border accent-primary-600 cursor-pointer"
      />
      <span className="text-[12px] text-ink group-hover:text-primary-600 transition-colors">
        {label}
      </span>
    </label>
  )
}

function FilterCheckbox({
  label,
  checked,
  count,
  onChange,
}: {
  label:    string
  checked:  boolean
  count:    number
  onChange: () => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer group select-none">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-3.5 h-3.5 rounded border-border accent-primary-600 cursor-pointer"
        />
        <span className="text-[12px] text-ink group-hover:text-primary-600 transition-colors">
          {label}
        </span>
      </div>
      <span className="text-[10px] text-ink-faint tabular-nums">{count}</span>
    </label>
  )
}

function PiiRadio({
  value,
  current,
  onChange,
}: {
  value:    'all' | 'yes' | 'no'
  current:  'all' | 'yes' | 'no'
  onChange: (v: 'all' | 'yes' | 'no') => void
}) {
  const labels = { all: 'All', yes: 'Yes', no: 'No' }
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex-1 py-1 text-[11px] font-medium rounded border transition-colors ${
        current === value
          ? 'bg-primary-600 text-ink-inverse border-primary-600'
          : 'bg-surface text-ink-muted border-border hover:border-primary-300 hover:text-ink'
      }`}
    >
      {labels[value]}
    </button>
  )
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ asset }: { asset: BackendAsset }) {
  return (
    <Card>
      <CardBody>
        {/* Badges row */}
        <div className="flex items-center flex-wrap gap-1.5 mb-3">
          <AssetKindBadge kind={asset.asset_kind} />
          <PublicationStatusBadge status={asset.publication_status} />
          {asset.data_classification &&
            asset.data_classification !== 'Public' &&
            asset.data_classification !== 'Internal' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-sm border bg-surface-subtle border-border text-ink-muted">
                {asset.data_classification}
              </span>
            )}
          {asset.contains_pii && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-sm border bg-warning-bg border-warning/20 text-warning">
              <ShieldAlert size={9} strokeWidth={2} />
              PII
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-[14px] font-semibold text-ink leading-snug mb-1.5">
          {asset.name}
        </h3>

        {/* Summary */}
        <p className="text-[12px] text-ink-muted leading-relaxed line-clamp-2 mb-3">
          {asset.short_summary ?? ''}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-faint mt-auto">
          {asset.domain && <span>{asset.domain}</span>}
          {asset.domain && <span aria-hidden="true">·</span>}
          <span className="font-mono truncate max-w-25" title={asset.source_module_id}>
            {asset.source_module_id}
          </span>
          <span className="ml-auto">{asset.usage_count.toLocaleString()} uses</span>
        </div>
      </CardBody>

      <CardFooter>
        <div className="flex items-center justify-between gap-2">
          {/* Compliance tags */}
          <div className="flex flex-wrap gap-1 min-w-0">
            {asset.compliance_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-ink-faint font-mono truncate max-w-20"
              >
                {tag}
              </span>
            ))}
            {asset.compliance_tags.length > 3 && (
              <span className="text-[10px] text-ink-faint py-0.5">
                +{asset.compliance_tags.length - 3}
              </span>
            )}
          </div>

          <Link
            to={`/catalog/assets/${asset.id}`}
            className="text-[12px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors shrink-0"
          >
            View <ArrowRight size={11} strokeWidth={2} />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

// ── Active filter chip ─────────────────────────────────────────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-sm border bg-primary-50 border-primary-200 text-primary-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-primary-400 hover:text-primary-700 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-surface-subtle rounded" />
        <div className="h-5 w-10 bg-surface-subtle rounded" />
      </div>
      <div className="h-4 w-3/4 bg-surface-subtle rounded" />
      <div className="h-3 w-full bg-surface-subtle rounded" />
      <div className="h-3 w-2/3 bg-surface-subtle rounded" />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogDiscoveryPage() {
  const [searchParams] = useSearchParams()

  const initialKind   = searchParams.get('kind') ?? ''
  const initialStatus = searchParams.get('status') as BackendPublicationStatus | null

  // ── Taxonomy terms from backend ───────────────────────────────────────────
  const { terms: kindTerms }           = useTaxonomyTerms('asset_kind')
  const { terms: domainTerms }         = useTaxonomyTerms('domain')
  const { terms: complianceTagTerms }  = useTaxonomyTerms('compliance_tag')

  // ── Server-side filter state ──────────────────────────────────────────────
  const [selectedKind,          setSelectedKind]          = useState<string>(initialKind)
  const [selectedStatus,        setSelectedStatus]        = useState<BackendPublicationStatus | ''>(
    initialStatus ?? '',
  )
  const [selectedDomain,        setSelectedDomain]        = useState<string>('')
  const [selectedComplianceTag, setSelectedComplianceTag] = useState<string>('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortKey>('updated_at')

  // ── Client-side filter state (applied to loaded page) ────────────────────
  const [selectedClassifs, setSelectedClassifs] = useState<Set<string>>(new Set())
  const [selectedHosting,  setSelectedHosting]  = useState<Set<string>>(new Set())
  const [piiFilter,        setPiiFilter]        = useState<'all' | 'yes' | 'no'>('all')
  const [searchText,       setSearchText]       = useState('')

  // Build server-side params
  const serverParams: CatalogListParams = {
    ...(selectedKind          ? { asset_kind:         selectedKind }                              : {}),
    ...(selectedStatus        ? { publication_status: selectedStatus as BackendPublicationStatus } : {}),
    ...(selectedDomain        ? { domain:             selectedDomain }                            : {}),
    ...(selectedComplianceTag ? { compliance_tag:     selectedComplianceTag }                     : {}),
    page,
    pageSize: PAGE_SIZE,
    sort:     sort as CatalogListParams['sort'],
    order:    'desc',
  }

  const { data, loading, error } = useCatalogAssets(serverParams)

  const allItems   = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  // ── Client-side filter on loaded page ────────────────────────────────────
  const results = useMemo(() => {
    let list = allItems

    const q = searchText.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.short_summary ?? '').toLowerCase().includes(q) ||
          a.compliance_tags.some((t) => t.toLowerCase().includes(q)) ||
          (a.domain ?? '').toLowerCase().includes(q),
      )
    }

    if (selectedClassifs.size > 0)
      list = list.filter((a) => a.data_classification && selectedClassifs.has(a.data_classification))
    if (selectedHosting.size > 0)
      list = list.filter((a) => a.hosting_type && selectedHosting.has(a.hosting_type))
    if (piiFilter === 'yes') list = list.filter((a) => a.contains_pii)
    if (piiFilter === 'no')  list = list.filter((a) => !a.contains_pii)

    return list
  }, [allItems, searchText, selectedClassifs, selectedHosting, piiFilter])

  // Counts derived from loaded page for filter labels
  const classifCounts = useMemo(
    () => Object.fromEntries(DATA_CLASSIFICATIONS.map((c) => [c, allItems.filter((a) => a.data_classification === c).length])),
    [allItems],
  )
  const hostingCounts = useMemo(
    () => Object.fromEntries(HOSTING_TYPES.map((h) => [h, allItems.filter((a) => a.hosting_type === h).length])),
    [allItems],
  )

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    return next
  }

  function clearAll() {
    setSelectedKind('')
    setSelectedStatus('')
    setSelectedDomain('')
    setSelectedComplianceTag('')
    setSelectedClassifs(new Set())
    setSelectedHosting(new Set())
    setPiiFilter('all')
    setSearchText('')
    setPage(1)
  }

  const hasFilters =
    !!selectedKind || !!selectedStatus || !!selectedDomain || !!selectedComplianceTag ||
    selectedClassifs.size > 0 || selectedHosting.size > 0 ||
    piiFilter !== 'all' || searchText.trim() !== ''

  function handleKindChange(kind: string) {
    setSelectedKind(kind)
    setPage(1)
  }
  function handleStatusChange(status: BackendPublicationStatus | '') {
    setSelectedStatus(status)
    setPage(1)
  }
  function handleDomainChange(domain: string) {
    setSelectedDomain(domain)
    setPage(1)
  }
  function handleComplianceTagChange(tag: string) {
    setSelectedComplianceTag(tag)
    setPage(1)
  }
  function handleSortChange(s: SortKey) {
    setSort(s)
    setPage(1)
  }

  const statusLabel         = PUBLICATION_STATUSES.find((s) => s.value === selectedStatus)?.label ?? selectedStatus
  const domainLabel         = domainTerms.find((t) => t.code === selectedDomain)?.label ?? selectedDomain
  const complianceTagLabel  = complianceTagTerms.find((t) => t.code === selectedComplianceTag)?.label ?? selectedComplianceTag

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ────────────────────────────────────────────── */}
        <SectionHeader
          id="discovery-heading"
          eyebrow="Catalog"
          title="Asset Discovery"
          subtitle={
            loading
              ? 'Loading…'
              : `${results.length}${results.length < totalItems ? ` of ${totalItems}` : ''} asset${totalItems !== 1 ? 's' : ''}`
          }
          action={
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-[12px] text-ink-faint">Sort:</label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortKey)}
                className="text-[12px] border border-border rounded-md px-2 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
              >
                <option value="updated_at">Recently Updated</option>
                <option value="published_at">Recently Published</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
          }
        />

        {/* ── Error banner ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-md bg-red-50 border border-red-200 text-red-600 text-[12px]">
            <AlertCircle size={13} strokeWidth={2} />
            {error}
          </div>
        )}

        {/* ── Active filter chips ───────────────────────────────── */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <span className="text-[11px] text-ink-faint mr-1">Active:</span>
            {selectedKind          && <ActiveChip label={kindTerms.find((t) => t.code === selectedKind)?.label ?? selectedKind} onRemove={() => handleKindChange('')} />}
            {selectedStatus        && <ActiveChip label={statusLabel}        onRemove={() => handleStatusChange('')} />}
            {selectedDomain        && <ActiveChip label={domainLabel}        onRemove={() => handleDomainChange('')} />}
            {selectedComplianceTag && <ActiveChip label={complianceTagLabel} onRemove={() => handleComplianceTagChange('')} />}
            {[...selectedClassifs].map((c) => <ActiveChip key={c} label={c} onRemove={() => setSelectedClassifs(toggle(selectedClassifs, c))} />)}
            {[...selectedHosting].map((h)  => <ActiveChip key={h} label={h} onRemove={() => setSelectedHosting(toggle(selectedHosting, h))} />)}
            {piiFilter !== 'all' && <ActiveChip label={`PII: ${piiFilter}`} onRemove={() => setPiiFilter('all')} />}
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] text-primary-600 hover:text-primary-700 ml-1 underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Two-column layout ─────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* ── Filter sidebar ──────────────────────────────────── */}
          <aside
            className="w-56 shrink-0 sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto"
            aria-label="Filter assets"
          >
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={12} className="text-ink-faint" strokeWidth={2} />
                  <span className="text-[12px] font-semibold text-ink">Filters</span>
                </div>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Keyword search */}
              <div className="relative mb-4">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" strokeWidth={2} />
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-7 pr-3 py-1.5 text-[12px] border border-border rounded-md bg-surface-subtle text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary-400"
                  aria-label="Filter by keyword"
                />
              </div>

              {/* Asset Type — server-side, radio, driven by taxonomy */}
              <FilterGroup title="Asset Type" defaultOpen activeCount={selectedKind ? 1 : 0}>
                {kindTerms.map((t) => (
                  <FilterRadio
                    key={t.code}
                    name="asset-kind"
                    label={t.label}
                    checked={selectedKind === t.code}
                    onChange={() => handleKindChange(selectedKind === t.code ? '' : t.code)}
                  />
                ))}
              </FilterGroup>

              {/* Status — server-side, radio */}
              <FilterGroup title="Status" defaultOpen activeCount={selectedStatus ? 1 : 0}>
                {PUBLICATION_STATUSES.map(({ value, label }) => (
                  <FilterRadio
                    key={value}
                    name="pub-status"
                    label={label}
                    checked={selectedStatus === value}
                    onChange={() => handleStatusChange(selectedStatus === value ? '' : value)}
                  />
                ))}
              </FilterGroup>

              {/* Domain — server-side, radio, driven by taxonomy */}
              {domainTerms.length > 0 && (
                <FilterGroup title="Domain" defaultOpen={false} activeCount={selectedDomain ? 1 : 0}>
                  {domainTerms.map((t) => (
                    <FilterRadio
                      key={t.code}
                      name="domain"
                      label={t.label}
                      checked={selectedDomain === t.code}
                      onChange={() => handleDomainChange(selectedDomain === t.code ? '' : t.code)}
                    />
                  ))}
                </FilterGroup>
              )}

              {/* Compliance Tag — server-side, radio, driven by taxonomy */}
              {complianceTagTerms.length > 0 && (
                <FilterGroup title="Compliance Tag" defaultOpen={false} activeCount={selectedComplianceTag ? 1 : 0}>
                  {complianceTagTerms.map((t) => (
                    <FilterRadio
                      key={t.code}
                      name="compliance-tag"
                      label={t.label}
                      checked={selectedComplianceTag === t.code}
                      onChange={() => handleComplianceTagChange(selectedComplianceTag === t.code ? '' : t.code)}
                    />
                  ))}
                </FilterGroup>
              )}

              {/* Data Classification — client-side */}
              <FilterGroup title="Data Classification" defaultOpen={false} activeCount={selectedClassifs.size}>
                {DATA_CLASSIFICATIONS.map((c) => (
                  <FilterCheckbox key={c} label={c} checked={selectedClassifs.has(c)}
                    count={classifCounts[c] ?? 0}
                    onChange={() => setSelectedClassifs(toggle(selectedClassifs, c))} />
                ))}
              </FilterGroup>

              {/* Hosting Type — client-side */}
              <FilterGroup title="Hosting Type" defaultOpen={false} activeCount={selectedHosting.size}>
                {HOSTING_TYPES.map((h) => (
                  <FilterCheckbox key={h} label={h} checked={selectedHosting.has(h)}
                    count={hostingCounts[h] ?? 0}
                    onChange={() => setSelectedHosting(toggle(selectedHosting, h))} />
                ))}
              </FilterGroup>

              {/* PII — client-side */}
              <FilterGroup title="Contains PII" defaultOpen={false} activeCount={piiFilter !== 'all' ? 1 : 0}>
                <div className="flex gap-1">
                  {(['all', 'yes', 'no'] as const).map((v) => (
                    <PiiRadio key={v} value={v} current={piiFilter} onChange={setPiiFilter} />
                  ))}
                </div>
              </FilterGroup>
            </div>
          </aside>

          {/* ── Result grid ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg">
                <LayoutGrid size={32} className="text-ink-faint mb-3" strokeWidth={1} />
                <p className="text-[14px] font-medium text-ink-muted mb-1">
                  No assets match these filters
                </p>
                <p className="text-[12px] text-ink-faint mb-4">
                  Try adjusting your filters or clearing the search.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[12px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {results.map((asset) => (
                    <ResultCard key={asset.id} asset={asset} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-muted">
                    <p className="text-[12px] text-ink-faint">
                      Page {page} of {totalPages} · {totalItems} total
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded-md border border-border bg-surface text-ink-muted hover:text-ink hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={12} strokeWidth={2} />
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded-md border border-border bg-surface text-ink-muted hover:text-ink hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight size={12} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
