// ---------------------------------------------------------------------------
// SigmaChatPanel — the core reusable chat UI component.
//
// Renders the chat message list, input box, suggested prompts, asset
// references, and follow-up suggestions. Purely presentational — all
// state management is handled by useSigmaChat.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, RotateCcw, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import type { SigmaChatSkill, ChatContext, ChatDisplayMessage, ChatReference } from '../../types'
import { useSigmaChat } from './useSigmaChat'

export interface SigmaChatPanelProps {
  skill: SigmaChatSkill
  context: ChatContext
  /** Optional extra CSS classes on the outer container */
  className?: string
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatDisplayMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser
            ? 'bg-primary-600 text-ink-inverse rounded-br-sm'
            : 'bg-surface-subtle text-ink border border-border-muted rounded-bl-sm',
        )}
      >
        {/* Render newlines and basic markdown bold */}
        {message.content.split('\n').map((line, i) => (
          <span key={i}>
            {renderLine(line)}
            {i < message.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Simple inline rendering for **bold** text */
function renderLine(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function ReferenceChip({ reference }: { reference: ChatReference }) {
  return (
    <a
      href={reference.href}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-muted
                 bg-surface hover:bg-surface-subtle transition-colors text-[11px] group"
      title={`${reference.name} (${reference.kind})`}
    >
      <ExternalLink
        size={10}
        className="text-primary-500 group-hover:text-primary-600 shrink-0"
      />
      <span className="font-medium text-ink truncate max-w-[180px]">{reference.name}</span>
      <span className="text-ink-faint">{reference.kind}</span>
    </a>
  )
}

function SuggestedPrompts({
  prompts,
  onSelect,
}: {
  prompts: string[]
  onSelect: (prompt: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3">
      <span className="text-[10px] text-ink-faint uppercase tracking-wider font-medium">
        Try asking
      </span>
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onSelect(p)}
          className="text-left text-[12px] text-primary-600 hover:text-primary-700
                     hover:bg-surface-subtle rounded-md px-2.5 py-1.5 transition-colors
                     border border-transparent hover:border-primary-200 cursor-pointer"
        >
          {p}
        </button>
      ))}
    </div>
  )
}

function FollowUpSuggestions({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (s: string) => void
}) {
  if (suggestions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pt-1">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="text-[11px] text-primary-600 hover:text-primary-700
                     bg-primary-50 hover:bg-primary-100 rounded-full px-3 py-1
                     transition-colors cursor-pointer border border-primary-100"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function SigmaChatPanel({
  skill,
  context,
  className,
}: SigmaChatPanelProps) {
  const { messages, isLoading, send, reset } =
    useSigmaChat({ skill, context })
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    send(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div
      className={clsx(
        'flex flex-col bg-surface border border-border rounded-lg shadow-card overflow-hidden',
        className,
      )}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary-50 border border-primary-100">
            <Sparkles size={13} className="text-primary-600" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-ink leading-tight">
              {skill.displayName}
            </h3>
            <p className="text-[10px] text-ink-faint leading-tight">{skill.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          title="Reset conversation"
          className="p-1.5 rounded-md text-ink-faint hover:text-ink hover:bg-surface
                     transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* ── Message area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[480px]">
        {isEmpty && skill.suggestedPrompts && (
          <SuggestedPrompts
            prompts={skill.suggestedPrompts}
            onSelect={(p) => {
              setInput('')
              send(p)
            }}
          />
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <ChatBubble message={msg} />

            {/* Show references after assistant messages */}
            {msg.role === 'assistant' && msg.references && msg.references.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-1">
                {msg.references.map((r) => (
                  <ReferenceChip key={r.id} reference={r} />
                ))}
              </div>
            )}

            {/* Show follow-up suggestions after the latest assistant message */}
            {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
              <FollowUpSuggestions
                suggestions={msg.suggestions}
                onSelect={(s) => {
                  setInput('')
                  send(s)
                }}
              />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-[12px] text-ink-faint px-1">
            <Loader2 size={13} className="animate-spin" />
            <span>Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ────────────────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-2.5 bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-ink-faint shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            disabled={isLoading}
            className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-faint
                       outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-md text-primary-600 hover:bg-primary-50
                       disabled:text-ink-faint disabled:hover:bg-transparent
                       transition-colors cursor-pointer disabled:cursor-default"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
