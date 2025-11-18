import type { TreeRenderer } from "../types/TreeRenderer.js";
import { calculateVisualDepths } from "../helpers/calculateVisualDepths.js";
import { renderTreeNode } from "../renderTreeNode.js";

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
    const visualDepths = calculateVisualDepths(nodes);
    let lastVisualDepth = -1;
    let previousWasMarker = false;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const visualDepth = visualDepths[i];
      const nextNode = i + 1 < nodes.length ? nodes[i + 1] : undefined;

      // console.log("Rendering node", node.displayName, visualDepth); // DEBUG

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
    }
  };
};
