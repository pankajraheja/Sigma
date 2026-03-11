// ---------------------------------------------------------------------------
// useWorkspace — workspace session state for the Prototype Lab.
//
// Manages: selected page, per-page conversation history, generation loading.
// Calls POST /api/generate and updates PrototypeContext on success.
// Runs client-side brand validation as a safety net before preview.
//
// Key design: selectedPageId is the editing context. All generation targets
// the selected page by capturing its id at call time. Conversations are
// scoped per-page via a Record keyed by page id. Switching pages instantly
// swaps preview + chat history.
//
// Intent layer: Before calling the API, the prompt is classified into one of:
//   update_page   — edit an existing page (selected or named/ordered)
//   create_page   — add a single new page to the workspace
//   create_multi  — add multiple new pages (delegated to backend)
// The intent determines what gets sent to the API and how the response
// mutates workspace state. See lib/intent.ts for classification logic.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { usePrototype } from '../PrototypeContext'
import { useBrand } from '../../brand/BrandContext'
import { validateBrandHtml, toBrandValidationConfig, type BrandViolation } from '../../../lib/brand-validation'
import { interpretIntent, type IntentAction } from '../lib/intent'
import { resolveAllowedBlockIds, inferPageType, type WorkspaceType } from '../lib/workspace-policy'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GeneratedPageResponse {
  title: string
  route: string
  html: string
  brandValidation?: { wasModified: boolean; violations: BrandViolation[] }
}

interface GenerateResponse {
  html: string
  brandValidation?: { wasModified: boolean; violations: BrandViolation[] }
  /** Present when the prompt triggered multi-page generation */
  pages?: GeneratedPageResponse[]
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWorkspace() {
  const { pages, addPage, updatePage } = usePrototype()
  const { currentBrand } = useBrand()

  const [selectedPageId, setSelectedPageId] = useState<string>('home')
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({})
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastValidation, setLastValidation] = useState<GenerateResponse['brandValidation'] | null>(null)
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('unrestricted')
  const abortRef = useRef<AbortController | null>(null)
  const initRef = useRef(false)

