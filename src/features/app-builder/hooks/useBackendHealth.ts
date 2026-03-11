// ---------------------------------------------------------------------------
// useBackendHealth — polls the SDLC backend health endpoint.
//
// Provides a reactive `status` indicator: connected | degraded | disconnected.
// Polls every 15s when idle, backs off to 30s after errors.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react'
import { sdlcApi } from '../api/sdlcApi'
import type { BackendStatus, HealthResponse } from '../types'

const POLL_OK_MS = 15_000
const POLL_ERR_MS = 30_000

interface BackendHealthState {
  status: BackendStatus
  detail: HealthResponse | null
  lastChecked: string | null
}

export function useBackendHealth() {
  const [state, setState] = useState<BackendHealthState>({
    status: 'checking',
    detail: null,
    lastChecked: null,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const check = useCallback(async () => {
    try {
      const detail = await sdlcApi.checkHealth()
      const status: BackendStatus =
        detail.status === 'ok' ? 'connected' :
        detail.status === 'degraded' ? 'degraded' :
        'disconnected'

      setState({
        status,
        detail,
        lastChecked: new Date().toISOString(),
      })

      timerRef.current = setTimeout(check, POLL_OK_MS)
    } catch {
      setState((prev) => ({
        ...prev,
        status: 'disconnected',
        lastChecked: new Date().toISOString(),
      }))
      timerRef.current = setTimeout(check, POLL_ERR_MS)
    }
  }, [])

  useEffect(() => {
    check()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [check])

  return state
}
