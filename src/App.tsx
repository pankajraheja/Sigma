import AppProviders from './app/AppProviders'
import AppShell from './app/AppShell'
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
