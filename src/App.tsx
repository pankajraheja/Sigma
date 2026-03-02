import { BrowserRouter } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import HomePage from './features/home/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <HomePage />
      </AppShell>
    </BrowserRouter>
  )
}
