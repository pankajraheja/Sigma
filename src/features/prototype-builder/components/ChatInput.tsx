// ---------------------------------------------------------------------------
// ChatInput — prompt textarea with send button for the Prototype Lab.
//
// Displays conversation history and a textarea for new prompts.
// Calls onSend(prompt) which triggers generation via useWorkspace.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import type { ChatMessage } from '../hooks/useWorkspace'

interface ChatInputProps {
  history: ChatMessage[]
  generating: boolean
  error: string | null
  onSend: (prompt: string) => void
  pageName: string
}

export default function ChatInput({ history, generating, error, onSend, pageName }: ChatInputProps) {
  const [prompt, setPrompt] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll conversation to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history.length, generating])

  function handleSubmit() {
    const text = prompt.trim()
    if (!text || generating) return
    onSend(text)
    setPrompt('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <Sparkles size={13} className="text-blue-500" />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Generate — {pageName}
        </span>
      </div>

      {/* Conversation history */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {history.length === 0 && !generating && (
          <p className="text-[12px] text-gray-400 italic pt-4 text-center">
            Describe the page you want to generate.
          </p>
        )}

        {history.map((msg, i) => (
          <div
            key={i}
            className={`text-[12px] rounded-md px-2.5 py-1.5 max-w-[90%] ${
              msg.role === 'user'
                ? 'bg-blue-50 text-blue-800 ml-auto'
                : 'bg-gray-50 text-gray-600'
            }`}
          >
            {msg.role === 'user' ? (
              msg.content
            ) : msg.content.startsWith('Generated ') ? (
              <span className="text-gray-400 italic">{msg.content} ✓</span>
            ) : (
              <span className="text-gray-400 italic">HTML generated ✓</span>
            )}
          </div>
        ))}

        {generating && (
          <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
            <Loader2 size={12} className="animate-spin" />
            <span>Generating…</span>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-3 mb-1 flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 rounded px-2 py-1">
          <AlertCircle size={11} />
          <span>{error}</span>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the page…"
            disabled={generating}
            rows={2}
            className="flex-1 resize-none rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!prompt.trim() || generating}
            className="shrink-0 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-gray-400">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
