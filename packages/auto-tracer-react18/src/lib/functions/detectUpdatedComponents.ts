import { clearRenderRegistry } from "./renderRegistry.js";
import { logError, logGroup, logGroupEnd } from "./log.js";
import { buildTreeFromFiber } from "./treeProcessing/building/buildTreeFromFiber.js";
import { applyEmptyNodeFilter } from "./treeProcessing/filtering/applyEmptyNodeFilter.js";
import { renderTree } from "./treeProcessing/rendering/renderTree.js";
import {
  traceOptions,
  incrementRenderCycle,
  getRenderCycleInfo,
} from "../types/globalState.js";

export function detectUpdatedComponents(root: unknown): void {
  try {
    const rootNode = root as { current?: unknown };
    if (!rootNode?.current) return;

    // Increment render cycle counter at the start
    incrementRenderCycle();

    const shouldLogTiming =
      traceOptions.enableAutoTracerInternalsLogging ?? false;
    const totalStartTime = shouldLogTiming ? performance.now() : 0;

    // Step 1: Build tree from fiber
    const buildStartTime = shouldLogTiming ? performance.now() : 0;
    const nodes = buildTreeFromFiber(rootNode.current, 0);
    if (shouldLogTiming) {
      const buildDuration = performance.now() - buildStartTime;
      console.log(`[AutoTracer] Tree building: ${buildDuration.toFixed(2)}ms`);
    }

    // Step 2: Apply filtering based on settings
    const filterStartTime = shouldLogTiming ? performance.now() : 0;
    const filterMode = traceOptions.filterEmptyNodes ?? "none";
    const filterFn = applyEmptyNodeFilter(filterMode);
    const filtered = filterFn(nodes, {
      includeReconciled: traceOptions.includeReconciled ?? "never",
      includeSkipped: traceOptions.includeSkipped ?? "never",
      includeMount: traceOptions.includeMount ?? "never",
      includeRendered: traceOptions.includeRendered ?? "never",
    });
    if (shouldLogTiming) {
      const filterDuration = performance.now() - filterStartTime;
      console.log(
        `[AutoTracer] Filtering (${filterMode}): ${nodes.length} → ${
          filtered.length
        } nodes in ${filterDuration.toFixed(2)}ms`
      );
    }

    // Only open the group if there are nodes to render
    const hasNodesToRender = filtered.length > 0;
    if (hasNodesToRender) {
      const { cycleNumber, filteredCount } = getRenderCycleInfo();
      const cycleLabel =
        filteredCount > 0
          ? `Component render cycle ${cycleNumber} (${filteredCount} filtered):`
          : `Component render cycle ${cycleNumber}:`;
      logGroup(cycleLabel);
    }

    // Step 3: Render the filtered tree
    const renderStartTime = shouldLogTiming ? performance.now() : 0;
    renderTree(filtered);
    if (shouldLogTiming) {
      const renderDuration = performance.now() - renderStartTime;
      console.log(`[AutoTracer] Rendering: ${renderDuration.toFixed(2)}ms`);
    }

    clearRenderRegistry(); // Clear tracked fibers for next cycle

    if (hasNodesToRender) {
      logGroupEnd();
    }

    if (shouldLogTiming) {
      const totalDuration = performance.now() - totalStartTime;
      console.log(
        `[AutoTracer] Total cycle time: ${totalDuration.toFixed(2)}ms`
      );
    }
  } catch (error) {
    logGroupEnd(); // Ensure console group is closed even on error
    logError("AutoTracer: Error during component detection:", error);
    // Clean up state to prevent corruption
    try {
      clearRenderRegistry();
    } catch (cleanupError) {
      logError("AutoTracer: Error during cleanup:", cleanupError);
    }
  }
}
