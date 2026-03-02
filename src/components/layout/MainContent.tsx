import type { AppShellProps } from '../../types'

export default function MainContent({ children }: AppShellProps) {
  return (
    <main className="flex-1 bg-surface-raised">
      {children}
    </main>
  )
}
