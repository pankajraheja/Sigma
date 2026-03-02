import { APP_CONFIG } from '../../config/app.config'

export default function Header() {
  return (
    <header className="h-14 bg-primary-900 text-ink-inverse flex items-center px-6 shrink-0 shadow-panel">
      {/* Ribbon accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-ribbon" />

      <span className="text-xs font-semibold tracking-widest uppercase text-ink-inverse/50 mr-2">
        Sigma
      </span>
      <span className="font-bold text-base text-ink-inverse">{APP_CONFIG.name}</span>

      <div className="ml-auto flex items-center gap-4">
        <span className="text-xs text-ink-inverse/40">v{APP_CONFIG.version}</span>
        {/* User / profile controls slot */}
      </div>
    </header>
  )
}
