// ---------------------------------------------------------------------------
// TermFormDialog — modal for creating / editing a taxonomy term
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { TaxonomyTerm, CreateTermInput, UpdateTermInput } from '../../../shared/types/taxonomy'

export interface TermFormDialogProps {
  open: boolean
  onClose: () => void
  /** If set, we're editing an existing term */
  term?: TaxonomyTerm | null
  /** Scheme code for the new term (required for create) */
  schemeCode: string
  /** Available parent terms (same scheme) for hierarchical selection */
  parentOptions: TaxonomyTerm[]
  onSave: (input: CreateTermInput | UpdateTermInput, isNew: boolean) => Promise<void>
}

export default function TermFormDialog({
  open,
  onClose,
  term,
  schemeCode,
  parentOptions,
  onSave,
}: TermFormDialogProps) {
  const isEdit = !!term

  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [parentTermId, setParentTermId] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when term changes
  useEffect(() => {
    if (term) {
      setCode(term.code)
      setLabel(term.label)
      setDescription(term.description ?? '')
      setParentTermId(term.parent_term_id ?? '')
      setSortOrder(term.sort_order)
      setIsActive(term.is_active)
    } else {
      setCode('')
      setLabel('')
      setDescription('')
      setParentTermId('')
      setSortOrder(0)
      setIsActive(true)
    }
    setError(null)
  }, [term, open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (isEdit) {
        const input: UpdateTermInput = {
          label: label.trim(),
          description: description.trim() || null,
          parent_term_id: parentTermId || null,
          sort_order: sortOrder,
          is_active: isActive,
        }
        await onSave(input, false)
      } else {
        if (!code.trim() || !label.trim()) {
          setError('Code and label are required.')
          setSaving(false)
          return
        }
        const input: CreateTermInput = {
          scheme_code: schemeCode,
          code: code.trim().toLowerCase().replace(/\s+/g, '_'),
          label: label.trim(),
          description: description.trim() || undefined,
          parent_term_id: parentTermId || undefined,
          sort_order: sortOrder,
        }
        await onSave(input, true)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-surface border border-border rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-[14px] font-semibold text-ink">
            {isEdit ? 'Edit Term' : 'New Term'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Code (only for new) */}
          {!isEdit && (
            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. data_engineering"
                className="w-full px-3 py-1.5 text-[12px] border border-border rounded-md bg-surface-subtle
                           text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary-400"
                required
              />
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Data Engineering"
              className="w-full px-3 py-1.5 text-[12px] border border-border rounded-md bg-surface-subtle
                         text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              className="w-full px-3 py-1.5 text-[12px] border border-border rounded-md bg-surface-subtle
                         text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
            />
          </div>

          {/* Parent term */}
          {parentOptions.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">Parent Term</label>
              <select
                value={parentTermId}
                onChange={(e) => setParentTermId(e.target.value)}
                className="w-full px-3 py-1.5 text-[12px] border border-border rounded-md bg-surface-subtle
                           text-ink focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
              >
                <option value="">None (root level)</option>
                {parentOptions
                  .filter((p) => p.id !== term?.id) // can't be own parent
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Sort order */}
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-20 px-3 py-1.5 text-[12px] border border-border rounded-md bg-surface-subtle
                         text-ink focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="term-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border text-primary-600 focus:ring-primary-400"
              />
              <label htmlFor="term-active" className="text-[12px] text-ink">
                Active
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] text-ink-muted border border-border rounded-md
                         hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={clsx(
                'px-4 py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer',
                'bg-primary-600 text-white hover:bg-primary-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
