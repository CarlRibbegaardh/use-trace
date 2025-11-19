import type { ComponentLogEntry } from "../../../../interfaces/ComponentLogger.js";
import type { RenderOptions } from "../types/RenderOptions.js";
import { snapshotValue } from "../../../snapshotValue.js";
import { checkComplexObject } from "../../../checkComplexObject.js";

/**
 * Rendered output for a component log entry.
 */
export interface RenderedComponentLog {
  /**
   * Log level (determines color/styling).
   */
  readonly level: "log" | "warn" | "error";

  /**
   * Primary message text.
   */
  readonly message: string;

  /**
   * Optional additional arguments (for devtools-json mode).
   */
  readonly args?: readonly unknown[];
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
 * Renders a single component log entry to output data.
 * Pure function with no side effects.
 *
 * @param logEntry - Component log to render
 * @param options - Rendering configuration
 * @returns Rendered output data
 */
export function renderComponentLog(
  logEntry: ComponentLogEntry,
  options: RenderOptions
): RenderedComponentLog {
  const isObjectMode = options.objectRenderingMode === "devtools-json";
  const { message, level, args } = logEntry;

  if (isObjectMode) {
    // DevTools mode: return objects for inspection
    const safeArgs = args.map(prepareValue);
    return {
      level,
      message,
      args: safeArgs,
    };
  } else {
    // Copy-paste mode: stringify args
    const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : "";
    return {
      level,
      message: `${message}${argsStr}`,
    };
  }
}
