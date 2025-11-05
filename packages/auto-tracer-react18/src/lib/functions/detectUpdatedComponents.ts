import {
  resetDepthTracking,
  walkFiberForUpdates,
} from "./walkFiberForUpdates.js";
import { clearRenderRegistry } from "./renderRegistry.js";
import { logError, logGroup, logGroupEnd } from "./log.js";

export function detectUpdatedComponents(root: unknown): void {
  try {
    const rootNode = root as { current?: unknown };
    if (!rootNode?.current) return;

    logGroup("Component render cycle:");
    resetDepthTracking(); // Reset depth tracking for each render cycle
    walkFiberForUpdates(rootNode.current, 0);
    clearRenderRegistry(); // Clear tracked fibers for next cycle
    logGroupEnd();
  } catch (error) {
    logGroupEnd(); // Ensure console group is closed even on error
    logError("AutoTracer: Error during component detection:", error);
    // Clean up state to prevent corruption
    try {
      clearRenderRegistry();
      resetDepthTracking();
    } catch (cleanupError) {
      logError("AutoTracer: Error during cleanup:", cleanupError);
    }
  }
}
