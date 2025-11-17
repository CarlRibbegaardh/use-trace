/**
 * Render tracking registry for definitive component execution detection.
 * Components use useAutoTracer() hook to register themselves with a unique GUID.
 * The tracer can find and match specific component instances via the hidden GUID.
 */

import { componentLogRegistry } from "./componentLogRegistry.js";
import { clearAllHookLabels } from "./hookLabels.js";

// Registry of GUIDs that definitely rendered this cycle
const trackedGUIDs = new Set<string>();

/**
 * Get the tracking GUID for a fiber if it was registered as having rendered this cycle.
 * Searches the fiber's memoizedState for a useRef with our GUID.
 * @returns The GUID string if tracked, null if not tracked
 */
export function getTrackingGUID(fiber: unknown): string | null {
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
        return refValue;
      }
    }

    hook = hook.next as { memoizedState?: unknown; next?: unknown } | null;
  }

  return null;
}

/**
 * Clear the registry for the next render cycle
 */
export function clearRenderRegistry(): void {
  trackedGUIDs.clear();
  componentLogRegistry.clear();
  clearAllHookLabels(); // Clear labels to prevent accumulation across render cycles
}

/**
 * Get all tracked GUIDs (for debugging)
 */
export function getTrackedGUIDs(): Set<string> {
  return new Set(trackedGUIDs);
}

/**
 * Register a GUID for testing purposes.
 * This allows tests to simulate tracked components without using the useAutoTracer hook.
 * @internal
 */
export function registerTrackedGUID(guid: string): void {
  trackedGUIDs.add(guid);
}
