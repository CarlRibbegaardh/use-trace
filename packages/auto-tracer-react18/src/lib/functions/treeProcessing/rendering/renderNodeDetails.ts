import type { TreeNode } from "../types/TreeNode.js";
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
import {
  formatPropChange,
  formatPropValue,
  formatStateChange,
  formatStateValue,
} from "../../changeFormatting.js";
import { getSkippedProps } from "../../getSkippedProps.js";
import { isReactInternal } from "../../isReactInternal.js";
import { snapshotValue } from "../../snapshotValue.js";
import { checkComplexObject } from "../../checkComplexObject.js";

/**
 * Renders the details of a node (state/prop changes, logs) to the console.
 * Handles both "text" (copy-paste) and "object" (devtools-json) modes.
 *
 * @param node - The tree node to render details for
 * @param prefix - The indentation string (or empty string for group renderer)
 */
export function renderNodeDetails(node: TreeNode, prefix: string = "") {
  const mode = traceOptions.objectRenderingMode || "copy-paste";
  const isObjectMode = mode === "devtools-json";
  const { displayName, renderType } = node;

  // Helper to prepare value for DevTools (Object Mode)
  const prepareValue = (value: unknown): unknown => {
    const complexityError = checkComplexObject(value);
    if (complexityError) {
      return complexityError;
    }
    return snapshotValue(value);
  };

  // Render state changes
  if (renderType === "Mount") {
    node.stateChanges.forEach((change) => {
      if (isObjectMode) {
        const value = prepareValue(change.value);
        logStateChange(prefix, `Initial state ${change.name}:`, true);
        log(prefix, value);
      } else {
        const formattedValue = formatStateValue(change.value);
        logStateChange(
          prefix,
          `Initial state ${change.name}: ${formattedValue}`,
          true
        );
      }
    });
  } else {
    // Updates
    node.stateChanges.forEach((change) => {
      if (isObjectMode) {
        const prev = prepareValue(change.prevValue);
        const curr = prepareValue(change.value);
        const msg = `State change ${change.name}:`;

        if (
          change.isIdenticalValueChange === true &&
          traceOptions.detectIdenticalValueChanges
        ) {
          logIdenticalStateValueWarning(prefix, `${msg} (identical value)`);
        } else {
          logStateChange(prefix, msg, false);
        }
        // Log before/after as objects
        log(`${prefix}   Before:`, prev);
        log(`${prefix}   After: `, curr);
      } else {
        const formatted = formatStateChange(change.prevValue, change.value);
        if (
          change.isIdenticalValueChange === true &&
          traceOptions.detectIdenticalValueChanges
        ) {
          const msg = `State change ${change.name} (identical value): ${formatted}`;
          logIdenticalStateValueWarning(prefix, msg);
        } else {
          const msg = `State change ${change.name}: ${formatted}`;
          logStateChange(prefix, msg, false);
        }
      }
    });
  }

  // Render prop changes
  if (renderType === "Mount") {
    const currentProps = node.propChanges.length > 0 ? node.propChanges : [];
    const skippedProps = getSkippedProps(displayName || undefined);

    currentProps.forEach((change) => {
      if (!isReactInternal(change.name) && !skippedProps.has(change.name)) {
        if (isObjectMode) {
          const value = prepareValue(change.value);
          logPropChange(prefix, `Initial prop ${change.name}:`, true);
          log(prefix, value);
        } else {
          const formattedValue = formatPropValue(change.value);
          logPropChange(
            prefix,
            `Initial prop ${change.name}: ${formattedValue}`,
            true
          );
        }
      }
    });
  } else {
    // Updates
    node.propChanges.forEach((change) => {
      if (isObjectMode) {
        const prev = prepareValue(change.prevValue);
        const curr = prepareValue(change.value);
        const msg = `Prop change ${change.name}:`;

        if (
          change.isIdenticalValueChange === true &&
          traceOptions.detectIdenticalValueChanges
        ) {
          logIdenticalPropValueWarning(prefix, `${msg} (identical value)`);
        } else {
          logPropChange(prefix, msg, false);
        }
        log(`${prefix}   Before:`, prev);
        log(`${prefix}   After: `, curr);
      } else {
        const formatted = formatPropChange(change.prevValue, change.value);
        if (
          change.isIdenticalValueChange === true &&
          traceOptions.detectIdenticalValueChanges
        ) {
          const msg = `Prop change ${change.name} (identical value): ${formatted}`;
          logIdenticalPropValueWarning(prefix, msg);
        } else {
          const msg = `Prop change ${change.name}: ${formatted}`;
          logPropChange(prefix, msg, false);
        }
      }
    });
  }

  // Render component logs
  node.componentLogs.forEach((logEntry) => {
    const { message, level, args } = logEntry;

    if (isObjectMode) {
      const safeArgs = args.map(prepareValue);
      if (level === "error") {
        logErrorStatement(prefix, message, ...safeArgs);
      } else if (level === "warn") {
        logWarnStatement(prefix, message, ...safeArgs);
      } else {
        logLogStatement(prefix, message, ...safeArgs);
      }
    } else {
      const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : "";
      const fullMessage = `${message}${argsStr}`;

      if (level === "error") {
        logErrorStatement(prefix, fullMessage);
      } else if (level === "warn") {
        logWarnStatement(prefix, fullMessage);
      } else {
        logLogStatement(prefix, fullMessage);
      }
    }
  });
}
