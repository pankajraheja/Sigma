// ---------------------------------------------------------------------------
// PreviewFrame — sandboxed iframe preview with viewport switcher.
//
// Renders the selected page's HTML via srcdoc.
// Viewport options: Desktop (100%), Tablet (768px), Mobile (375px).
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Monitor, Tablet, Smartphone } from 'lucide-react'

type Viewport = 'desktop' | 'tablet' | 'mobile'

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const VIEWPORT_ICONS: Record<Viewport, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
}

interface PreviewFrameProps {
  html: string
  pageTitle: string
}

export default function PreviewFrame({ html, pageTitle }: PreviewFrameProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop')

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Preview — {pageTitle}
        </span>

        <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
          {(Object.keys(VIEWPORT_WIDTHS) as Viewport[]).map((vp) => {
            const Icon = VIEWPORT_ICONS[vp]
            const isActive = viewport === vp
            return (
              <button
                key={vp}
                type="button"
                onClick={() => setViewport(vp)}
                className={`p-1 rounded transition-colors ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={vp.charAt(0).toUpperCase() + vp.slice(1)}
              >
                <Icon size={14} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-4">
        {html ? (
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            title={`Preview: ${pageTitle}`}
            className="bg-white border border-gray-200 rounded shadow-sm transition-all duration-200"
            style={{
              width: VIEWPORT_WIDTHS[viewport],
              maxWidth: '100%',
              height: '100%',
              minHeight: '400px',
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Monitor size={24} className="text-gray-300" />
            </div>
            <p className="text-[13px] text-gray-400">No preview yet</p>
            <p className="text-[11px] text-gray-300 mt-1">
              Use the chat panel to generate a page
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
