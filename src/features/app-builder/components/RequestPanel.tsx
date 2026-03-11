// ---------------------------------------------------------------------------
// RequestPanel — project intake form for Solutions Studio.
//
// Left panel: collects project name, description, tech stack preferences,
// and constraints. Triggers pipeline run via onSubmit callback.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Play, Loader2, RotateCcw } from 'lucide-react'
import type { ProjectRequest } from '../types'

interface RequestPanelProps {
  onSubmit: (request: ProjectRequest) => void
  onReset: () => void
  hasRun: boolean
  starting: boolean
  running: boolean
  backendConnected?: boolean
}

export default function RequestPanel({
  onSubmit,
  onReset,
  hasRun,
  starting,
  running,
  backendConnected = true,
}: RequestPanelProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState('')
  const [constraints, setConstraints] = useState('')

  const canSubmit = name.trim().length > 0 && description.trim().length > 0 && !starting && !running && backendConnected

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      techStack: techStack.trim() || undefined,
      constraints: constraints.trim() || undefined,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Project Request
        </span>
        {hasRun && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            title="Start a new run"
          >
            <RotateCcw size={10} />
            New
          </button>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" onKeyDown={handleKeyDown}>
        <FieldGroup label="Project Name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Customer Portal API"
            disabled={running}
            className="w-full text-[12px] px-2.5 py-1.5 rounded border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-50"
          />
        </FieldGroup>

        <FieldGroup label="Description" required>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the application, its purpose, and key features…"
            disabled={running}
            rows={5}
            className="w-full text-[12px] px-2.5 py-1.5 rounded border border-gray-200 bg-white text-gray-700 placeholder-gray-400 resize-y focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-50"
          />
        </FieldGroup>

        <FieldGroup label="Tech Stack" hint="Optional preferences">
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="e.g. Python, FastAPI, PostgreSQL"
            disabled={running}
            className="w-full text-[12px] px-2.5 py-1.5 rounded border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-50"
          />
        </FieldGroup>

        <FieldGroup label="Constraints" hint="Optional requirements">
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="e.g. Must support OAuth2, no external dependencies…"
            disabled={running}
            rows={2}
            className="w-full text-[12px] px-2.5 py-1.5 rounded border border-gray-200 bg-white text-gray-700 placeholder-gray-400 resize-y focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-50"
          />
        </FieldGroup>
      </div>

      {/* Submit */}
      <div className="px-4 py-3 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-800 text-white py-2 text-[13px] font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {starting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Starting Pipeline…
            </>
          ) : running ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Pipeline Running…
            </>
          ) : (
            <>
              <Play size={14} />
              Run Pipeline
            </>
          )}
        </button>
        {!backendConnected ? (
          <p className="mt-1.5 text-[10px] text-red-500 text-center">
            SDLC backend is not reachable
          </p>
        ) : (
          <p className="mt-1.5 text-[10px] text-gray-400 text-center">
            Ctrl+Enter to submit
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field group helper
// ---------------------------------------------------------------------------

function FieldGroup({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-[11px] font-medium text-gray-600">{label}</span>
        {required && <span className="text-[10px] text-red-400">*</span>}
        {hint && <span className="text-[10px] text-gray-400 ml-auto">{hint}</span>}
      </div>
      {children}
    </label>
  )
}
