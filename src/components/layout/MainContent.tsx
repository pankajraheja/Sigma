import type { AppShellProps } from '../../data/types'

export default function MainContent({ children }: AppShellProps) {
  return (
    <main className="flex-1 bg-surface-raised">
      {children}
    </main>
  )
}
