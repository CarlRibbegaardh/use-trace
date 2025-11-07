/**
 * Render tracking registry for definitive component execution detection.
 * Components use useAutoTracer() hook to register themselves with a unique GUID.
 * The tracer can find and match specific component instances via the hidden GUID.
 */

import { useMemo, useRef } from "react";
import type { ComponentLogger } from "../interfaces/ComponentLogger.js";
import { componentLogRegistry } from "./componentLogRegistry.js";
import { addLabelForGuid, clearAllHookLabels } from "./hookLabels.js";
import { log, logWarn } from "./log.js";

// Registry of GUIDs that definitely rendered this cycle
const trackedGUIDs = new Set<string>();

// Counter for generating unique GUIDs
let guidCounter = 0;

/**
 * Hook that registers a component instance for tracking.
 * Each component instance gets a unique GUID stored in a ref.
 * Call this hook to register the component as having executed.
 * Returns a logger that stores messages until the component is rendered by autoTracer.
 *
 * Usage in component:
 * ```tsx
 * function MyComponent() {
 *   const logger = useAutoTracer(); // Call at top of component
 *   logger.log("Hello from MyComponent!");
 *   // ... rest of component logic
 * }
 * ```
 */
export function useAutoTracer(): ComponentLogger {
  const guidRef = useRef<string>();

  // Generate GUID on first render (stable across re-renders)
  if (!guidRef.current) {
    guidRef.current = `render-track-${++guidCounter}-${Date.now()}`;
  }

  // Register this instance as having rendered this cycle
  trackedGUIDs.add(guidRef.current);

  // Create logger that stores messages for this component GUID
  const logger = useMemo<ComponentLogger>(() => {
    return {
      log: (message: string, ...args: unknown[]) => {
        componentLogRegistry.addLog(guidRef.current!, message, ...args);
      },
      /**
       * **Internal API - Not intended for direct developer use**
       *
       * Associates a human-readable label with a state hook for debugging purposes.
       * This method is primarily used by the auto-tracer Vite plugin during build-time
       * AST transformation to automatically label useState/useSelector hooks.
       *
       * While always available at runtime, developers should generally not call this
       * method directly as the Vite plugin handles labeling automatically.
       *
       * @param label Human-readable name for the state hook (e.g., "filteredTodos", "loading")
       *
       * @example
       * ```tsx
       * // Automatically handled by Vite plugin:
       * const todos = useSelector(selectTodos);
       * // Plugin injects: logger.labelState("todos");
       *
       * // Manual usage (not recommended):
       * const [count, setCount] = useState(0);
       * logger.labelState("count");
       * ```
       */
      labelState: (label: string, index: number) => {
        try {
          const guid = guidRef.current!;
          if (typeof index !== "number") {
            throw new Error("AutoTracer: labelState requires an explicit index. Manual mode is unsupported.");
          }
          addLabelForGuid(guid, label, index);
        } catch (error) {
          logWarn(`AutoTracer: Error storing label ${label}:`, error);
        }
      },
    };
  }, []);

  return logger;
}

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
