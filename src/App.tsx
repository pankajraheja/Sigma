import AppProviders from './providers/AppProviders'
import AppShell from './components/shell/AppShell'
import HomePage from './features/home/HomePage'

export default function App() {
  return (
    <AppProviders>
      <AppShell>
        <HomePage />
      </AppShell>
    </AppProviders>
  )
}
