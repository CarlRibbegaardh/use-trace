import type { TreeNode } from "../types/TreeNode.js";
import type { RenderOptions } from "./types/RenderOptions.js";
import { traceOptions } from "../../../types/globalState.js";
import {
  log,
  logErrorStatement,
  logIdenticalPropValueWarning,
  logIdenticalStateValueWarning,
  logLogStatement,
  logPropChange,
  logStateChange,
  logWarnStatement,
} from "../../log.js";
import { renderStateChange } from "./details/renderStateChange.js";
import { renderPropChange } from "./details/renderPropChange.js";
import { renderComponentLog } from "./details/renderComponentLog.js";

/**
 * Renders the details of a node (state/prop changes, logs) to the console.
 * Orchestrates pure rendering functions and pipes output to console.
 *
 * @param node - The tree node to render details for
 * @param prefix - The indentation string (or empty string for group renderer)
 */
export function renderNodeDetails(node: TreeNode, prefix: string = "") {
  const { displayName, renderType } = node;

  // Build rendering options from global state
  const options: RenderOptions = {
    objectRenderingMode: traceOptions.objectRenderingMode || "copy-paste",
    detectIdenticalValueChanges:
      traceOptions.detectIdenticalValueChanges || false,
    prefix,
    displayName,
  };

  const isMount = renderType === "Mount";
  const isObjectMode = options.objectRenderingMode === "devtools-json";

  // Render state changes
  node.stateChanges.forEach((change) => {
    const rendered = renderStateChange(change, options, isMount);

    if (rendered.level === "state-identical") {
      logIdenticalStateValueWarning(prefix, rendered.message);
    } else if (rendered.level === "state-initial") {
      logStateChange(prefix, rendered.message, true);
    } else {
      logStateChange(prefix, rendered.message, false);
    }

    // For object mode with values, log the before/after
    if (isObjectMode && rendered.values) {
      log(`${prefix}   Before:`, rendered.values[0]);
      log(`${prefix}   After: `, rendered.values[1]);
    }
  });

  // Render prop changes
  node.propChanges.forEach((change) => {
    const rendered = renderPropChange(change, options, isMount);

    // Skip filtered props
    if (rendered.shouldSkip) {
      return;
    }

    if (rendered.level === "prop-identical") {
      logIdenticalPropValueWarning(prefix, rendered.message);
    } else if (rendered.level === "prop-initial") {
      logPropChange(prefix, rendered.message, true);
    } else {
      logPropChange(prefix, rendered.message, false);
    }

    // For object mode with values, log the before/after
    if (isObjectMode && rendered.values) {
      log(`${prefix}   Before:`, rendered.values[0]);
      log(`${prefix}   After: `, rendered.values[1]);
    }
  });

  // Render component logs
  node.componentLogs.forEach((logEntry) => {
    const rendered = renderComponentLog(logEntry, options);

    if (rendered.level === "error") {
      if (rendered.args) {
        logErrorStatement(prefix, rendered.message, ...rendered.args);
      } else {
        logErrorStatement(prefix, rendered.message);
      }
    } else if (rendered.level === "warn") {
      if (rendered.args) {
        logWarnStatement(prefix, rendered.message, ...rendered.args);
      } else {
        logWarnStatement(prefix, rendered.message);
      }
    } else {
      if (rendered.args) {
        logLogStatement(prefix, rendered.message, ...rendered.args);
      } else {
        logLogStatement(prefix, rendered.message);
      }
    }
  });
}
