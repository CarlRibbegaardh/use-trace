/**
 * Centralized React DevTools access utility
 * Handles all DevTools interactions with proper error handling and safety checks
 */

import type { ReactDevToolsHook } from "../interfaces/ReactDevToolsHook.js";
import { log, logError, logWarn } from "./log.js";

/**
 * Safely gets the React DevTools global hook
 * @returns DevTools hook object or null if not available
 */
export function getDevToolsHook(): ReactDevToolsHook | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || null;
  } catch (error) {
    logWarn("AutoTracer: Error accessing React DevTools hook:", error);
    return null;
  }
}

/**
 * Checks if React DevTools is available
 * @returns True if DevTools hook is available
 */
export function isDevToolsAvailable(): boolean {
  return getDevToolsHook() !== null;
}

/**
 * Safely installs a render hook with error handling
 * @param onCommitFiberRoot - The hook function to install
 * @param originalHook - Optional original hook to preserve
 * @returns The original hook that was replaced, or null
 */
export function installRenderHook(
  onCommitFiberRoot: ReactDevToolsHook["onCommitFiberRoot"],
  originalHook?: unknown
): unknown {
  try {
    const devtools = getDevToolsHook();
    if (!devtools) {
      return null;
    }

    // Store the current hook (might be original or another extension's hook)
    const currentHook = originalHook || devtools.onCommitFiberRoot;

    // Install our hook
    devtools.onCommitFiberRoot = onCommitFiberRoot;

    return currentHook;
  } catch (error) {
    logError("AutoTracer: Error installing render hook:", error);
    return null;
  }
}

/**
 * Safely restores a previous render hook
 * @param originalHook - The original hook to restore
 * @returns True if successfully restored
 */
export function restoreRenderHook(originalHook: unknown): boolean {
  try {
    const devtools = getDevToolsHook();
    if (!devtools) {
      return false;
    }

    // Restore the original hook
    devtools.onCommitFiberRoot =
      originalHook as ReactDevToolsHook["onCommitFiberRoot"];
    return true;
  } catch (error) {
    logError("AutoTracer: Error restoring render hook:", error);
    return false;
  }
}

/**
 * Creates a safe wrapper around a render hook function
 * Ensures that any errors in the hook don't break React's render cycle
 * @param hookFn - The hook function to wrap
 * @param enableAutoTracerInternalsLogging - Whether to log errors
 * @returns Wrapped hook function
 */
export function createSafeRenderHook(
  hookFn: (rendererID: number, root: unknown, priorityLevel?: number) => void,
  enableAutoTracerInternalsLogging: boolean = false
): ReactDevToolsHook["onCommitFiberRoot"] {
  return (rendererID: number, root: unknown, priorityLevel?: number) => {
    try {
      hookFn(rendererID, root, priorityLevel);
    } catch (error) {
      // Never let autoTracer crashes break the user's React app
      if (enableAutoTracerInternalsLogging) {
        logError("AutoTracer: Error in render hook:", error);
      }
      // Continue execution to not break React's render cycle
    }
  };
}

/**
 * Logs DevTools availability status
 * @param enableAutoTracerInternalsLogging - Whether logging is enabled
 */
export function logDevToolsStatus(
  enableAutoTracerInternalsLogging: boolean
): void {
  if (isDevToolsAvailable()) {
    if (enableAutoTracerInternalsLogging) {
      log("AutoTracer: React DevTools detected");
    }
  } else {
    logWarn(
      "AutoTracer: React DevTools not available. To use AutoTracer, either:\r\n" +
        "  1. Install the React DevTools browser extension, OR\r\n" +
        "  2. Use the @auto-tracer/plugin-vite-react18 or @auto-tracer/plugin-babel-react18 plugin\r\n" +
        "Automatic Tracing will not work without one of these options."
    );
  }
}
