import type { TreeNode } from "../types/TreeNode.js";
import { formatConnector } from "./formatConnector.js";
import {
  log,
  logStyled,
  logReconciled,
  logSkipped,
  logStateChange,
  logPropChange,
  logLogStatement,
  logWarnStatement,
  logErrorStatement,
  logIdenticalStateValueWarning,
  logIdenticalPropValueWarning,
} from "../../log.js";
import { traceOptions } from "../../../types/globalState.js";
import { getFlagNames } from "../../reactFiberFlags.js";
import {
  formatStateChange,
  formatStateValue,
  formatPropChange,
  formatPropValue,
} from "../../changeFormatting.js";
import { getSkippedProps } from "../../getSkippedProps.js";
import { isReactInternal } from "../../isReactInternal.js";

/**
 * Renders a single TreeNode to the console.
 *
 * IMPURE FUNCTION - Performs I/O (console logging).
 * Total function - handles all node types safely.
 *
 * Side effects:
 * - Writes to console
 *
 * @param node - Tree node to render
 * @param visualDepth - Calculated visual depth for indentation
 * @param lastVisualDepth - Previous visual depth for connector logic
 * @param previousWasMarker - Whether the previous node was a marker
 * @returns New lastVisualDepth value
 */
export function renderTreeNode(
  node: TreeNode,
  visualDepth: number,
  lastVisualDepth: number,
  previousWasMarker: boolean
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
    const indent = "  ".repeat(Math.max(visualDepth, 0));
    const showLevel = traceOptions.enableAutoTracerInternalsLogging ?? false;

    if (showLevel) {
      // Show original depth in level label
      log(`${indent}└─┐ ... (Level: ${originalDepth})`);
    } else {
      // Show the component name which includes the count
      log(`${indent}└─┐ ${node.componentName}`);
    }

    return visualDepth;
  }

  const indent = "  ".repeat(visualDepth);

  // Show connecting lines when transitioning to deeper levels
  // Skip intermediate connectors if previous node was a marker (it already represents those levels)
  if (visualDepth > lastVisualDepth && visualDepth > 0 && !previousWasMarker) {
    const innerLastDepth = Math.max(lastVisualDepth, 0);
    const depthDifference = visualDepth - innerLastDepth;
    const showLevel = traceOptions.enableAutoTracerInternalsLogging ?? false;

    // Add connector rows for missing levels if depth increased by more than 1
    if (depthDifference > 1) {
      for (
        let missingLevel = innerLastDepth + 1;
        missingLevel < visualDepth;
        missingLevel++
      ) {
        // Show original depth for the connector (the depth of the component we're leading to)
        log(formatConnector(missingLevel, originalDepth, showLevel));
      }
    }

    // Add the final connector for the current level - show this component's original depth
    log(formatConnector(visualDepth, originalDepth, showLevel));
  }

  // Prepare component display with optional flags
  let flagsDisplay = "";
  if (flags > 0 && traceOptions.showFlags) {
    const flagNames = getFlagNames(flags);
    flagsDisplay = ` (${flagNames.join(", ")})`;
  }

  const prefix = `${indent}├─ `;
  const message = `[${displayName}] ${renderType}${flagsDisplay}`;

  // Use appropriate styled logging based on render type and tracking status
  if (isTracked) {
    logStyled(prefix, message, true);
  } else if (renderType === "Reconciled") {
    logReconciled(prefix, message);
  } else if (renderType === "Skipped") {
    logSkipped(prefix, message);
  } else {
    log(`${prefix}${message}`);
  }

  // Render state changes
  if (renderType === "Mount") {
    // For mounts, show initial state values
    node.stateChanges.forEach((change) => {
      const formattedValue = formatStateValue(change.value);
      logStateChange(
        `${indent}│   `,
        `Initial state ${change.name}: ${formattedValue}`,
        true // isInitial
      );
    });
  } else {
    // For updates, show state changes with before/after
    node.stateChanges.forEach((change) => {
      const formatted = formatStateChange(change.prevValue, change.value);

      // Use identical value warning logger if detected, otherwise normal state change logger
      if (
        change.isIdenticalValueChange === true &&
        traceOptions.detectIdenticalValueChanges
      ) {
        const msg = `State change ${change.name} (identical value): ${formatted}`;
        logIdenticalStateValueWarning(`${indent}│   `, msg);
      } else {
        const msg = `State change ${change.name}: ${formatted}`;
        logStateChange(`${indent}│   `, msg, false);
      }
    });
  }

  // Render prop changes
  if (renderType === "Mount") {
    // For mounts, show initial prop values
    const currentProps = node.propChanges.length > 0 ? node.propChanges : [];
    const skippedProps = getSkippedProps(displayName || undefined);

    currentProps.forEach((change) => {
      if (!isReactInternal(change.name) && !skippedProps.has(change.name)) {
        const formattedValue = formatPropValue(change.value);
        logPropChange(
          `${indent}│   `,
          `Initial prop ${change.name}: ${formattedValue}`,
          true // isInitial
        );
      }
    });
  } else {
    // For updates, show prop changes
    node.propChanges.forEach((change) => {
      const formatted = formatPropChange(change.prevValue, change.value);

      // Use identical value warning logger if detected, otherwise normal prop change logger
      if (
        change.isIdenticalValueChange === true &&
        traceOptions.detectIdenticalValueChanges
      ) {
        const msg = `Prop change ${change.name} (identical value): ${formatted}`;
        logIdenticalPropValueWarning(`${indent}│   `, msg);
      } else {
        const msg = `Prop change ${change.name}: ${formatted}`;
        logPropChange(`${indent}│   `, msg, false);
      }
    });
  }

  // Render component logs
  node.componentLogs.forEach((logEntry) => {
    const argsStr =
      logEntry.args.length > 0 ? ` ${JSON.stringify(logEntry.args)}` : "";
    const message = `${logEntry.message}${argsStr}`;

    if (logEntry.level === "error") {
      logErrorStatement(`${indent}│   `, message);
    } else if (logEntry.level === "warn") {
      logWarnStatement(`${indent}│   `, message);
    } else {
      logLogStatement(`${indent}│   `, message);
    }
  });

  return visualDepth;
}
