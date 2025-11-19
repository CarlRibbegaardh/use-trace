import type { TreeNode } from "../types/TreeNode.js";
import { formatConnector } from "./formatConnector.js";
import {
  log,
  logReconciled,
  logSkipped,
  logStyled,
} from "../../log.js";
import { traceOptions } from "../../../types/globalState.js";
import { getFlagNames } from "../../reactFiberFlags.js";
import { renderNodeDetails } from "./renderNodeDetails.js";

/**
 * Renders a single TreeNode to the console with indentation.
 * Uses renderNodeDetails for the content, supporting both text and object modes.
 *
 * IMPURE FUNCTION - Performs I/O (console logging).
 *
 * @param node - Tree node to render
 * @param visualDepth - Calculated visual depth for indentation
 * @param lastVisualDepth - Previous visual depth for connector logic
 * @param previousWasMarker - Whether the previous node was a marker
 * @param nextNode - The next node in the tree (for marker debug info)
 * @returns New lastVisualDepth value
 */
export function renderIndentedNode(
  node: TreeNode,
  visualDepth: number,
  lastVisualDepth: number,
  previousWasMarker: boolean,
  nextNode?: TreeNode
): number {
  const {
    depth: originalDepth,
    displayName,
    renderType,
    flags,
    isTracked,
  } = node;

  // Handle marker nodes specially
  if (renderType === "Marker") {
    const indent = "\u2007\u2007".repeat(Math.max(visualDepth, 0));
    const showLevel = traceOptions.enableAutoTracerInternalsLogging ?? false;

    if (showLevel) {
      const nextNodeDepth = nextNode?.depth ?? originalDepth;
      const filteredCount = node.filteredNodeCount ?? 0;
      log(
        `${indent}└─┐ ... (Level: ${nextNodeDepth}, Filtered nodes: ${filteredCount})`
      );
    } else {
      log(`${indent}└─┐ ${node.componentName}`);
    }

    return visualDepth;
  }

  const indent = "\u2007\u2007".repeat(visualDepth);

  // Show connecting lines
  if (visualDepth > lastVisualDepth && visualDepth > 0 && !previousWasMarker) {
    const innerLastDepth = Math.max(lastVisualDepth, 0);
    const depthDifference = visualDepth - innerLastDepth;
    const showLevel = traceOptions.enableAutoTracerInternalsLogging ?? false;

    if (depthDifference > 1) {
      for (
        let missingLevel = innerLastDepth + 1;
        missingLevel < visualDepth;
        missingLevel++
      ) {
        log(formatConnector(missingLevel, originalDepth, showLevel));
      }
    }
    log(formatConnector(visualDepth, originalDepth, showLevel));
  }

  // Prepare component display
  let flagsDisplay = "";
  if (flags > 0 && traceOptions.showFlags) {
    const flagNames = getFlagNames(flags);
    flagsDisplay = ` (${flagNames.join(", ")})`;
  }

  const prefix = `${indent}├─ `;
  const message = `[${displayName}] ${renderType}${flagsDisplay}`;

  // Log the component line
  if (isTracked) {
    logStyled(prefix, message, true);
  } else if (renderType === "Reconciled") {
    logReconciled(prefix, message);
  } else if (renderType === "Skipped") {
    logSkipped(prefix, message);
  } else {
    log(`${prefix}${message}`);
  }

  // Render details (state, props, logs)
  // We pass the indentation + vertical bar for the details
  renderNodeDetails(node, `${indent}│   `);

  return visualDepth;
}
