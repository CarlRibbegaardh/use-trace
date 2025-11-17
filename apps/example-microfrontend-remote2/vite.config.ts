import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import { autoTracer } from '@auto-tracer/plugin-vite-react18'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    autoTracer.vite({
      mode: 'opt-out',
      importSource: '@auto-tracer/react18',
      include: ['src/**/*.tsx'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
      labelHooks: ['useState', 'useReducer'],
      labelHooksPattern: '^use[A-Z].*',
      buildWithWorkspaceLibs: true,
    }),
    react(),
    federation({
      name: 'remote2',
      filename: 'remoteEntry.js',
      manifest: true,
      exposes: {
        './App': './src/App.tsx',
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
    port: 5192,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5192',
  },
  base: 'http://localhost:5192',
  preview: {
    port: 5192,
    strictPort: true,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      output: {
        format: 'esm'
      }
    }
  }
}))
