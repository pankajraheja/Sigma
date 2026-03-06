// ---------------------------------------------------------------------------
// TaxonomyPicker — bucket-centric taxonomy selector
//
// Loads a full scheme (scheme → buckets → term trees) via the metadata
// taxonomy API and renders each bucket as a labelled section with selectable
// term chips.  Supports:
//   - multi-select / single-select per bucket (from bucket.is_multi_select)
//   - nested terms (indented children)
//   - global search bar that queries the /terms/search endpoint
//   - required-bucket indicators
//
// Usage:
//   <TaxonomyPicker
//     schemeKey="consulting_firm"
//     value={{ service_lines: ['id1'], industries: ['id2', 'id3'] }}
//     onChange={(next) => setValue(next)}
//   />
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, Check, X, AlertCircle, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { taxonomyApi, TaxonomyApiError } from '../api/taxonomyApi'
import type {
  SchemeDetail,
  BucketWithTerms,
  TermNode,
  TermSearchHit,
} from '../types/taxonomy'

// ── Public types ────────────────────────────────────────────────────────────

/** Per-bucket selection map:  { [bucketKey]: termId[] } */
export type TaxonomyPickerValue = Record<string, string[]>

export interface TaxonomyPickerProps {
  /** The scheme_key to load (e.g. "consulting_firm") */
  schemeKey: string
  /** Controlled value — map of bucketKey → selected term IDs */
  value: TaxonomyPickerValue
  /** Called with the next value whenever a selection changes */
  onChange: (next: TaxonomyPickerValue) => void
  /** Show the global search bar  (default true) */
  showSearch?: boolean
  /** Extra CSS class on the outer wrapper */
  className?: string
  /** Disabled state — locks all interactions */
  disabled?: boolean
}

// ── Component ───────────────────────────────────────────────────────────────

