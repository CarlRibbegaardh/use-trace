import type { TreeRenderer } from "../types/TreeRenderer.js";
import type { TreeNode } from "../../types/TreeNode.js";
import { log, logGroupEnd } from "../../../log.js";
import { traceOptions } from "../../../../types/globalState.js";
import { renderNodeDetails } from "../renderNodeDetails.js";
import { shouldRenderNode } from "./shouldRenderNode.js";
import { hasChildNodes } from "./hasChildNodes.js";
import { shouldGroupNode } from "./shouldGroupNode.js";
import { createLogDispatch } from "./createLogDispatch.js";
import { computeCloseCount } from "./computeCloseCount.js";

/**
 * Creates a console group renderer.
 * Orchestrates pure rendering logic with explicit dependencies.
 *
 * This renderer uses the browser's native `console.group()` API to create
 * a collapsible, interactive tree structure.
 *
 * Strategy: "Components as Groups"
 * - Components with children are rendered as groups (`console.group`).
 * - Leaf components are rendered as logs (`console.log`).
 * - Markers (collapsed empty levels) are skipped when internals logging is off,
 *   allowing the next visible component to nest directly under the parent.
 *
 * @returns A functional TreeRenderer
 */
export const createConsoleGroupRenderer = (): TreeRenderer => {
  return (nodes: readonly TreeNode[]) => {
    // Read global state once at entry point
    const enableInternals = traceOptions.enableAutoTracerInternalsLogging ?? false;
    const showFlags = traceOptions.showFlags ?? false;

    const depthStack: number[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (!node) {
        continue;
      }

      // 1. Skip markers when internals logging is disabled
      if (!shouldRenderNode(node, enableInternals)) {
        continue;
      }

      // 2. Handle Marker logging when enabled
      if (node.renderType === "Marker" && enableInternals) {
        const nextNode = nodes[i + 1];
        const nextNodeDepth = nextNode?.depth ?? node.depth;
        const filteredCount = node.filteredNodeCount ?? 0;
        log(
          `... (Level: ${nextNodeDepth}, Filtered nodes: ${filteredCount})`
        );
        continue;
      }

      // 3. Close groups when traversing up or across
      const closeCount = computeCloseCount(node.depth, depthStack);
      for (let j = 0; j < closeCount; j++) {
        logGroupEnd();
        depthStack.pop();
      }

      // 4. Determine if this node should be a group
      const hasChildren = hasChildNodes(nodes, i, enableInternals);
      const isGroup = shouldGroupNode(node, hasChildren);

      // 5. Render node header
      const logAction = createLogDispatch(node, isGroup, showFlags);
      logAction.logFn(...logAction.args);

      // 6. Render details and track group depth
      if (isGroup) {
        depthStack.push(node.depth);
        renderNodeDetails(node, "");
      }
    }

    // Close remaining groups
    while (depthStack.length > 0) {
      logGroupEnd();
      depthStack.pop();
    }
  };
};
