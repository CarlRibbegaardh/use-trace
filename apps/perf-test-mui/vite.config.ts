import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { autoTracer } from '@auto-tracer/plugin-vite-react18';

export default defineConfig({
  plugins: [
    autoTracer.vite({
      mode: 'opt-out',
      importSource: '@auto-tracer/react18',
      include: ['src/**/*.tsx'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
      labelHooks: [
        'useState',
        'useReducer',
        'useSelector'
      ],
      labelHooksPattern: '^use[A-Z].*'
    }),
    react()
  ],
  server: {
    port: 5200,
    strictPort: true,
  },
  preview: {
    port: 5200,
    strictPort: true,
  },
});
