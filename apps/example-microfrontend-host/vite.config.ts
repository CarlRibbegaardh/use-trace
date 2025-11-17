import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        remote1: {
          external: 'http://localhost:5191/assets/remoteEntry.js',
          from: 'vite',
          format: 'esm'
        },
        remote2: {
          external: 'http://localhost:5192/assets/remoteEntry.js',
          from: 'vite',
          format: 'esm'
        },
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: 5190,
    strictPort: true,
  },
  preview: {
    port: 5190,
    strictPort: true,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
