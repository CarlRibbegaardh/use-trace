import type { PropChangeWithWarning } from "../../types/TreeNode.js";
import type { RenderOptions } from "../types/RenderOptions.js";
import {
  formatPropChange,
  formatPropValue,
} from "../../../changeFormatting.js";
import { snapshotValue } from "../../../snapshotValue.js";
import { checkComplexObject } from "../../../checkComplexObject.js";
import { getSkippedProps } from "../../../getSkippedProps.js";
import { isReactInternal } from "../../../isReactInternal.js";
import { isSimpleValue } from "../utils/isSimpleValue.js";

/**
 * Rendered output for a prop change.
 */
export interface RenderedPropChange {
  /**
   * Log level for the change (determines color/styling).
   */
  readonly level: "prop" | "prop-initial" | "prop-identical";

  /**
   * Primary message text.
   */
  readonly message: string;

  /**
   * Optional additional values (for devtools-json mode).
   * Single value for initial render, two values (before/after) for updates.
   */
  readonly values?: readonly [unknown] | readonly [unknown, unknown];

  /**
   * Whether this prop should be skipped (filtered out).
   * True for React internals or explicitly skipped props.
   */
  readonly shouldSkip: boolean;
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
 * Renders a single prop change to output data.
 * Pure function with no side effects.
 *
 * @param change - Prop change to render
 * @param options - Rendering configuration
 * @param isMount - Whether this is a mount (initial) render
 * @returns Rendered output data
 */
export function renderPropChange(
  change: PropChangeWithWarning,
  options: RenderOptions,
  isMount: boolean
): RenderedPropChange {
  const isObjectMode = options.objectRenderingMode === "devtools-json";
  const showIdenticalWarning =
    change.isIdenticalValueChange === true &&
    options.detectIdenticalValueChanges;

  // Check if this prop should be filtered out
  const skippedProps = getSkippedProps(options.displayName);
  const shouldSkip =
    isReactInternal(change.name) || skippedProps.has(change.name);

  if (isMount) {
    // Mount: show initial value
    if (isObjectMode) {
      const value = prepareValue(change.value);
      return {
        level: "prop-initial",
        message: `Initial prop ${change.name}: `,
        values: [value],
        shouldSkip,
      };
    } else {
      const formattedValue = formatPropValue(change.value);
      return {
        level: "prop-initial",
        message: `Initial prop ${change.name}: ${formattedValue}`,
        shouldSkip,
      };
    }
  } else {
    // Update: show change
    if (isObjectMode) {
      const prev = prepareValue(change.prevValue);
      const curr = prepareValue(change.value);
      const simple = isSimpleValue(change.prevValue) && isSimpleValue(change.value);

      if (simple) {
        // Simple values: inline like "Changed prop loading: false → true"
        const formatted = formatPropChange(change.prevValue, change.value);
        const baseMessage = `Changed prop ${change.name}`;

        if (showIdenticalWarning) {
          return {
            level: "prop-identical",
            message: `${baseMessage} (identical value): ${formatted}`,
            shouldSkip,
          };
        } else {
          return {
            level: "prop",
            message: `${baseMessage}: ${formatted}`,
            shouldSkip,
          };
        }
      } else {
        // Complex values: multi-line with Before/After
        const baseMessage = `Changed prop ${change.name}:`;

        return {
          level: showIdenticalWarning ? "prop-identical" : "prop",
          message: showIdenticalWarning
            ? `${baseMessage} (identical value)`
            : baseMessage,
          values: [prev, curr],
          shouldSkip,
        };
      }
    } else {
      const formatted = formatPropChange(change.prevValue, change.value);
      const baseMessage = `Prop change ${change.name}`;

      if (showIdenticalWarning) {
        return {
          level: "prop-identical",
          message: `${baseMessage} (identical value): ${formatted}`,
          shouldSkip,
        };
      } else {
        return {
          level: "prop",
          message: `${baseMessage}: ${formatted}`,
          shouldSkip,
        };
      }
    }
  }
}
