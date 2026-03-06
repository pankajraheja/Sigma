// ---------------------------------------------------------------------------
// TaxonomyAdminPage — admin UI for managing concept schemes and taxonomy terms
//
// Left sidebar: list of concept schemes
// Main area:    term grid for the selected scheme with CRUD actions
// ---------------------------------------------------------------------------

import { useState, useMemo } from 'react'
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react'
import clsx from 'clsx'
import SectionHeader from '../../../components/ui/SectionHeader'
import { useTaxonomyAdmin } from './useTaxonomyAdmin'
import TermFormDialog from './TermFormDialog'
import type {
  TaxonomyTerm,
  TaxonomyTermNode,
  CreateTermInput,
  UpdateTermInput,
} from '../../../shared/types/taxonomy'
import { buildTermTree } from '../../../shared/types/taxonomy'

export default function TaxonomyAdminPage() {
  const {
    schemes,
    terms,
    loading,
    error,
    refreshTerms,
    createTerm,
    updateTerm,
    deleteTerm,
  } = useTaxonomyAdmin()

  const [selectedScheme, setSelectedScheme] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<TaxonomyTerm | null>(null)

  // Auto-select first scheme
  const activeScheme = selectedScheme || schemes[0]?.code || ''

  // Filter terms to the active scheme
  const schemeTerms = useMemo(
    () => terms.filter((t) => t.scheme_code === activeScheme),
    [terms, activeScheme],
  )

  // Tree for hierarchical display
  const termTree = useMemo(() => buildTermTree(schemeTerms), [schemeTerms])
  const isHierarchical = termTree.some((n) => n.children.length > 0)

  // Search filter
  const filteredTerms = useMemo(() => {
    if (!searchText.trim()) return schemeTerms
    const q = searchText.toLowerCase()
    return schemeTerms.filter(
      (t) => t.label.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
    )
  }, [schemeTerms, searchText])

  const activeSchemeObj = schemes.find((s) => s.code === activeScheme)

  async function handleSchemeClick(code: string) {
    setSelectedScheme(code)
    setSearchText('')
    await refreshTerms(code)
  }

  function openCreateDialog() {
    setEditingTerm(null)
    setDialogOpen(true)
  }

  function openEditDialog(term: TaxonomyTerm) {
    setEditingTerm(term)
    setDialogOpen(true)
  }

  async function handleSave(input: CreateTermInput | UpdateTermInput, isNew: boolean) {
    if (isNew) {
      await createTerm(input as CreateTermInput)
    } else if (editingTerm) {
      await updateTerm(editingTerm.id, input as UpdateTermInput)
    }
  }

  async function handleToggleActive(term: TaxonomyTerm) {
    await updateTerm(term.id, { is_active: !term.is_active })
  }

  async function handleDelete(term: TaxonomyTerm) {
    if (!confirm(`Delete term "${term.label}"? This cannot be undone.`)) return
    await deleteTerm(term.id)
  }

  // ── Render a tree row ────────────────────────────────────────────────────
  function TermRow({ term, depth = 0 }: { term: TaxonomyTermNode; depth?: number }) {
    return (
      <>
        <tr
          className={clsx(
            'group hover:bg-surface-subtle transition-colors',
            !term.is_active && 'opacity-60',
          )}
        >
          <td className="px-3 py-2 text-[12px] text-ink" style={{ paddingLeft: `${12 + depth * 20}px` }}>
            {depth > 0 && <ChevronRight size={10} className="inline mr-1 text-ink-faint" />}
            {term.label}
          </td>
          <td className="px-3 py-2 text-[11px] font-mono text-ink-muted">{term.code}</td>
          <td className="px-3 py-2 text-[11px] text-ink-faint max-w-48 truncate">
            {term.description ?? '—'}
          </td>
          <td className="px-3 py-2 text-[11px] text-center">
            <span
              className={clsx(
                'inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-medium',
                term.is_active
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-surface-subtle text-ink-faint border border-border',
              )}
            >
              {term.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-3 py-2 text-[11px] text-ink-faint text-center">{term.sort_order}</td>
          <td className="px-3 py-2">
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => openEditDialog(term)}
                title="Edit"
                className="p-1 rounded text-ink-faint hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleToggleActive(term)}
                title={term.is_active ? 'Deactivate' : 'Activate'}
                className="p-1 rounded text-ink-faint hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                {term.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(term)}
                title="Delete"
                className="p-1 rounded text-ink-faint hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </td>
        </tr>
        {term.children.map((child) => (
          <TermRow key={child.id} term={child} depth={depth + 1} />
        ))}
      </>
    )
  }

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          id="taxonomy-admin"
          eyebrow="Administration"
          title="Taxonomy Manager"
          subtitle={`${schemes.length} schemes · ${terms.length} terms`}
        />

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-md bg-red-50 border border-red-200 text-red-600 text-[12px]">
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* ── Scheme sidebar ──────────────────────────────────── */}
          <aside className="w-56 shrink-0 sticky top-4">
            <div className="bg-surface border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={12} className="text-ink-faint" />
                <span className="text-[12px] font-semibold text-ink">Schemes</span>
              </div>

              <div className="space-y-0.5">
                {schemes.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => handleSchemeClick(s.code)}
                    className={clsx(
                      'w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition-colors cursor-pointer',
                      activeScheme === s.code
                        ? 'bg-primary-50 text-primary-700 font-medium border border-primary-200'
                        : 'text-ink hover:bg-surface-subtle',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{s.label}</span>
                      <span className="text-[10px] text-ink-faint ml-1">
                        {terms.filter((t) => t.scheme_code === s.code).length}
                      </span>
                    </div>
                    {s.is_hierarchical && (
                      <span className="text-[9px] text-ink-faint">Hierarchical</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Main content ────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[14px] font-semibold text-ink">
                  {activeSchemeObj?.label ?? activeScheme}
                </h3>
                {activeSchemeObj?.description && (
                  <span className="text-[11px] text-ink-faint hidden sm:inline">
                    {activeSchemeObj.description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Filter terms…"
                    className="pl-7 pr-3 py-1.5 text-[11px] border border-border rounded-md bg-surface-subtle
                               text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary-400 w-44"
                  />
                </div>

                {/* Add term */}
                {!activeSchemeObj?.is_locked && (
                  <button
                    type="button"
                    onClick={openCreateDialog}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium
                               bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    Add Term
                  </button>
                )}
              </div>
            </div>

            {/* Term table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Label</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Code</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Description</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-ink-faint uppercase tracking-wider w-20">Status</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-ink-faint uppercase tracking-wider w-16">Order</th>
                    <th className="px-3 py-2 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {searchText.trim()
                    ? filteredTerms.map((t) => (
                        <TermRow key={t.id} term={{ ...t, children: [] }} />
                      ))
                    : isHierarchical
                      ? termTree.map((node) => <TermRow key={node.id} term={node} />)
                      : schemeTerms.map((t) => (
                          <TermRow key={t.id} term={{ ...t, children: [] }} />
                        ))
                  }
                </tbody>
              </table>

              {schemeTerms.length === 0 && (
                <div className="text-center py-12 text-[13px] text-ink-faint">
                  No terms in this scheme yet.
                </div>
              )}

              {searchText.trim() && filteredTerms.length === 0 && schemeTerms.length > 0 && (
                <div className="text-center py-8 text-[12px] text-ink-faint">
                  No terms match "{searchText}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Term form dialog ─────────────────────────────────── */}
        <TermFormDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditingTerm(null) }}
          term={editingTerm}
          schemeCode={activeScheme}
          parentOptions={schemeTerms.filter((t) => t.is_active)}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
