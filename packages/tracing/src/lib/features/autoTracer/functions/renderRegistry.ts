/**
 * Render tracking registry for definitive component execution detection.
 * Components use useTrackRender() hook to register themselves with a unique GUID.
 * The tracer can find and match specific component instances via the hidden GUID.
 */

import { useRef } from "react";

// Registry of GUIDs that definitely rendered this cycle
const trackedGUIDs = new Set<string>();

// Counter for generating unique GUIDs
let guidCounter = 0;

/**
 * Hook that registers a component instance for tracking.
 * Each component instance gets a unique GUID stored in a ref.
 * Call this hook to register the component as having executed.
 *
 * Usage in component:
 * ```tsx
 * function MyComponent() {
 *   useTrackRender(); // Call at top of component
 *   // ... rest of component logic
 * }
 * ```
 */
export function useTrackRender(): void {
  const guidRef = useRef<string>();

  // Generate GUID on first render (stable across re-renders)
  if (!guidRef.current) {
    guidRef.current = `render-track-${++guidCounter}-${Date.now()}`;
  }

  // Register this instance as having rendered this cycle
  trackedGUIDs.add(guidRef.current);
}

/**
 * Legacy function that tries to determine component from stack trace.
 * Kept for backward compatibility, but useTrackRender() is preferred.
 */
export function trackRender(): void {
  // Fallback to stack-based approach for non-hook usage
  const stack = new Error().stack;
  if (!stack) return;

  const lines = stack.split("\n");
  for (const line of lines) {
    const match =
      line.match(/at\s+([A-Z][a-zA-Z0-9]*)\s*\(/) ||
      line.match(/([A-Z][a-zA-Z0-9]*)@/);

    if (match?.[1]) {
      const componentName = match[1];
      if (
        !componentName.startsWith("render") &&
        !componentName.startsWith("update") &&
        !componentName.startsWith("begin") &&
        !componentName.startsWith("commit") &&
        componentName !== "Object" &&
        componentName !== "Function"
      ) {
        // Use component name + stack line as pseudo-GUID
        const pseudoGUID = `legacy-${componentName}-${line.trim()}`;
        trackedGUIDs.add(pseudoGUID);
        return;
      }
    }
  }
}

/**
 * Check if a fiber was registered as having rendered this cycle.
 * Searches the fiber's memoizedState for a useRef with our GUID.
 */
export function wasTracked(fiber: unknown): boolean {
  const fiberNode = fiber as { memoizedState?: unknown };

  // Walk the hooks chain to find our tracking ref
  let hook = fiberNode.memoizedState as {
    memoizedState?: unknown;
    next?: unknown;
  } | null;

  while (hook) {
    const hookState = hook.memoizedState;

    // Check if this is a ref hook with our GUID pattern
    if (
      hookState &&
      typeof hookState === "object" &&
      "current" in hookState &&
      typeof (hookState as { current: unknown }).current === "string"
    ) {
      const refValue = (hookState as { current: string }).current;

      // Check if this ref contains one of our tracked GUIDs
      if (refValue.startsWith("render-track-") && trackedGUIDs.has(refValue)) {
        return true;
      }
    }

    hook = hook.next as { memoizedState?: unknown; next?: unknown } | null;
  }

  return false;
}

/**
 * Clear the registry for the next render cycle
 */
export function clearRenderRegistry(): void {
  trackedGUIDs.clear();
}

/**
 * Get all tracked GUIDs (for debugging)
 */
export function getTrackedGUIDs(): Set<string> {
  return new Set(trackedGUIDs);
}
