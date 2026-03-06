// ---------------------------------------------------------------------------
// SigmaChatSearchBox — Prominent centered AI chat search input.
//
// Designed to be placed front-and-center on discovery pages, giving users
// a Google-search-style entry point into the AI chat system. When a query
// is sent the conversation expands inline below the input.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  ExternalLink,
  RotateCcw,
  MessageSquare,
} from 'lucide-react'
import clsx from 'clsx'
import type { SigmaChatSkill, ChatContext, ChatDisplayMessage, ChatReference } from '../../types'
import { useSigmaChat } from './useSigmaChat'

export interface SigmaChatSearchBoxProps {
  skill: SigmaChatSkill
  context: ChatContext
  className?: string
}

// ── Tiny sub-components ─────────────────────────────────────────────────────

function InlineBubble({ message }: { message: ChatDisplayMessage }) {
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

function renderLine(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function InlineReference({ reference }: { reference: ChatReference }) {
  return (
    <a
      href={reference.href}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-muted
                 bg-surface hover:bg-surface-subtle transition-colors text-[11px] group"
      title={`${reference.name} (${reference.kind})`}
    >
      <ExternalLink size={10} className="text-primary-500 group-hover:text-primary-600 shrink-0" />
      <span className="font-medium text-ink truncate max-w-[200px]">{reference.name}</span>
      <span className="text-ink-faint">{reference.kind}</span>
    </a>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function SigmaChatSearchBox({
  skill,
  context,
  className,
}: SigmaChatSearchBoxProps) {
  const { messages, isLoading, send, reset } = useSigmaChat({ skill, context })
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const hasConversation = messages.length > 0

  // Auto-scroll when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSend() {
    if (!input.trim() || isLoading) return
    send(input.trim())
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleReset() {
    reset()
    setInput('')
    inputRef.current?.focus()
  }

  function handleSuggestion(prompt: string) {
    setInput('')
    send(prompt)
  }

  return (
    <div className={clsx('w-full', className)}>
      {/* ── Hero area ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 mb-4">
          <Sparkles size={13} className="text-primary-600" strokeWidth={2} />
          <span className="text-[12px] font-semibold text-primary-700 tracking-wide">
            {skill.displayName}
          </span>
        </div>

        <p className="text-[13px] text-ink-muted max-w-lg leading-relaxed">
          {skill.description}
        </p>
      </div>

      {/* ── Search input ───────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <div
            className={clsx(
              'flex items-center gap-3 px-5 py-3.5 rounded-xl border bg-surface shadow-sm transition-all',
              'focus-within:ring-2 focus-within:ring-primary-400/40 focus-within:border-primary-400',
              hasConversation
                ? 'border-primary-300 shadow-md'
                : 'border-border hover:border-primary-300 hover:shadow-md',
            )}
          >
            <MessageSquare
              size={18}
              className="text-primary-500 shrink-0"
              strokeWidth={1.8}
            />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about catalog assets — search, compare, discover…"
              disabled={isLoading}
              className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-faint
                         outline-none disabled:opacity-50"
            />

            {hasConversation && (
              <button
                type="button"
                onClick={handleReset}
                title="New conversation"
                className="p-1.5 rounded-md text-ink-faint hover:text-primary-600 hover:bg-primary-50
                           transition-colors cursor-pointer"
              >
                <RotateCcw size={14} strokeWidth={2} />
              </button>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700
                         disabled:bg-surface-subtle disabled:text-ink-faint
                         transition-colors cursor-pointer disabled:cursor-default"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>

        {/* ── Suggested prompts (only before first message) ────────── */}
        {!hasConversation && skill.suggestedPrompts && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {skill.suggestedPrompts.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSuggestion(prompt)}
                className="text-[12px] text-ink-muted hover:text-primary-700 border border-border
                           hover:border-primary-300 rounded-lg px-3 py-1.5 transition-colors
                           hover:bg-primary-50 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* ── Inline conversation ──────────────────────────────────── */}
        {hasConversation && (
          <div className="mt-4 rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="max-h-[420px] overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <InlineBubble message={msg} />

                  {msg.role === 'assistant' && msg.references && msg.references.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {msg.references.map((r) => (
                        <InlineReference key={r.id} reference={r} />
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestion(s)}
                          className="text-[11px] text-primary-600 hover:text-primary-700
                                     border border-primary-200 hover:border-primary-300
                                     rounded-md px-2 py-1 transition-colors hover:bg-primary-50
                                     cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
