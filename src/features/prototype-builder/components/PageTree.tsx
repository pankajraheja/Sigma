// ---------------------------------------------------------------------------
// PageTree — vertical page list with add / rename / delete controls.
//
// - Home page (id="home") cannot be deleted
// - Double-click page title to rename inline
// - Add button creates a new blank page with its own id, route, html
// - Status dot shows which pages have generated content
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, FileText } from 'lucide-react'
import { usePrototype } from '../PrototypeContext'
import type { PrototypePage } from '../types'

interface PageTreeProps {
  selectedPageId: string
  onSelect: (id: string) => void
}

let pageCounter = 1

function generateId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export default function PageTree({ selectedPageId, onSelect }: PageTreeProps) {
  const { pages, addPage, renamePage, removePage } = usePrototype()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  function handleAdd() {
    pageCounter++
    const newPage: PrototypePage = {
      id: generateId(),
      route: `/page-${pageCounter}`,
      title: `Page ${pageCounter}`,
      description: '',
      html: '',
      updatedAt: new Date().toISOString(),
    }
    addPage(newPage)
    onSelect(newPage.id)
  }

  function startRename(page: PrototypePage) {
    setEditingId(page.id)
    setEditValue(page.title)
  }

  function commitRename() {
    if (editingId && editValue.trim()) {
      renamePage(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  function handleDelete(page: PrototypePage, isSelected: boolean) {
    // Find the next page to select after deletion
    const idx = pages.findIndex((p) => p.id === page.id)
    const remaining = pages.filter((p) => p.id !== page.id)
    const nextPage = remaining[Math.min(idx, remaining.length - 1)] ?? remaining[0]

    removePage(page.id)
    if (isSelected && nextPage) {
      onSelect(nextPage.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Pages ({pages.length})
        </span>
        <button
          type="button"
          onClick={handleAdd}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Add page"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto py-1">
        {pages.map((page) => {
          const isSelected = page.id === selectedPageId
          const isEditing = page.id === editingId
          const isHome = page.id === 'home'
          const hasContent = page.html.length > 0

          return (
            <div
              key={page.id}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => onSelect(page.id)}
              onDoubleClick={() => startRename(page)}
            >
              <FileText size={13} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />

              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 text-[12px] bg-white border border-blue-300 rounded px-1 py-0.5 outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-[12px] truncate select-none">
                  {page.title}
                </span>
              )}

              {/* Content status dot */}
              {!isEditing && (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    hasContent ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                  title={hasContent ? 'Has content' : 'Empty'}
                />
              )}

              {!isHome && !isEditing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(page, isSelected)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                  title="Delete page"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
