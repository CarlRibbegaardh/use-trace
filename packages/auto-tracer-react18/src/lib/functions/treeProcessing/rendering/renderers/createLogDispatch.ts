import type { TreeNode } from "../../types/TreeNode.js";
import type { LogAction } from "./LogAction.js";
import {
  groupReconciled,
  groupSkipped,
  groupStyled,
  log,
  logGroup,
  logReconciled,
  logSkipped,
  logStyled,
} from "../../../log.js";
import { getFlagNames } from "../../../reactFiberFlags.js";

/**
 * Creates a log action for rendering a node header.
 * Pure function that returns a deferred console operation based on node properties.
 *
 * Strategy pattern: Selects the appropriate logging function based on:
 * - Whether the node is a group or single log line
 * - Whether the node is tracked
 * - The node's render type
 *
 * @param node - The tree node to create a log action for
 * @param isGroup - Whether to use group functions or single log functions
 * @param showFlags - Whether to include fiber flags in the output
 * @returns A LogAction containing the function and arguments to execute
 */
export function createLogDispatch(
  node: TreeNode,
  isGroup: boolean,
  showFlags: boolean
): LogAction {
  const { displayName, renderType, flags, isTracked } = node;

  // Build message with optional flags
  let flagsDisplay = "";
  if (flags > 0 && showFlags) {
    const flagNames = getFlagNames(flags);
    flagsDisplay = ` (${flagNames.join(", ")})`;
  }

  const message = `[${displayName}] ${renderType}${flagsDisplay}`;

  // Select appropriate logging function based on group/log and node properties
  if (isGroup) {
    if (isTracked) {
      return {
        logFn: groupStyled,
        args: ["", message, true] as const,
      };
    }

    if (renderType === "Reconciled") {
      return {
        logFn: groupReconciled,
        args: ["", message] as const,
      };
    }

    if (renderType === "Skipped") {
      return {
        logFn: groupSkipped,
        args: ["", message] as const,
      };
    }

    return {
      logFn: logGroup,
      args: [message] as const,
    };
  }

  // Single log line
  if (isTracked) {
    return {
      logFn: logStyled,
      args: ["", message, true] as const,
    };
  }

  if (renderType === "Reconciled") {
    return {
      logFn: logReconciled,
      args: ["", message] as const,
    };
  }

  if (renderType === "Skipped") {
    return {
      logFn: logSkipped,
      args: ["", message] as const,
    };
  }

  return {
    logFn: log,
    args: [message] as const,
  };
}
