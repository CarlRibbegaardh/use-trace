import type { TreeNode } from "../types/TreeNode.js";
import type { RenderOptions } from "./types/RenderOptions.js";
import { traceOptions } from "../../../types/globalState.js";
import { renderStateChange } from "./details/renderStateChange.js";
import { renderPropChange } from "./details/renderPropChange.js";
import { renderComponentLog } from "./details/renderComponentLog.js";
import { dispatchStateLog } from "./dispatch/dispatchStateLog.js";
import { dispatchPropLog } from "./dispatch/dispatchPropLog.js";
import { dispatchComponentLog } from "./dispatch/dispatchComponentLog.js";

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
    const dispatch = dispatchStateLog(rendered, prefix, isObjectMode);
    dispatch.logFn(...(dispatch.args as []));
  });

  // Render prop changes
  node.propChanges.forEach((change) => {
    const rendered = renderPropChange(change, options, isMount);
    const dispatch = dispatchPropLog(rendered, prefix, isObjectMode);
    if (dispatch) {
      dispatch.logFn(...(dispatch.args as []));
    }
  });

  // Render component logs
  node.componentLogs.forEach((logEntry) => {
    const rendered = renderComponentLog(logEntry, options);
    const dispatch = dispatchComponentLog(rendered, prefix);
    dispatch.logFn(...(dispatch.args as []));
  });
}
