import { BrowserRouter } from 'react-router-dom'
import AppShell from './app/AppShell'
import HomePage from './pages/Home'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <HomePage />
      </AppShell>
    </BrowserRouter>
  )
}
