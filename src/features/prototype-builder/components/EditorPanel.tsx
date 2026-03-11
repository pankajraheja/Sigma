// ---------------------------------------------------------------------------
// EditorPanel — visual editing sidebar for direct text edits.
//
// Lists all editable regions (headings, buttons, paragraphs, links,
// placeholders) parsed from the selected page's HTML. Each region shows
// an inline text input. Pending edits are staged and committed together
// with a single Apply button that re-validates against brand tokens.
//
// Requires the page to have generated HTML — shows an empty state otherwise.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import {
  Type,
  MousePointerClick,
  AlignLeft,
  Link2,
  FormInput,
  Tag,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react'
import type { EditableRegion } from '../lib/html-editor'
import type { DetectedBlock } from '../lib/block-parser'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditorPanelProps {
  regions: EditableRegion[]
  blocks: DetectedBlock[]
  /** Allowed block IDs from workspace policy — null means all allowed */
  allowedBlockIds: string[] | null
  pendingEdits: Record<string, string>
  dirty: boolean
  activeRegionId: string | null
  lastViolationCount: number
  onEdit: (regionId: string, value: string) => void
  onFocus: (regionId: string | null) => void
  onCommit: () => void
  onDiscard: () => void
}

// ---------------------------------------------------------------------------
// Region type → icon + color
// ---------------------------------------------------------------------------

const REGION_META: Record<
  EditableRegion['type'],
  { icon: typeof Type; label: string; color: string }
> = {
  heading: { icon: Type, label: 'Headings', color: 'text-blue-600' },
  button: { icon: MousePointerClick, label: 'Buttons & CTAs', color: 'text-violet-600' },
  paragraph: { icon: AlignLeft, label: 'Text Content', color: 'text-gray-600' },
  link: { icon: Link2, label: 'Links', color: 'text-cyan-600' },
  span: { icon: Tag, label: 'Labels', color: 'text-emerald-600' },
  input: { icon: FormInput, label: 'Placeholders', color: 'text-amber-600' },
}

