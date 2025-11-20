import type { TreeRenderer } from "../types/TreeRenderer.js";
import { calculateVisualDepths } from "../helpers/calculateVisualDepths.js";
import { renderTreeNode } from "../renderTreeNode.js";
import { traceOptions } from "../../../../types/globalState.js";

/**
 * Creates an indented tree renderer (current behavior).
 *
 * This renderer uses Unicode figure spaces and box-drawing characters
 * to create a visual tree structure in the console.
 *
 * @returns A functional TreeRenderer
 */
export const createIndentedRenderer = (): TreeRenderer => {
  return (nodes) => {
    const shouldLogDetail =
      traceOptions.enableAutoTracerInternalsLogging ?? false;
    if (shouldLogDetail) {
      console.log(
        `[AutoTracer] createIndentedRenderer: Processing ${nodes.length} nodes`
      );
    }

    const visualDepths = calculateVisualDepths(nodes);
    let lastVisualDepth = -1;
    let previousWasMarker = false;

    for (let i = 0; i < nodes.length; i++) {
      try {
        const node = nodes[i];
        const visualDepth = visualDepths[i];
        const nextNode = i + 1 < nodes.length ? nodes[i + 1] : undefined;

        if (node !== undefined && visualDepth !== undefined) {
          lastVisualDepth = renderTreeNode(
            node,
            visualDepth,
            lastVisualDepth,
            previousWasMarker,
            nextNode
          );
          previousWasMarker = node.renderType === "Marker";
        }
      } catch (error) {
        if (shouldLogDetail) {
          console.error(`[AutoTracer] Error rendering node ${i}:`, error);
        }
        // Continue rendering other nodes
      }
    }

    if (shouldLogDetail) {
      console.log("[AutoTracer] createIndentedRenderer: Complete");
    }
  };
};