export default function TaxonomyPicker({
  schemeKey,
  value,
  onChange,
  showSearch = true,
  className,
  disabled = false,
}: TaxonomyPickerProps) {
  // ── State ───────────────────────────────────────────────────────────────
  const [scheme, setScheme] = useState<SchemeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TermSearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Collapsed buckets (set of bucket_key)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // ── Load scheme ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    taxonomyApi
      .getScheme(schemeKey)
      .then((res) => {
        if (!cancelled) {
          setScheme(res.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof TaxonomyApiError
              ? `${err.status}: ${err.message}`
              : 'Failed to load taxonomy'
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [schemeKey])

  // ── Debounced search ────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      taxonomyApi
        .searchTerms(searchQuery, { scheme: schemeKey, limit: 30 })
        .then((res) => setSearchResults(res.data))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, schemeKey])

  // ── Selection helpers ───────────────────────────────────────────────────
  const isSelected = useCallback(
    (bucketKey: string, termId: string) =>
      (value[bucketKey] ?? []).includes(termId),
    [value],
  )

  const toggleTerm = useCallback(
    (bucketKey: string, termId: string, multiSelect: boolean) => {
      if (disabled) return
      const prev = value[bucketKey] ?? []

      let next: string[]
      if (multiSelect) {
        next = prev.includes(termId)
          ? prev.filter((id) => id !== termId)
          : [...prev, termId]
      } else {
        // single-select: toggle off, or replace
        next = prev.includes(termId) ? [] : [termId]
      }

      onChange({ ...value, [bucketKey]: next })
    },
    [value, onChange, disabled],
  )

  const clearBucket = useCallback(
    (bucketKey: string) => {
      if (disabled) return
      onChange({ ...value, [bucketKey]: [] })
    },
    [value, onChange, disabled],
  )

  const toggleCollapse = useCallback((bucketKey: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(bucketKey)) next.delete(bucketKey)
      else next.add(bucketKey)
      return next
    })
  }, [])

  // ── Loading / error states ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={clsx('flex items-center justify-center gap-2 py-10 text-ink-muted', className)}>
        <Loader2 size={16} className="animate-spin" />
        <span className="text-[12px]">Loading taxonomy…</span>
      </div>
    )
  }

  if (error || !scheme) {
    return (
      <div className={clsx('flex items-center gap-2 py-6 px-4 text-[12px] text-warning', className)}>
        <AlertCircle size={14} />
        <span>{error ?? 'Scheme not found'}</span>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const isSearchActive = showSearch && searchQuery.trim().length > 0

  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      {/* ── Global search ──────────────────────────────────────────────── */}
      {showSearch && (
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${scheme.label}…`}
            disabled={disabled}
            className={clsx(
              'w-full pl-8 pr-8 py-2 border border-border rounded-md bg-surface',
              'text-[12px] text-ink placeholder:text-ink-faint',
              'focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400',
              'transition-colors',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink cursor-pointer"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── Search results overlay ─────────────────────────────────────── */}
      {isSearchActive && (
        <div className="border border-border rounded-md bg-surface shadow-card overflow-hidden">
          <div className="px-3 py-2 bg-surface-subtle border-b border-border-muted">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint">
              Search results
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {searching && (
              <div className="flex items-center gap-2 px-3 py-3 text-ink-muted">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[12px]">Searching…</span>
              </div>
            )}

            {!searching && searchResults.length === 0 && (
              <div className="px-3 py-3 text-[12px] text-ink-faint text-center">
                No matching terms
              </div>
            )}

            {!searching &&
              searchResults.map((hit) => {
                const selected = isSelected(hit.bucket_key, hit.term_id)
                const bucket = scheme.buckets.find((b) => b.bucket_key === hit.bucket_key)
                const multi = bucket?.is_multi_select ?? true
                return (
                  <button
                    key={hit.term_id}
                    type="button"
                    onClick={() => toggleTerm(hit.bucket_key, hit.term_id, multi)}
                    disabled={disabled}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors',
                      'text-left text-[12px] border-b border-border-muted last:border-0',
                      selected
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink hover:bg-surface-subtle',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <SelectIndicator selected={selected} multi={multi} />
                    <span className="flex-1 truncate">
                      {hit.term_label}
                      {hit.matched_alias && (
                        <span className="ml-1 text-ink-faint">
                          ({hit.matched_alias})
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-ink-faint shrink-0">
                      {hit.bucket_label}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Bucket sections ────────────────────────────────────────────── */}
      {!isSearchActive &&
        scheme.buckets
          .filter((b) => b.is_active)
          .map((bucket) => (
            <BucketSection
              key={bucket.id}
              bucket={bucket}
              selectedIds={value[bucket.bucket_key] ?? []}
              collapsed={collapsed.has(bucket.bucket_key)}
              disabled={disabled}
              onToggleTerm={(termId) =>
                toggleTerm(bucket.bucket_key, termId, bucket.is_multi_select)
              }
              onClear={() => clearBucket(bucket.bucket_key)}
              onToggleCollapse={() => toggleCollapse(bucket.bucket_key)}
            />
          ))}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

/** Checkbox (multi) or radio (single) visual indicator */
function SelectIndicator({ selected, multi }: { selected: boolean; multi: boolean }) {
  if (multi) {
    return (
      <span
        className={clsx(
          'flex items-center justify-center w-3.5 h-3.5 rounded-sm border shrink-0 transition-colors',
          selected
            ? 'bg-primary-600 border-primary-600'
            : 'bg-surface border-border-muted',
        )}
      >
        {selected && <Check size={9} strokeWidth={3} className="text-ink-inverse" />}
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'flex items-center justify-center w-3.5 h-3.5 rounded-full border shrink-0 transition-colors',
        selected
          ? 'border-primary-600'
          : 'border-border-muted',
      )}
    >
      {selected && <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
    </span>
  )
}

/** A single bucket section with header + nested term tree */
function BucketSection({
  bucket,
  selectedIds,
  collapsed,
  disabled,
  onToggleTerm,
  onClear,
  onToggleCollapse,
}: {
  bucket: BucketWithTerms
  selectedIds: string[]
  collapsed: boolean
  disabled: boolean
  onToggleTerm: (termId: string) => void
  onClear: () => void
  onToggleCollapse: () => void
}) {
  const count = selectedIds.length

  return (
    <div className="border border-border rounded-md bg-surface shadow-card overflow-hidden">
      {/* Bucket header */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 bg-surface-subtle',
          'border-b border-border-muted cursor-pointer select-none',
          'hover:bg-surface transition-colors',
        )}
      >
        <ChevronRight
          size={12}
          className={clsx(
            'text-ink-faint shrink-0 transition-transform duration-150',
            !collapsed && 'rotate-90',
          )}
        />

        <span className="flex-1 text-left">
          <span className="text-[12px] font-semibold text-ink">{bucket.label}</span>
          {bucket.is_required && (
            <span className="ml-1 text-[10px] text-warning font-medium">*</span>
          )}
          {bucket.description && (
            <span className="ml-2 text-[11px] text-ink-faint">{bucket.description}</span>
          )}
        </span>

        <span className="flex items-center gap-2 shrink-0">
          {count > 0 && (
            <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
              {count}
            </span>
          )}
          <span className="text-[10px] text-ink-faint">
            {bucket.is_multi_select ? 'multi' : 'single'}
          </span>
        </span>
      </button>

      {/* Term list (collapsible) */}
      {!collapsed && (
        <div className="max-h-56 overflow-y-auto">
          {bucket.terms.length === 0 && (
            <div className="px-3 py-3 text-[12px] text-ink-faint text-center">
              No terms in this bucket
            </div>
          )}

          {bucket.terms.map((term) => (
            <TermRow
              key={term.id}
              term={term}
              depth={0}
              multi={bucket.is_multi_select}
              selectedIds={selectedIds}
              disabled={disabled}
              onToggle={onToggleTerm}
            />
          ))}

          {/* Clear button */}
          {count > 0 && !disabled && (
            <div className="px-3 py-1.5 border-t border-border-muted">
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] text-ink-faint hover:text-ink cursor-pointer transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** A single term row (recursive for children) */
function TermRow({
  term,
  depth,
  multi,
  selectedIds,
  disabled,
  onToggle,
}: {
  term: TermNode
  depth: number
  multi: boolean
  selectedIds: string[]
  disabled: boolean
  onToggle: (termId: string) => void
}) {
  const selected = selectedIds.includes(term.id)
  const hasChildren = term.children.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => onToggle(term.id)}
        disabled={disabled || !term.is_active}
        className={clsx(
          'w-full flex items-center gap-2 py-1.5 pr-3 cursor-pointer transition-colors',
          'text-left text-[12px] border-b border-border-muted last:border-0',
          selected
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-ink hover:bg-surface-subtle',
          !term.is_active && 'opacity-40 cursor-not-allowed',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <SelectIndicator selected={selected} multi={multi} />
        <span className="flex-1 truncate">
          {term.label}
          {term.aliases.length > 0 && (
            <span className="ml-1 text-[10px] text-ink-faint">
              ({term.aliases.map((a) => a.alias_label).join(', ')})
            </span>
          )}
        </span>
        {!term.is_active && (
          <span className="text-[10px] text-ink-faint shrink-0">inactive</span>
        )}
      </button>
      {hasChildren &&
        term.children.map((child) => (
          <TermRow
            key={child.id}
            term={child}
            depth={depth + 1}
            multi={multi}
            selectedIds={selectedIds}
            disabled={disabled}
            onToggle={onToggle}
          />
        ))}
    </>
  )
}
