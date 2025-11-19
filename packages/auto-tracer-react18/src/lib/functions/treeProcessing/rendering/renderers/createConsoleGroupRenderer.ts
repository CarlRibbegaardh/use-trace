import type { TreeRenderer } from "../types/TreeRenderer.js";
import type { TreeNode } from "../../types/TreeNode.js";
import {
  groupReconciled,
  groupSkipped,
  groupStyled,
  log,
  logGroup,
  logGroupEnd,
  logReconciled,
  logSkipped,
  logStyled,
} from "../../../log.js";
import { traceOptions } from "../../../../types/globalState.js";
import { getFlagNames } from "../../../reactFiberFlags.js";
import { renderNodeDetails } from "../renderNodeDetails.js";

/**
 * Creates a console group renderer.
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
    const depthStack: number[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (!node) {
        continue;
      }

      // 1. Handle Marker skipping
      if (node.renderType === "Marker") {
        if (traceOptions.enableAutoTracerInternalsLogging) {
          const nextNode = nodes[i + 1];
          const nextNodeDepth = nextNode?.depth ?? node.depth;
          const filteredCount = node.filteredNodeCount ?? 0;
          log(
            `... (Level: ${nextNodeDepth}, Filtered nodes: ${filteredCount})`
          );
        }
        continue;
      }

      // 2. Close groups if we are going up or staying same level
      // We close groups until the stack top is strictly less than current node depth
      // This means we are inside the parent group
      while (depthStack.length > 0) {
        const top = depthStack[depthStack.length - 1];
        if (top !== undefined && top >= node.depth) {
          logGroupEnd();
          depthStack.pop();
        } else {
          break;
        }
      }

      // 3. Determine if Group or Log
      // A node is a group if:
      // a) It has children (next visible node is deeper)
      // b) It has details to show (state/prop changes, logs)
      let hasChildren = false;
      let lookaheadIndex = i + 1;

      // Look ahead for the next visible node
      while (lookaheadIndex < nodes.length) {
        const potentialChild = nodes[lookaheadIndex];
        if (!potentialChild) {
          lookaheadIndex++;
          continue;
        }

        if (
          potentialChild.renderType === "Marker" &&
          !traceOptions.enableAutoTracerInternalsLogging
        ) {
          lookaheadIndex++;
          continue;
        }
        if (potentialChild.depth > node.depth) {
          hasChildren = true;
        }
        break;
      }

      const hasDetails =
        node.stateChanges.length > 0 ||
        node.propChanges.length > 0 ||
        node.componentLogs.length > 0;

      const shouldGroup = hasChildren || hasDetails;

      // 4. Render
      renderNodeHeader(node, shouldGroup);

      if (shouldGroup) {
        depthStack.push(node.depth);
        renderNodeDetails(node, "");
        // If it was only grouped because of details (not children),
        // we need to close it immediately if the next node is not a child.
        // However, our loop logic at step 2 handles this automatically:
        // The next node will have depth <= current depth, so it will pop this group.
      }
    }

    // Close remaining groups
    while (depthStack.length > 0) {
      logGroupEnd();
      depthStack.pop();
    }
  };
};

/**
 * Renders the header of a node (the component name line).
 *
 * @param node - The tree node to render
 * @param asGroup - Whether to render as a group start or a single log line
 */
function renderNodeHeader(node: TreeNode, asGroup: boolean) {
  const { displayName, renderType, flags, isTracked } = node;

  // Prepare component display with optional flags
  let flagsDisplay = "";
  if (flags > 0 && traceOptions.showFlags) {
    const flagNames = getFlagNames(flags);
    flagsDisplay = ` (${flagNames.join(", ")})`;
  }

  const message = `[${displayName}] ${renderType}${flagsDisplay}`;

  // Use appropriate styled logging based on render type and tracking status
  if (asGroup) {
    // For groups, we use logGroup but we can't easily style the group header in all browsers/environments consistently
    // with the same flexibility as logStyled. However, logGroup accepts arguments like log.
    // We'll use the standard logGroup for now, potentially passing style args if supported by the logger wrapper.
    // The current logGroup wrapper takes (title, ...args).
    // We will try to pass the styled message if possible, or just the message.

    // Since logGroup in our wrapper might not support full styling objects like logStyled,
    // we will use a simplified approach: just the message.
    // If we want styling, we might need to enhance logGroup.
    // For now, let's assume standard group behavior.
    if (isTracked) {
      groupStyled("", message, true);
    } else if (renderType === "Reconciled") {
      groupReconciled("", message);
    } else if (renderType === "Skipped") {
      groupSkipped("", message);
    } else {
      logGroup(message);
    }
  } else {
    if (isTracked) {
      logStyled("", message, true);
    } else if (renderType === "Reconciled") {
      logReconciled("", message);
    } else if (renderType === "Skipped") {
      logSkipped("", message);
    } else {
      log(message);
    }
  }
}
