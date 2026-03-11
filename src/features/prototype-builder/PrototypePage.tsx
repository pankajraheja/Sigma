// ---------------------------------------------------------------------------
// PrototypePage — three-panel workspace layout for the Prototype Lab.
//
// Layout: PageTree (left) | ChatInput (center) | PreviewFrame (right)
// Composition only — all logic lives in hooks and child components.
// ---------------------------------------------------------------------------

import { PrototypeProvider } from './PrototypeContext'
import PrototypeWorkspace from './components/PrototypeWorkspace'

export default function PrototypePage() {
  return (
    <PrototypeProvider>
      <PrototypeWorkspace />
    </PrototypeProvider>
  )
}