  // ── Seed the Home page once on mount (not during render) ────────────────
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    if (pages.length === 0) {
      addPage({
        id: 'home',
        route: '/',
        title: 'Home',
        description: 'Landing page',
        html: '',
        updatedAt: new Date().toISOString(),
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive selected page from current pages array ───────────────────────
  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? pages[0] ?? null

  // If selectedPageId points to a deleted page, fall back to first page
  useEffect(() => {
    if (pages.length > 0 && !pages.find((p) => p.id === selectedPageId)) {
      setSelectedPageId(pages[0].id)
    }
  }, [pages, selectedPageId])

  // ── Resolve allowed blocks for the current context ─────────────────────
  const allowedBlockIds = useMemo(() => {
    const pageType = selectedPage
      ? inferPageType(selectedPage.route, selectedPage.title)
      : undefined
    return resolveAllowedBlockIds({ workspaceType, pageType })
  }, [workspaceType, selectedPage])

  // Per-page conversation history
  const history = conversations[selectedPageId] ?? []

  const selectPage = useCallback((id: string) => {
    setSelectedPageId(id)
    setError(null)
    setLastValidation(null)
  }, [])

  // ── Refs to avoid stale closures in generate ────────────────────────────
  const selectedPageRef = useRef(selectedPage)
  selectedPageRef.current = selectedPage

  const conversationsRef = useRef(conversations)
  conversationsRef.current = conversations

  const pagesRef = useRef(pages)
  pagesRef.current = pages

  const allowedBlockIdsRef = useRef(allowedBlockIds)
  allowedBlockIdsRef.current = allowedBlockIds

  const generate = useCallback(
    async (prompt: string) => {
      const currentPages = pagesRef.current
      const page = selectedPageRef.current
      if (!currentBrand || !page) return

      // ── Interpret intent ──────────────────────────────────────────────
      const intent = interpretIntent({
        prompt,
        selectedPageId: page.id,
        pages: currentPages,
      })

      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setGenerating(true)
      setError(null)
      setLastValidation(null)

      // Conversation is always attached to the currently selected page
      const conversationPageId = page.id
      const pageHistory = conversationsRef.current[conversationPageId] ?? []
      const updatedHistory: ChatMessage[] = [...pageHistory, { role: 'user', content: prompt }]
      setConversations((prev) => ({ ...prev, [conversationPageId]: updatedHistory }))

      try {
        // ── Build request body based on intent ────────────────────────
        const body = buildRequestBody(intent, prompt, pageHistory, currentBrand, currentPages, allowedBlockIdsRef.current)

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { message?: string }
          throw new Error(errBody.message ?? `Generation failed (${res.status})`)
        }

        const data = (await res.json()) as GenerateResponse
        const validationConfig = toBrandValidationConfig(currentBrand)

        // ── Apply result based on intent type ─────────────────────────
        const assistantMsg = applyResult(
          intent,
          data,
          validationConfig,
          pagesRef.current,
          updatePage,
          addPage,
          setSelectedPageId,
          setLastValidation,
        )

        // Append assistant message to conversation
        setConversations((prev) => ({
          ...prev,
          [conversationPageId]: [...updatedHistory, { role: 'assistant', content: assistantMsg }],
        }))
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const msg = err instanceof Error ? err.message : 'Generation failed'
        setError(msg)
        // Roll back optimistic user message
        setConversations((prev) => ({ ...prev, [conversationPageId]: pageHistory }))
      } finally {
        setGenerating(false)
      }
    },
    [currentBrand, updatePage, addPage],
  )

  return {
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
  }
}

// ---------------------------------------------------------------------------
// Build request body — intent determines what goes to the API
// ---------------------------------------------------------------------------

function buildRequestBody(
  intent: IntentAction,
  prompt: string,
  pageHistory: ChatMessage[],
  brandConfig: Record<string, unknown>,
  pages: Array<{ id: string; html: string }>,
  allowedBlockIds: string[] | null,
): Record<string, unknown> {
  const blockFilter = allowedBlockIds ? { allowedBlockIds } : {}

  switch (intent.type) {
    case 'update_page': {
      const targetPage = pages.find((p) => p.id === intent.targetPageId)
      return {
        prompt,
        conversationHistory: pageHistory,
        brandConfig,
        currentPageCode: intent.sendCurrentCode ? (targetPage?.html || undefined) : undefined,
        ...blockFilter,
      }
    }

    case 'create_page':
      return {
        prompt,
        conversationHistory: [],
        brandConfig,
        ...blockFilter,
      }

    case 'create_multi':
      return {
        prompt,
        conversationHistory: [],
        brandConfig,
        ...blockFilter,
      }
  }
}

// ---------------------------------------------------------------------------
// Apply generation result — intent determines how state is mutated
// ---------------------------------------------------------------------------

function applyResult(
  intent: IntentAction,
  data: GenerateResponse,
  validationConfig: ReturnType<typeof toBrandValidationConfig>,
  currentPages: Array<{ id: string; route: string; title: string; html: string }>,
  updatePage: (id: string, html: string) => void,
  addPage: (page: { id: string; route: string; title: string; description: string; html: string; updatedAt: string }) => void,
  setSelectedPageId: (id: string) => void,
  setLastValidation: (v: { wasModified: boolean; violations: BrandViolation[] } | null) => void,
): string {
  switch (intent.type) {
    case 'update_page':
      return applySinglePageResult(intent.targetPageId, data, validationConfig, updatePage, setLastValidation)

    case 'create_page':
      return applyCreatePageResult(intent, data, validationConfig, currentPages, addPage, setSelectedPageId, setLastValidation)

    case 'create_multi':
      return applyMultiPageResult(data, validationConfig, currentPages, updatePage, addPage, setSelectedPageId, setLastValidation)
  }
}

/** Update an existing page with the generated HTML */
function applySinglePageResult(
  targetPageId: string,
  data: GenerateResponse,
  validationConfig: ReturnType<typeof toBrandValidationConfig>,
  updatePage: (id: string, html: string) => void,
  setLastValidation: (v: { wasModified: boolean; violations: BrandViolation[] } | null) => void,
): string {
  let html = data.html
  const cv = validateBrandHtml(html, validationConfig)
  html = cv.html

  const serverV = data.brandValidation?.violations ?? []
  const allViolations = [...serverV, ...cv.violations]
  const wasModified = (data.brandValidation?.wasModified ?? false) || cv.wasModified

  if (allViolations.length > 0) {
    setLastValidation({ wasModified, violations: allViolations })
  }

  updatePage(targetPageId, html)
  return 'Page updated'
}

/** Create a new page with the generated HTML */
function applyCreatePageResult(
  intent: Extract<IntentAction, { type: 'create_page' }>,
  data: GenerateResponse,
  validationConfig: ReturnType<typeof toBrandValidationConfig>,
  currentPages: Array<{ id: string; route: string }>,
  addPage: (page: { id: string; route: string; title: string; description: string; html: string; updatedAt: string }) => void,
  setSelectedPageId: (id: string) => void,
  setLastValidation: (v: { wasModified: boolean; violations: BrandViolation[] } | null) => void,
): string {
  let html = data.html
  const cv = validateBrandHtml(html, validationConfig)
  html = cv.html

  const serverV = data.brandValidation?.violations ?? []
  const allViolations = [...serverV, ...cv.violations]
  const wasModified = (data.brandValidation?.wasModified ?? false) || cv.wasModified

  if (allViolations.length > 0) {
    setLastValidation({ wasModified, violations: allViolations })
  }

  // If a page with the same route exists, append a suffix to avoid collision.
  // (The intent layer normally returns update_page in this case, so this is
  // a safety fallback that should rarely trigger.)
  const existing = currentPages.find((p) => p.route === intent.route)
  const suffix = existing ? `-${Date.now().toString(36).slice(-3)}` : ''

  const newId = `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  addPage({
    id: newId,
    route: intent.route + suffix,
    title: intent.title,
    description: `${intent.title} page`,
    html,
    updatedAt: new Date().toISOString(),
  })
  setSelectedPageId(newId)

  return `Created ${intent.title} page`
}

/** Handle multi-page response from the backend */
function applyMultiPageResult(
  data: GenerateResponse,
  validationConfig: ReturnType<typeof toBrandValidationConfig>,
  currentPages: Array<{ id: string; route: string; title: string }>,
  updatePage: (id: string, html: string) => void,
  addPage: (page: { id: string; route: string; title: string; description: string; html: string; updatedAt: string }) => void,
  setSelectedPageId: (id: string) => void,
  setLastValidation: (v: { wasModified: boolean; violations: BrandViolation[] } | null) => void,
): string {
  // If backend returned multi-page payload
  if (data.pages && data.pages.length > 0) {
    let allViolations: BrandViolation[] = []
    let anyModified = false
    const pageIds: string[] = []

    for (const pg of data.pages) {
      const cv = validateBrandHtml(pg.html, validationConfig)
      const html = cv.html

      const serverV = pg.brandValidation?.violations ?? []
      allViolations = [...allViolations, ...serverV, ...cv.violations]
      anyModified = anyModified || (pg.brandValidation?.wasModified ?? false) || cv.wasModified

      // Update existing page with same route, or create new
      const existing = currentPages.find((p) => p.route === pg.route)
      if (existing) {
        updatePage(existing.id, html)
        pageIds.push(existing.id)
      } else {
        const newId = `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        addPage({
          id: newId,
          route: pg.route,
          title: pg.title,
          description: `${pg.title} page`,
          html,
          updatedAt: new Date().toISOString(),
        })
        pageIds.push(newId)
      }
    }

    if (allViolations.length > 0) {
      setLastValidation({ wasModified: anyModified, violations: allViolations })
    }

    // Select the first generated page
    if (pageIds[0]) {
      setSelectedPageId(pageIds[0])
    }

    return `Generated ${data.pages.length} pages: ${data.pages.map((p) => p.title).join(', ')}`
  }

  // Fallback — single page in a multi-page intent (shouldn't happen normally)
  let html = data.html
  const cv = validateBrandHtml(html, validationConfig)
  html = cv.html

  const newId = `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  addPage({
    id: newId,
    route: `/page-${newId.slice(-4)}`,
    title: 'Generated Page',
    description: 'Generated page',
    html,
    updatedAt: new Date().toISOString(),
  })
  setSelectedPageId(newId)
  return 'Generated page'
}
