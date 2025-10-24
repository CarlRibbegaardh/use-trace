import type { AutoTracerOptions } from "./interfaces/AutoTracerOptions.js";
import { detectUpdatedComponents } from "./functions/detectUpdatedComponents.js";
import { log, logWarn } from "./functions/log.js";
import { deepMergeOptions } from "./functions/deepMerge.js";
import { setTraceOptions } from "./types/globalState.js";
import { defaultAutoTracerOptions } from "./types/defaultSettings.js";
import { validateAutoTracerOptions } from "./functions/validateOptions.js";
import {
  createSafeRenderHook,
  installRenderHook,
  isDevToolsAvailable,
  logDevToolsStatus,
  restoreRenderHook,
} from "./functions/devToolsUtils.js";

// Re-export tracking functions for convenience
export { useTrackRender } from "./functions/renderRegistry.js";

let isAutoTracerActive = false;
let originalOnCommitFiberRoot: unknown = null;
let currentOptions: AutoTracerOptions = { ...defaultAutoTracerOptions };

/**
 * Initialize the autoTracer to capture all React renders including the initial render.
 * Call this before ReactDOM.render() or ReactDOM.createRoot().render() for best results.
 *
 * @param options Configuration options for the tracer
 * @returns Cleanup function to stop tracing
 */
export function autoTracer(options: AutoTracerOptions = {}): () => void {
  // Validate and deep merge with defaults to preserve nested color configurations
  const validatedOptions = validateAutoTracerOptions(options);
  currentOptions = deepMergeOptions(currentOptions, validatedOptions);

  // Update global options
  updateTraceOptions(currentOptions);

  // Early exit if autoTracer is disabled
  if (currentOptions.enabled === false) {
    if (currentOptions.enableAutoTracerInternalsLogging) {
      console.log("AutoTracer: Disabled via enabled: false option");
    }
    return () => {}; // Return no-op cleanup function
  }

  if (isAutoTracerActive) {
    if (currentOptions.enableAutoTracerInternalsLogging) {
      logWarn("AutoTracer is already active. Call stopAutoTracer() first.");
    }
    return stopAutoTracer;
  }

  // Check if React DevTools hook is available
  if (!isDevToolsAvailable()) {
    logDevToolsStatus(currentOptions.enableAutoTracerInternalsLogging ?? false);
    return () => {};
  }

  // Create a safe render hook that handles errors
  const safeRenderHook = createSafeRenderHook(
    (rendererID: number, root: unknown, priorityLevel?: number) => {
      // Call original hook first if it exists
      if (
        originalOnCommitFiberRoot &&
        typeof originalOnCommitFiberRoot === "function"
      ) {
        originalOnCommitFiberRoot(rendererID, root, priorityLevel);
      }

      // Detect and log updated components
      detectUpdatedComponents(root);
    },
    currentOptions.enableAutoTracerInternalsLogging ?? false
  );

  // Install our global render monitor
  originalOnCommitFiberRoot = installRenderHook(safeRenderHook);

  isAutoTracerActive = true;

  if (currentOptions.enableAutoTracerInternalsLogging) {
    log("AutoTracer: Global render monitor initialized");
  }

  return stopAutoTracer;
}

/**
 * Stop the autoTracer and restore the original React DevTools hook
 */
export function stopAutoTracer(): void {
  if (!isAutoTracerActive) return;

  // Restore the original hook
  restoreRenderHook(originalOnCommitFiberRoot);

  isAutoTracerActive = false;
  originalOnCommitFiberRoot = null;

  if (currentOptions.enableAutoTracerInternalsLogging) {
    log("AutoTracer: Global render monitor stopped");
  }
}

/**
 * Check if the autoTracer is currently active
 */
export function isAutoTracerInitialized(): boolean {
  return isAutoTracerActive;
}

/**
 * Update tracing options dynamically
 */
export function updateAutoTracerOptions(
  options: Partial<AutoTracerOptions>
): void {
  const validatedOptions = validateAutoTracerOptions(
    options as AutoTracerOptions
  );
  currentOptions = deepMergeOptions(currentOptions, validatedOptions);
  updateTraceOptions(currentOptions);
}

// Helper function to update the global trace options
function updateTraceOptions(options: AutoTracerOptions): void {
  // Pass the full options object to preserve all nested configurations
  setTraceOptions(options);
}
