import type { AppShellProps } from '../data/types'
import TopRibbon from '../components/nav/TopRibbon'
import MainNavbar from '../components/nav/MainNavbar'
import Footer from '../components/layout/Footer'

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
