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
} from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import { Card, CardBody, CardFooter } from '../../components/ui/Card'
import AssetKindBadge from './components/AssetKindBadge'
import PublicationStatusBadge from './components/PublicationStatusBadge'
import {
  MOCK_CATALOG_ASSETS,
  ALL_KINDS,
  ALL_PUBLICATION_STATUSES,
  ALL_COUNTRIES,
  ALL_OPCOS,
  ALL_FUNCTION_GROUPS,
  ALL_INDUSTRY_SECTORS,
  ALL_SERVICE_OFFERINGS,
  ALL_DATA_CLASSIFICATIONS,
  ALL_HOSTING_TYPES,
} from './mock/assets'
import type { AssetKind, PublicationStatus, DataClassification, HostingType, CatalogSortKey } from './types'

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

function ResultCard({ asset }: { asset: typeof MOCK_CATALOG_ASSETS[0] }) {
  return (
    <Card>
      <CardBody>
        {/* Badges row */}
        <div className="flex items-center flex-wrap gap-1.5 mb-3">
          <AssetKindBadge kind={asset.kind} />
          <PublicationStatusBadge status={asset.publicationStatus} />
          {asset.nfrs.dataClassification !== 'Public' && asset.nfrs.dataClassification !== 'Internal' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-sm border bg-surface-subtle border-border text-ink-muted">
              {asset.nfrs.dataClassification}
            </span>
          )}
          {asset.nfrs.containsPII && (
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
          {asset.shortSummary}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-faint mt-auto">
          <span>{asset.domain}</span>
          <span aria-hidden="true">·</span>
          <span>{asset.owner}</span>
          <span aria-hidden="true">·</span>
          <span>v{asset.currentVersion}</span>
          <span className="ml-auto">{asset.usageCount.toLocaleString()} uses</span>
        </div>
      </CardBody>

      <CardFooter>
        <div className="flex items-center justify-between gap-2">
          {/* First 3 tags */}
          <div className="flex flex-wrap gap-1 min-w-0">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-ink-faint font-mono truncate max-w-20"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[10px] text-ink-faint py-0.5">
                +{asset.tags.length - 3}
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogDiscoveryPage() {
  const [searchParams] = useSearchParams()

  // Pre-populate from URL query params (from home page chips)
  const initialKind   = searchParams.get('kind')   as AssetKind | null
  const initialStatus = searchParams.get('status') as PublicationStatus | null

  // Filter state
  const [selectedKinds,    setSelectedKinds]    = useState<Set<AssetKind>>(
    initialKind ? new Set([initialKind]) : new Set()
  )
  const [selectedStatuses, setSelectedStatuses] = useState<Set<PublicationStatus>>(
    initialStatus ? new Set([initialStatus]) : new Set()
  )
  const [selectedCountries,    setSelectedCountries]    = useState<Set<string>>(new Set())
  const [selectedOpcos,        setSelectedOpcos]        = useState<Set<string>>(new Set())
  const [selectedFunctions,    setSelectedFunctions]    = useState<Set<string>>(new Set())
  const [selectedSectors,      setSelectedSectors]      = useState<Set<string>>(new Set())
  const [selectedOfferings,    setSelectedOfferings]    = useState<Set<string>>(new Set())
  const [selectedClassifs,     setSelectedClassifs]     = useState<Set<DataClassification>>(new Set())
  const [selectedHosting,      setSelectedHosting]      = useState<Set<HostingType>>(new Set())
  const [piiFilter,            setPiiFilter]            = useState<'all' | 'yes' | 'no'>('all')
  const [sortBy,               setSortBy]               = useState<CatalogSortKey>('updated')
  const [searchText,           setSearchText]           = useState('')

  // Generic toggle helper
  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    return next
  }

  function clearAll() {
    setSelectedKinds(new Set())
    setSelectedStatuses(new Set())
    setSelectedCountries(new Set())
    setSelectedOpcos(new Set())
    setSelectedFunctions(new Set())
    setSelectedSectors(new Set())
    setSelectedOfferings(new Set())
    setSelectedClassifs(new Set())
    setSelectedHosting(new Set())
    setPiiFilter('all')
    setSearchText('')
  }

  const hasFilters =
    selectedKinds.size + selectedStatuses.size + selectedCountries.size +
    selectedOpcos.size + selectedFunctions.size + selectedSectors.size +
    selectedOfferings.size + selectedClassifs.size + selectedHosting.size > 0 ||
    piiFilter !== 'all' || searchText.trim() !== ''

  // ── Counts for filter labels (always unfiltered totals) ──────────────────
  const kindCounts       = useMemo(() => Object.fromEntries(ALL_KINDS.map(k            => [k, MOCK_CATALOG_ASSETS.filter(a => a.kind === k).length])),             [])
  const statusCounts     = useMemo(() => Object.fromEntries(ALL_PUBLICATION_STATUSES.map(s => [s, MOCK_CATALOG_ASSETS.filter(a => a.publicationStatus === s).length])), [])
  const countryCounts    = useMemo(() => Object.fromEntries(ALL_COUNTRIES.map(c           => [c, MOCK_CATALOG_ASSETS.filter(a => a.country.includes(c)).length])),      [])
  const opcoCounts       = useMemo(() => Object.fromEntries(ALL_OPCOS.map(o               => [o, MOCK_CATALOG_ASSETS.filter(a => a.opco.includes(o)).length])),          [])
  const functionCounts   = useMemo(() => Object.fromEntries(ALL_FUNCTION_GROUPS.map(f      => [f, MOCK_CATALOG_ASSETS.filter(a => a.functionGroup === f).length])),       [])
  const sectorCounts     = useMemo(() => Object.fromEntries(ALL_INDUSTRY_SECTORS.map(s     => [s, MOCK_CATALOG_ASSETS.filter(a => a.industrySector === s).length])),     [])
  const offeringCounts   = useMemo(() => Object.fromEntries(ALL_SERVICE_OFFERINGS.map(o    => [o, MOCK_CATALOG_ASSETS.filter(a => a.serviceOffering === o).length])),    [])
  const classifCounts    = useMemo(() => Object.fromEntries(ALL_DATA_CLASSIFICATIONS.map(c => [c, MOCK_CATALOG_ASSETS.filter(a => a.nfrs.dataClassification === c).length])), [])
  const hostingCounts    = useMemo(() => Object.fromEntries(ALL_HOSTING_TYPES.map(h        => [h, MOCK_CATALOG_ASSETS.filter(a => a.nfrs.hostingType === h).length])),   [])

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    let list = MOCK_CATALOG_ASSETS

    const q = searchText.trim().toLowerCase()
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.owner.toLowerCase().includes(q) ||
      a.shortSummary.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q))
    )

    if (selectedKinds.size > 0)      list = list.filter(a => selectedKinds.has(a.kind))
    if (selectedStatuses.size > 0)   list = list.filter(a => selectedStatuses.has(a.publicationStatus))
    if (selectedCountries.size > 0)  list = list.filter(a => a.country.some(c => selectedCountries.has(c)))
    if (selectedOpcos.size > 0)      list = list.filter(a => a.opco.some(o => selectedOpcos.has(o)))
    if (selectedFunctions.size > 0)  list = list.filter(a => selectedFunctions.has(a.functionGroup))
    if (selectedSectors.size > 0)    list = list.filter(a => selectedSectors.has(a.industrySector))
    if (selectedOfferings.size > 0)  list = list.filter(a => selectedOfferings.has(a.serviceOffering))
    if (selectedClassifs.size > 0)   list = list.filter(a => selectedClassifs.has(a.nfrs.dataClassification))
    if (selectedHosting.size > 0)    list = list.filter(a => selectedHosting.has(a.nfrs.hostingType))
    if (piiFilter === 'yes')         list = list.filter(a => a.nfrs.containsPII)
    if (piiFilter === 'no')          list = list.filter(a => !a.nfrs.containsPII)

    return [...list].sort((a, b) => {
      if (sortBy === 'name')      return a.name.localeCompare(b.name)
      if (sortBy === 'usage')     return b.usageCount - a.usageCount
      if (sortBy === 'published') {
        const ap = a.publishedAt ?? '0000-00-00'
        const bp = b.publishedAt ?? '0000-00-00'
        return bp.localeCompare(ap)
      }
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [
    searchText, selectedKinds, selectedStatuses, selectedCountries, selectedOpcos,
    selectedFunctions, selectedSectors, selectedOfferings, selectedClassifs, selectedHosting,
    piiFilter, sortBy,
  ])

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ────────────────────────────────────────────── */}
        <SectionHeader
          id="discovery-heading"
          eyebrow="Catalog"
          title="Asset Discovery"
          subtitle={`${results.length} of ${MOCK_CATALOG_ASSETS.length} assets`}
          action={
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-[12px] text-ink-faint">Sort:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CatalogSortKey)}
                className="text-[12px] border border-border rounded-md px-2 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="published">Recently Published</option>
                <option value="name">Name (A–Z)</option>
                <option value="usage">Most Used</option>
              </select>
            </div>
          }
        />

        {/* ── Active filter chips ───────────────────────────────── */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <span className="text-[11px] text-ink-faint mr-1">Active:</span>
            {[...selectedKinds].map(k    => <ActiveChip key={k} label={k}    onRemove={() => setSelectedKinds(toggle(selectedKinds, k))} />)}
            {[...selectedStatuses].map(s => <ActiveChip key={s} label={s}    onRemove={() => setSelectedStatuses(toggle(selectedStatuses, s))} />)}
            {[...selectedCountries].map(c => <ActiveChip key={c} label={c}   onRemove={() => setSelectedCountries(toggle(selectedCountries, c))} />)}
            {[...selectedOpcos].map(o    => <ActiveChip key={o} label={o}    onRemove={() => setSelectedOpcos(toggle(selectedOpcos, o))} />)}
            {[...selectedFunctions].map(f => <ActiveChip key={f} label={f}   onRemove={() => setSelectedFunctions(toggle(selectedFunctions, f))} />)}
            {[...selectedSectors].map(s  => <ActiveChip key={s} label={s}    onRemove={() => setSelectedSectors(toggle(selectedSectors, s))} />)}
            {[...selectedOfferings].map(o => <ActiveChip key={o} label={o}   onRemove={() => setSelectedOfferings(toggle(selectedOfferings, o))} />)}
            {[...selectedClassifs].map(c => <ActiveChip key={c} label={c}    onRemove={() => setSelectedClassifs(toggle(selectedClassifs, c))} />)}
            {[...selectedHosting].map(h  => <ActiveChip key={h} label={h}    onRemove={() => setSelectedHosting(toggle(selectedHosting, h))} />)}
            {piiFilter !== 'all' && <ActiveChip label={`PII: ${piiFilter}`}  onRemove={() => setPiiFilter('all')} />}
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
              {/* Header */}
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

              {/* Search */}
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

              {/* Asset Type */}
              <FilterGroup title="Asset Type" defaultOpen activeCount={selectedKinds.size}>
                {ALL_KINDS.map(k => (
                  <FilterCheckbox key={k} label={k} checked={selectedKinds.has(k)} count={kindCounts[k] ?? 0}
                    onChange={() => setSelectedKinds(toggle(selectedKinds, k))} />
                ))}
              </FilterGroup>

              {/* Publication Status */}
              <FilterGroup title="Status" defaultOpen activeCount={selectedStatuses.size}>
                {ALL_PUBLICATION_STATUSES.map(s => (
                  <FilterCheckbox key={s} label={s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                    checked={selectedStatuses.has(s)} count={statusCounts[s] ?? 0}
                    onChange={() => setSelectedStatuses(toggle(selectedStatuses, s))} />
                ))}
              </FilterGroup>

              {/* Geography */}
              <FilterGroup title="Country" defaultOpen={false} activeCount={selectedCountries.size}>
                {ALL_COUNTRIES.map(c => (
                  <FilterCheckbox key={c} label={c} checked={selectedCountries.has(c)} count={countryCounts[c] ?? 0}
                    onChange={() => setSelectedCountries(toggle(selectedCountries, c))} />
                ))}
              </FilterGroup>

              <FilterGroup title="OpCo" defaultOpen={false} activeCount={selectedOpcos.size}>
                {ALL_OPCOS.map(o => (
                  <FilterCheckbox key={o} label={o.replace('OpCo ', '')} checked={selectedOpcos.has(o)} count={opcoCounts[o] ?? 0}
                    onChange={() => setSelectedOpcos(toggle(selectedOpcos, o))} />
                ))}
              </FilterGroup>

              {/* Classification */}
              <FilterGroup title="Function Group" defaultOpen={false} activeCount={selectedFunctions.size}>
                {ALL_FUNCTION_GROUPS.map(f => (
                  <FilterCheckbox key={f} label={f} checked={selectedFunctions.has(f)} count={functionCounts[f] ?? 0}
                    onChange={() => setSelectedFunctions(toggle(selectedFunctions, f))} />
                ))}
              </FilterGroup>

              <FilterGroup title="Industry Sector" defaultOpen={false} activeCount={selectedSectors.size}>
                {ALL_INDUSTRY_SECTORS.map(s => (
                  <FilterCheckbox key={s} label={s} checked={selectedSectors.has(s)} count={sectorCounts[s] ?? 0}
                    onChange={() => setSelectedSectors(toggle(selectedSectors, s))} />
                ))}
              </FilterGroup>

              <FilterGroup title="Service Offering" defaultOpen={false} activeCount={selectedOfferings.size}>
                {ALL_SERVICE_OFFERINGS.map(o => (
                  <FilterCheckbox key={o} label={o} checked={selectedOfferings.has(o)} count={offeringCounts[o] ?? 0}
                    onChange={() => setSelectedOfferings(toggle(selectedOfferings, o))} />
                ))}
              </FilterGroup>

              {/* NFRs */}
              <FilterGroup title="Data Classification" defaultOpen={false} activeCount={selectedClassifs.size}>
                {ALL_DATA_CLASSIFICATIONS.map(c => (
                  <FilterCheckbox key={c} label={c} checked={selectedClassifs.has(c)} count={classifCounts[c] ?? 0}
                    onChange={() => setSelectedClassifs(toggle(selectedClassifs, c))} />
                ))}
              </FilterGroup>

              <FilterGroup title="Hosting Type" defaultOpen={false} activeCount={selectedHosting.size}>
                {ALL_HOSTING_TYPES.map(h => (
                  <FilterCheckbox key={h} label={h} checked={selectedHosting.has(h)} count={hostingCounts[h] ?? 0}
                    onChange={() => setSelectedHosting(toggle(selectedHosting, h))} />
                ))}
              </FilterGroup>

              <FilterGroup title="Contains PII" defaultOpen={false} activeCount={piiFilter !== 'all' ? 1 : 0}>
                <div className="flex gap-1">
                  {(['all', 'yes', 'no'] as const).map(v => (
                    <PiiRadio key={v} value={v} current={piiFilter} onChange={setPiiFilter} />
                  ))}
                </div>
              </FilterGroup>
            </div>
          </aside>

          {/* ── Result grid ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {results.length === 0 ? (
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
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((asset) => (
                  <ResultCard key={asset.id} asset={asset} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
