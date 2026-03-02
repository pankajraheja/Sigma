import type { AppShellProps } from '../types'
import TopRibbon from '../components/shell/TopRibbon'
import MainNavbar from '../components/shell/MainNavbar'
import Footer from '../components/shell/Footer'

export default function AppShell({ children }: AppShellProps) {
  return (
    // min-h-screen + document scroll: content grows naturally,
    // footer sits after all page sections, sticky MainNavbar works from root.
    <div className="flex flex-col min-h-screen">
      <TopRibbon />
      <MainNavbar />
      <main className="flex-1 bg-surface-raised">
        {children}
      </main>
      <Footer />
    </div>
  )
}
