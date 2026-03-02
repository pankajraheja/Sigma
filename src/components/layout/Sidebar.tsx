import type { NavItem } from '../../types'

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '#' },
  { label: 'Routes', href: '#' },
  { label: 'Services', href: '#' },
  { label: 'Policies', href: '#' },
  { label: 'Analytics', href: '#' },
  { label: 'Settings', href: '#' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-primary-900 text-ink-inverse flex flex-col shrink-0 border-r border-primary-950">
      <nav className="flex-1 py-3">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm text-ink-inverse/65 hover:text-ink-inverse hover:bg-primary-800 transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
