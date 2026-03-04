// ---------------------------------------------------------------------------
// SigmaChatDrawer — slide-over drawer that wraps SigmaChatPanel.
//
// A launcher button (FAB) toggles the drawer open/closed. The drawer is
// positioned at the bottom-right of the viewport.
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react'
import { MessageSquare, X } from 'lucide-react'
import clsx from 'clsx'
import type { SigmaChatSkill, ChatContext } from '../../types'
import SigmaChatPanel from './SigmaChatPanel'

export interface SigmaChatDrawerProps {
  skill: SigmaChatSkill
  context: ChatContext
}

export default function SigmaChatDrawer({ skill, context }: SigmaChatDrawerProps) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  return (
    <>
      {/* ── Drawer panel ────────────────────────────────────────────── */}
      <div
        className={clsx(
          'fixed bottom-20 right-5 z-50 w-[380px] transition-all duration-200',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none',
        )}
      >
        <SigmaChatPanel
          skill={skill}
          context={context}
          className="h-[540px] shadow-xl"
        />
      </div>

      {/* ── Launcher FAB ────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        title={open ? 'Close Sigma Chat' : 'Open Sigma Chat'}
        className={clsx(
          'fixed bottom-5 right-5 z-50',
          'flex items-center justify-center w-12 h-12 rounded-full shadow-lg',
          'transition-all duration-200 cursor-pointer',
          open
            ? 'bg-ink text-ink-inverse hover:bg-ink/90'
            : 'bg-primary-600 text-ink-inverse hover:bg-primary-700',
        )}
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </>
  )
}
