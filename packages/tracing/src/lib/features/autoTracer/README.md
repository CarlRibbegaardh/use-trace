# AutoTracer Usage Examples

## Basic Usage

### In main.tsx (before React rendering):

```typescript
import { autoTracer } from 'use-trace';
import { createRoot } from 'react-dom/client';
import App from './App';

// Initialize autoTracer BEFORE React starts rendering
// This captures the initial render and all subsequent renders
const stopTracing = autoTracer();

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// Optional: Stop tracing when done (e.g., in cleanup)
// stopTracing();
```

### With Options:

```typescript
const stopTracing = autoTracer({
  enabled: true, // Enable/disable the entire autoTracer (default: true)
  includeReconciled: false, // Hide reconciled components (default: false)
  includeSkipped: false, // Hide skipped renders (default: false)
  showFlags: false, // Hide React internal flags (default: false)
  enableAutoTracerInternalsLogging: true, // Enable console logging (default: false)
  maxFiberDepth: 100, // Maximum traversal depth (default: 100, range: 20-1000)
  showFunctionContentOnChange: false, // Show full function content vs "* function changed *" (default: false)
});
```

### Dynamic Options Update:

```typescript
import { updateAutoTracerOptions } from "use-trace";

// Change options while tracing is active
updateAutoTracerOptions({ showFlags: true });
```

### Check Status:

```typescript
import { isAutoTracerInitialized } from "use-trace";

if (isAutoTracerInitialized()) {
  console.log("AutoTracer is active");
}
```
