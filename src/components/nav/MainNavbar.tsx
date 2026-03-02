import { APP_CONFIG, MAIN_NAV_ITEMS } from '../../config/app.config'
import NavItem from './NavItem'

// ── Brand mark ─────────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <div className="flex items-center gap-3 pr-5 mr-1 border-r border-border-muted shrink-0">
      {/* Sigma glyph */}
      <div className="w-7 h-7 bg-primary-900 rounded-sm flex items-center justify-center shrink-0 shadow-card">
        <span
          className="text-ink-inverse font-bold text-[15px] leading-none select-none"
          aria-hidden="true"
        >
          Σ
        </span>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none gap-0.5">
        <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-ink-faint">
          Sigma
        </span>
        <span className="text-[12px] font-semibold text-ink leading-none tracking-[-0.01em]">
          {APP_CONFIG.name}
        </span>
      </div>
    </div>
  )
}

// ── MainNavbar ─────────────────────────────────────────────────────────────

interface MainNavbarProps {
  /** Slot for right-side controls (user avatar, notifications, etc.) */
  rightSlot?: React.ReactNode
}

export default function MainNavbar({ rightSlot }: MainNavbarProps) {
  return (
    <nav
      className="sticky top-0 z-40 h-14 bg-surface border-b border-border shadow-card flex items-stretch px-4 shrink-0"
      aria-label="Main navigation"
    >
      <BrandMark />

      {/* Primary nav links */}
      <div className="flex items-stretch overflow-x-auto scrollbar-none ml-1">
        {MAIN_NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} variant="horizontal" />
        ))}
      </div>

      {/* Right-side controls slot */}
      {rightSlot && (
        <div className="ml-auto flex items-center gap-3 pl-4 border-l border-border-muted">
          {rightSlot}
        </div>
      )}
    </nav>
  )
}
