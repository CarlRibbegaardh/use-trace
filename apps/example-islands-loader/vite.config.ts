import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5200,
    strictPort: true,
  },
  preview: {
    port: 5200,
    strictPort: true,
  }
})
