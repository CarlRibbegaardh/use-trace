import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        remote1: {
          type: 'module',
          name: 'remote1',
          entry: 'http://localhost:5191/remoteEntry.js',
        },
        remote2: {
          type: 'module',
          name: 'remote2',
          entry: 'http://localhost:5192/remoteEntry.js',
        },
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.1'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1'
        },
        '@auto-tracer/react18': {
          singleton: true
        }
      }
    })
  ],
  server: {
    port: 5190,
    strictPort: true,
    origin: 'http://localhost:5190',
  },
  base: 'http://localhost:5190',
  preview: {
    port: 5190,
    strictPort: true,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'esm'
      }
    }
  }
})
