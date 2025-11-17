import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { autoTracer } from '@auto-tracer/plugin-vite-react18'

// Test configuration: ONLY labelHooksPattern (regex matching) - no explicit list
export default defineConfig({
  plugins: [
    react(),
    autoTracer.vite({
      mode: "opt-out",
      // ONLY pattern-based hook labeling - for testing isolation
      labelHooksPattern: '^use[A-Z].*',
      // labelHooks: undefined, // Explicitly disabled for this test
    })
  ],
  server: {
      port: 5184, // Different port for pattern testing
      strictPort: true,
  },
  preview: {
      port: 5184,
      strictPort: true,
  },
})
