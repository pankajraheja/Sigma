// ---------------------------------------------------------------------------
// PrototypeWorkspace — three-panel layout composition.
//
// Left:   PageTree (200px) — page list, add/rename/delete
// Center: ChatInput OR EditorPanel (320px) — toggled via tab
// Right:  PreviewFrame (flex) — selected page's HTML preview
//
// All state flows from useWorkspace + useVisualEditor → props.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { ShieldCheck, MessageSquare, PenLine } from 'lucide-react'
import PageTree from './PageTree'
import ChatInput from './ChatInput'
import EditorPanel from './EditorPanel'
import PreviewFrame from './PreviewFrame'
import SubmitButton from './SubmitButton'
import { useWorkspace } from '../hooks/useWorkspace'
import { useVisualEditor } from '../hooks/useVisualEditor'
import { usePrototype } from '../PrototypeContext'
import { useBrand } from '../../brand/BrandContext'
import { toBrandValidationConfig } from '../../../lib/brand-validation'
import type { WorkspaceType } from '../lib/workspace-policy'

type CenterPanel = 'chat' | 'editor'

export default function PrototypeWorkspace() {
  const {
    pages,
    selectedPage,
    selectedPageId,
    selectPage,
    history,
    generating,
    error,
    lastValidation,
    generate,
    workspaceType,
    setWorkspaceType,
    allowedBlockIds,
  } = useWorkspace()

  const { updatePage } = usePrototype()
  const { currentBrand } = useBrand()

  const [centerPanel, setCenterPanel] = useState<CenterPanel>('chat')

  const brandValidationConfig = currentBrand ? toBrandValidationConfig(currentBrand) : null

  const editor = useVisualEditor({
    html: selectedPage?.html ?? '',
    pageId: selectedPageId,
    brandValidationConfig,
    updatePage,
  })

  const pagesWithContent = pages.filter((p) => p.html.length > 0).length
  const hasContent = (selectedPage?.html.length ?? 0) > 0

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-[14px] font-semibold text-gray-700">Prototype Lab</h1>
          <span className="text-[11px] text-gray-400">
            {pagesWithContent}/{pages.length} pages generated
          </span>
          <WorkspaceTypeSelector value={workspaceType} onChange={setWorkspaceType} />
        </div>
        <SubmitButton />
      </div>

      {/* Brand validation feedback */}
      {lastValidation?.wasModified && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-700">
          <ShieldCheck size={12} className="shrink-0" />
          <span>
            Brand validation auto-corrected {lastValidation.violations.length} token{lastValidation.violations.length !== 1 ? 's' : ''} to match your brand config.
          </span>
        </div>
      )}

      {/* Three-panel workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Page Tree */}
        <div className="w-[200px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
          <PageTree selectedPageId={selectedPageId} onSelect={selectPage} />
        </div>

        {/* Center — Chat / Editor toggle */}
        <div className="w-[320px] min-w-[280px] shrink-0 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200 shrink-0">
            <PanelTab
              active={centerPanel === 'chat'}
              icon={MessageSquare}
              label="Chat"
              onClick={() => setCenterPanel('chat')}
            />
            <PanelTab
              active={centerPanel === 'editor'}
              icon={PenLine}
              label="Editor"
              badge={hasContent ? editor.regions.length : undefined}
              onClick={() => setCenterPanel('editor')}
            />
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {centerPanel === 'chat' ? (
              <ChatInput
                history={history}
                generating={generating}
                error={error}
                onSend={generate}
                pageName={selectedPage?.title ?? 'Page'}
              />
            ) : (
              <EditorPanel
                regions={editor.regions}
                blocks={editor.blocks}
                allowedBlockIds={allowedBlockIds}
                pendingEdits={editor.pendingEdits}
                dirty={editor.dirty}
                activeRegionId={editor.activeRegionId}
                lastViolationCount={editor.lastViolationCount}
                onEdit={editor.editRegion}
                onFocus={editor.setActiveRegionId}
                onCommit={editor.commitEdits}
                onDiscard={editor.discardEdits}
              />
            )}
          </div>
        </div>

        {/* Right — Preview Frame */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <PreviewFrame
            html={selectedPage?.html ?? ''}
            pageTitle={selectedPage?.title ?? 'Page'}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Workspace type selector
// ---------------------------------------------------------------------------

const WORKSPACE_TYPE_LABELS: Record<WorkspaceType, string> = {
  unrestricted: 'All Blocks',
  marketing: 'Marketing',
  product: 'Product',
  internal: 'Internal',
}

function WorkspaceTypeSelector({
  value,
  onChange,
}: {
  value: WorkspaceType
  onChange: (v: WorkspaceType) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as WorkspaceType)}
      className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-300"
      title="Workspace policy — controls which blocks are available"
    >
      {(Object.keys(WORKSPACE_TYPE_LABELS) as WorkspaceType[]).map((wt) => (
        <option key={wt} value={wt}>
          {WORKSPACE_TYPE_LABELS[wt]}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function PanelTab({
  active,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  active: boolean
  icon: typeof MessageSquare
  label: string
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors relative
        ${active
          ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-blue-600'
          : 'text-gray-400 hover:text-gray-600'
        }`}
    >
      <Icon size={13} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-[9px] px-1 py-px rounded-full ${
          active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}
