// ---------------------------------------------------------------------------
// useSigmaChat — React hook for managing chat state and API communication.
//
// Maintains a local display-level message list. Sends single-turn queries
// to POST /api/chat/query and appends the structured response.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef } from 'react'
import type {
  ChatDisplayMessage,
  ChatContext,
  SigmaChatSkill,
  ChatReference,
} from '../../types'
import { sendChatQuery } from './api/chatApi'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface UseSigmaChatOptions {
  skill: SigmaChatSkill
  context: ChatContext
}

interface UseSigmaChatReturn {
  messages: ChatDisplayMessage[]
  isLoading: boolean
  error: string | null
  /** References from the most recent assistant turn */
  latestReferences: ChatReference[]
  /** Suggestions from the most recent assistant turn */
  latestSuggestions: string[]
  send: (content: string) => Promise<void>
  reset: () => void
}

export function useSigmaChat({ skill, context }: UseSigmaChatOptions): UseSigmaChatReturn {
  const [messages, setMessages] = useState<ChatDisplayMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestReferences, setLatestReferences] = useState<ChatReference[]>([])
  const [latestSuggestions, setLatestSuggestions] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      const userMessage: ChatDisplayMessage = {
        id: uid(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        const response = await sendChatQuery({
          skillKey: skill.key,
          moduleKey: skill.moduleKey,
          message: content.trim(),
          context,
        })

        const assistantMessage: ChatDisplayMessage = {
          id: uid(),
          role: 'assistant',
          content: response.answer,
          timestamp: Date.now(),
          references: response.references,
          suggestions: response.suggestions,
        }

        setMessages((prev) => [...prev, assistantMessage])
        setLatestReferences(response.references)
        setLatestSuggestions(response.suggestions)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Chat request failed'
        setError(msg)

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: `Sorry, I couldn't process that request. ${msg}`,
            timestamp: Date.now(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [skill.key, skill.moduleKey, context],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setIsLoading(false)
    setError(null)
    setLatestReferences([])
    setLatestSuggestions([])
  }, [])

  return { messages, isLoading, error, latestReferences, latestSuggestions, send, reset }
}
