import { AUTOTRACER_STATE_MARKER } from "../types/marker.js";
import { useMemo, useRef, useState } from "react";
import { isGlobalTracerInstalled, traceOptions } from "../types/globalState.js";
import type { ComponentLogger } from "../interfaces/ComponentLogger.js";
import { componentLogRegistry } from "../functions/componentLogRegistry.js";
import {
  addLabelForGuid,
  clearLabelsForGuid,
} from "../functions/hookLabels.js";
import { logWarn } from "../functions/log.js";
import { registerTrackedGUID } from "../functions/renderRegistry.js";

// One-time guidance log sentinel to prevent repeated messaging
let hasLoggedMissingInitialization = false;

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
  // Anchor to preserve hooks ordering regardless of active/inactive path
  useState(AUTOTRACER_STATE_MARKER);

  const isActive =
    traceOptions.enabled === true && isGlobalTracerInstalled === true;

  // Always call hooks unconditionally to satisfy Rules of Hooks
  const guidRef = useRef<string>();

  // Generate GUID on first render (stable across re-renders)
  if (!guidRef.current) {
    guidRef.current = `render-track-${++guidCounter}-${Date.now()}`;
  }

  // Create logger - always use useMemo to maintain hook call consistency
  // Empty deps array ensures stable logger reference; runtime isActive checks handle state changes
  const logger = useMemo<ComponentLogger>(() => {
    return {
      log: (message: string, ...args: unknown[]) => {
        if (isActive) {
          componentLogRegistry.addLog(
            guidRef.current!,
            "log",
            message,
            ...args
          );
        }
      },
      warn: (message: string, ...args: unknown[]) => {
        if (isActive) {
          componentLogRegistry.addLog(
            guidRef.current!,
            "warn",
            message,
            ...args
          );
        }
      },
      error: (message: string, ...args: unknown[]) => {
        if (isActive) {
          componentLogRegistry.addLog(
            guidRef.current!,
            "error",
            message,
            ...args
          );
        }
      },
      /**
       * **Internal API - Not intended for direct developer use**
       *
       * Associates human-readable label(s) with a state hook for debugging purposes.
       * This method is primarily used by the auto-tracer Vite plugin during build-time
       * AST transformation to automatically label useState/useSelector hooks.
       *
       * While always available at runtime, developers should generally not call this
       * method directly as the Vite plugin handles labeling automatically.
       *
       * @param index Build-time ordinal position (source order)
       * @param nameValuePairs Alternating name-value pairs: "name1", value1, "name2", value2, ...
       *
       * @example
       * ```tsx
       * // Automatically handled by Vite plugin:
       * const todos = useSelector(selectTodos);
       * // Plugin injects: logger.labelState(0, "todos", todos);
       *
       * // For multi-variable hooks:
       * const [count, setCount] = useState(0);
       * // Plugin injects: logger.labelState(0, "count", count, "setCount", setCount);
       * ```
       */
      labelState: (index: number, ...nameValuePairs: unknown[]) => {
        if (!isActive) return;

        try {
          const guid = guidRef.current!;
          if (typeof index !== "number") {
            throw new Error(
              "AutoTracer: labelState requires an explicit index as first argument."
            );
          }
          // On first call (index 0), clear previous labels
          if (index === 0) {
            clearLabelsForGuid(guid);
          }
          // Parse alternating name-value pairs: "name1", value1, "name2", value2, ...
          for (let i = 0; i < nameValuePairs.length; i += 2) {
            const label = nameValuePairs[i];
            const value = nameValuePairs[i + 1];
            if (typeof label === "string") {
              addLabelForGuid(guid, { label, index, value });
            }
          }
        } catch (error) {
          logWarn(
            `AutoTracer: Error storing labels for index ${index}:`,
            error
          );
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conditionally register GUID only when active
  if (isActive) {
    registerTrackedGUID(guidRef.current);
  }

  // Optional one-time guidance when developer intent is enabled but tracer not initialized
  if (
    !isActive &&
    traceOptions.enabled === true &&
    isGlobalTracerInstalled === false &&
    traceOptions.enableAutoTracerInternalsLogging === true &&
    !hasLoggedMissingInitialization
  ) {
    hasLoggedMissingInitialization = true;
    console.info(
      "AutoTracer: useAutoTracer() called while tracer not initialized. Call autoTracer() early in app startup."
    );
  }

  return logger;
}
