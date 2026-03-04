// ---------------------------------------------------------------------------
// Sigma Chat — Chat API client
//
// POST /api/chat/query → { answer, references[], suggestions[] }
// ---------------------------------------------------------------------------

import type { ChatQueryRequest, ChatQueryResponse } from '../../../types'

const BASE =
  (import.meta.env['VITE_CHAT_API_URL'] as string | undefined) ??
  'http://localhost:3002/api/chat'

export class ChatApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
  }
}

/**
 * Send a single-turn chat query to the backend.
 * Returns the answer, references, and follow-up suggestions.
 */
export async function sendChatQuery(request: ChatQueryRequest): Promise<ChatQueryResponse> {
  const res = await fetch(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new ChatApiError(body.message ?? res.statusText, res.status)
  }
  return res.json() as Promise<ChatQueryResponse>
}
