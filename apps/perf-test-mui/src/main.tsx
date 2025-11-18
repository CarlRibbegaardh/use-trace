import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { autoTracer } from '@auto-tracer/react18';
import { App } from './App';

/**
 * Initialize AutoTracer before React renders
 */
autoTracer({
  enabled: true
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
