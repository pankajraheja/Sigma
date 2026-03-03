import AppProviders from './app/AppProviders'
import AppShell from './app/AppShell'
import AppRoutes from './app/AppRoutes'

export default function App() {
  return (
    <AppProviders>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </AppProviders>
  )
}
