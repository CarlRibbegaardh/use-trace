import { createRoot } from 'react-dom/client'
import { autoTracer } from '@auto-tracer/react18'
import App from './App.tsx'
import './index.css'

export function mount(elementId: string) {
  // Initialize this island's own AutoTracer instance
  autoTracer({
    enabled: true,
    enableAutoTracerInternalsLogging: false,
    includeNonTrackedBranches: false
  })

  const container = document.getElementById(elementId)
  if (!container) {
    console.error(`Island1: Container element #${elementId} not found`)
    return
  }

  const root = createRoot(container)
  root.render(<App />)
}