const TYPE_ORDER: EditableRegion['type'][] = ['heading', 'button', 'paragraph', 'link', 'span', 'input']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditorPanel({
  regions,
  blocks,
  allowedBlockIds,
  pendingEdits,
  dirty,
  activeRegionId,
  lastViolationCount,
  onEdit,
  onFocus,
  onCommit,
  onDiscard,
}: EditorPanelProps) {
  // Group regions by type
  const groups = TYPE_ORDER
    .map((type) => ({
      type,
      meta: REGION_META[type],
      items: regions.filter((r) => r.type === type),
    }))
    .filter((g) => g.items.length > 0)

  if (regions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[11px] text-gray-400 text-center">
            Generate a page first, then use the editor to make direct text edits.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header />

      {/* Block composition summary */}
      {blocks.length > 0 && <BlockSummary blocks={blocks} allowedBlockIds={allowedBlockIds} />}

      {/* Commit bar */}
      {dirty && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
          <span className="text-[11px] text-blue-700 flex-1">
            {Object.keys(pendingEdits).length} pending edit{Object.keys(pendingEdits).length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-gray-500 hover:text-gray-700 rounded transition-colors"
          >
            <X size={10} /> Discard
          </button>
          <button
            type="button"
            onClick={onCommit}
            className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Check size={10} /> Apply
          </button>
        </div>
      )}

      {/* Post-commit brand feedback */}
      {!dirty && lastViolationCount > 0 && (
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-700">
          Brand validation corrected {lastViolationCount} token{lastViolationCount !== 1 ? 's' : ''}.
        </div>
      )}

      {/* Region groups */}
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <RegionGroup
            key={group.type}
            meta={group.meta}
            items={group.items}
            pendingEdits={pendingEdits}
            activeRegionId={activeRegionId}
            onEdit={onEdit}
            onFocus={onFocus}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  return (
    <div className="px-3 py-2 border-b border-gray-200">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Visual Editor
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Region Group (collapsible)
// ---------------------------------------------------------------------------

interface RegionGroupProps {
  meta: { icon: typeof Type; label: string; color: string }
  items: EditableRegion[]
  pendingEdits: Record<string, string>
  activeRegionId: string | null
  onEdit: (regionId: string, value: string) => void
  onFocus: (regionId: string | null) => void
}

function RegionGroup({ meta, items, pendingEdits, activeRegionId, onEdit, onFocus }: RegionGroupProps) {
  const [collapsed, setCollapsed] = useState(false)
  const Icon = meta.icon
  const Chevron = collapsed ? ChevronRight : ChevronDown
  const editedCount = items.filter((r) => pendingEdits[r.id] !== undefined).length

  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
      >
        <Chevron size={12} className="text-gray-400 shrink-0" />
        <Icon size={12} className={`${meta.color} shrink-0`} />
        <span className="text-[11px] font-medium text-gray-600 flex-1">{meta.label}</span>
        <span className="text-[10px] text-gray-400">{items.length}</span>
        {editedCount > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="pb-1">
          {items.map((region) => (
            <RegionRow
              key={region.id}
              region={region}
              pendingValue={pendingEdits[region.id]}
              isActive={activeRegionId === region.id}
              onEdit={onEdit}
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Region Row — single editable region
// ---------------------------------------------------------------------------

interface RegionRowProps {
  region: EditableRegion
  pendingValue: string | undefined
  isActive: boolean
  onEdit: (regionId: string, value: string) => void
  onFocus: (regionId: string | null) => void
}

function RegionRow({ region, pendingValue, isActive, onEdit, onFocus }: RegionRowProps) {
  // Strip HTML tags from the display value for the input
  const displayValue = pendingValue ?? stripTags(region.value)
  const isEdited = pendingValue !== undefined

  return (
    <div
      className={`mx-2 mb-1 rounded transition-colors ${
        isActive ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
      }`}
    >
      <label className="block px-2 py-1.5">
        <span className="text-[10px] text-gray-400 block mb-0.5 truncate" title={region.label}>
          {region.label}
        </span>
        {region.type === 'paragraph' ? (
          <textarea
            value={displayValue}
            onChange={(e) => onEdit(region.id, e.target.value)}
            onFocus={() => onFocus(region.id)}
            onBlur={() => onFocus(null)}
            rows={2}
            className={`w-full text-[11px] px-1.5 py-1 rounded border bg-white resize-y
              ${isEdited ? 'border-blue-300 text-blue-800' : 'border-gray-200 text-gray-700'}
              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100`}
          />
        ) : (
          <input
            type="text"
            value={displayValue}
            onChange={(e) => onEdit(region.id, e.target.value)}
            onFocus={() => onFocus(region.id)}
            onBlur={() => onFocus(null)}
            className={`w-full text-[11px] px-1.5 py-1 rounded border bg-white
              ${isEdited ? 'border-blue-300 text-blue-800' : 'border-gray-200 text-gray-700'}
              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100`}
          />
        )}
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Block Composition Summary
// ---------------------------------------------------------------------------

function BlockSummary({ blocks, allowedBlockIds }: { blocks: DetectedBlock[]; allowedBlockIds: string[] | null }) {
  const [expanded, setExpanded] = useState(false)
  const Chevron = expanded ? ChevronDown : ChevronRight
  const allowedSet = allowedBlockIds ? new Set(allowedBlockIds) : null
  const disallowedCount = allowedSet
    ? blocks.filter((b) => !allowedSet.has(b.block.id)).length
    : 0

  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
      >
        <Chevron size={12} className="text-gray-400 shrink-0" />
        <Layers size={12} className="text-indigo-500 shrink-0" />
        <span className="text-[11px] font-medium text-gray-600 flex-1">Page Blocks</span>
        <span className="text-[10px] text-gray-400">{blocks.length}</span>
        {disallowedCount > 0 && (
          <span className="text-[9px] px-1 py-px rounded-full bg-amber-100 text-amber-600">
            {disallowedCount} outside policy
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {blocks.map((b) => {
            const isAllowed = !allowedSet || allowedSet.has(b.block.id)
            return (
              <div
                key={`${b.block.id}-${b.index}`}
                className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] ${
                  isAllowed ? 'bg-gray-50' : 'bg-amber-50'
                }`}
              >
                <span className="font-medium text-gray-600">{b.index + 1}.</span>
                <span className={isAllowed ? 'text-gray-700' : 'text-amber-700'}>{b.block.name}</span>
                {!isAllowed && (
                  <span className="text-[9px] text-amber-500">outside policy</span>
                )}
                <span className="text-gray-400 ml-auto">{b.block.id}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}
