<p align="center">
  <a aria-label="npm version" href="https://www.npmjs.com/package/auto-tracer">
    <img alt="" src="https://badgen.net/npm/v/auto-tracer">
  </a>
  <a aria-label="npm types" href="https://www.npmjs.com/package/auto-tracer">
    <img alt="" src="https://badgen.net/npm/types/auto-tracer">
  </a>
</p>

# autoTracer

## Tracing Library to understand state changes

This library is built to help understanding state changes triggering rerenders.
The gihub project contains an example project using the library.

# AutoTracer Usage Examples

## Basic Usage

### In main.tsx (before React rendering):

```typescript
import { autoTracer } from "auto-tracer";
import { createRoot } from "react-dom/client";
import App from "./App";

// Initialize autoTracer BEFORE React starts rendering
// This captures the initial render and all subsequent renders
const stopTracing = autoTracer();

const root = createRoot(document.getElementById("root")!);
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
  skipNonTrackedBranches: true, // Skip non-tracked branches (default: true)
});
```

### Dynamic Options Update:

```typescript
import { updateAutoTracerOptions } from "auto-tracer";

// Change options while tracing is active
updateAutoTracerOptions({ showFlags: true });
```

### Check Status:

```typescript
import { isAutoTracerInitialized } from "auto-tracer";

if (isAutoTracerInitialized()) {
  console.log("AutoTracer is active");
}
```
