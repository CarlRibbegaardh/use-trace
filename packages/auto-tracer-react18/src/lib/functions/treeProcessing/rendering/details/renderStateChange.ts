import type { StateChangeWithWarning } from "../../types/TreeNode.js";
import type { RenderOptions } from "../types/RenderOptions.js";
import {
  formatStateChange,
  formatStateValue,
} from "../../../changeFormatting.js";
import { snapshotValue } from "../../../snapshotValue.js";
import { checkComplexObject } from "../../../checkComplexObject.js";
import { isSimpleValue } from "../utils/isSimpleValue.js";

/**
 * Rendered output for a state change.
 */
export interface RenderedStateChange {
  /**
   * Log level for the change (determines color/styling).
   */
  readonly level: "state" | "state-initial" | "state-identical";

  /**
   * Primary message text.
   */
  readonly message: string;

  /**
   * Optional additional values (for devtools-json mode).
   * Single value for initial render, two values (before/after) for updates.
   */
  readonly values?: readonly [unknown] | readonly [unknown, unknown];
}

/**
 * Prepares a value for DevTools rendering.
 * Returns error message if value is too complex.
 */
function prepareValue(value: unknown): unknown {
  const complexityError = checkComplexObject(value);
  if (complexityError) {
    return complexityError;
  }
  return snapshotValue(value);
}

/**
 * Renders a single state change to output data.
 * Pure function with no side effects.
 *
 * @param change - State change to render
 * @param options - Rendering configuration
 * @param isMount - Whether this is a mount (initial) render
 * @returns Rendered output data
 */
export function renderStateChange(
  change: StateChangeWithWarning,
  options: RenderOptions,
  isMount: boolean
): RenderedStateChange {
  const isObjectMode = options.objectRenderingMode === "devtools-json";
  const showIdenticalWarning =
    change.isIdenticalValueChange === true &&
    options.detectIdenticalValueChanges;

  if (isMount) {
    // Mount: show initial value
    if (isObjectMode) {
      const value = prepareValue(change.value);
      return {
        level: "state-initial",
        message: `Initial state ${change.name}: `,
        values: [value],
      };
    } else {
      const formattedValue = formatStateValue(change.value);
      return {
        level: "state-initial",
        message: `Initial state ${change.name}: ${formattedValue}`,
      };
    }
  } else {
    // Update: show change
    if (isObjectMode) {
      const prev = prepareValue(change.prevValue);
      const curr = prepareValue(change.value);
      const simple =
        isSimpleValue(change.prevValue) && isSimpleValue(change.value);

      if (simple) {
        // Simple values: inline like "Changed state trigger: 0 → 1"
        const formatted = formatStateChange(change.prevValue, change.value);
        const baseMessage = `Changed state ${change.name}`;

        if (showIdenticalWarning) {
          return {
            level: "state-identical",
            message: `${baseMessage} (identical value):`,
            values: [formatted],
          };
        } else {
          return {
            level: "state",
            message: `${baseMessage}:`,
            values: [formatted],
          };
        }
      } else {
        // Complex values: multi-line with Before/After
        const baseMessage = `Changed state ${change.name}:`;

        return {
          level: showIdenticalWarning ? "state-identical" : "state",
          message: showIdenticalWarning
            ? `${baseMessage} (identical value)`
            : baseMessage,
          values: [prev, curr],
        };
      }
    } else {
      const formatted = formatStateChange(change.prevValue, change.value);
      const baseMessage = `State change ${change.name}`;

      if (showIdenticalWarning) {
        return {
          level: "state-identical",
          message: `${baseMessage} (identical value): ${formatted}`,
        };
      } else {
        return {
          level: "state",
          message: `${baseMessage}: ${formatted}`,
        };
      }
    }
  }
}
