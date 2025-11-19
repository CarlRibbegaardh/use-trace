import type { LogDispatch } from "../types/LogDispatch.js";
import type { RenderedPropChange } from "../details/renderPropChange.js";
import {
  log,
  logIdenticalPropValueWarning,
  logPropChange,
} from "../../../log.js";

/**
 * Determines which log function to use for a prop change and constructs arguments.
 * Pure function that returns dispatch instructions without executing side effects.
 * Returns null if the prop change should be skipped.
 *
 * @param rendered - The rendered prop change data
 * @param prefix - The indentation prefix
 * @param isObjectMode - Whether object rendering mode is active
 * @returns Log dispatch instructions, or null if should skip
 */
export function dispatchPropLog(
  rendered: RenderedPropChange,
  prefix: string,
  isObjectMode: boolean,
): LogDispatch | null {
  // Skip filtered props
  if (rendered.shouldSkip) {
    return null;
  }

  // Determine base dispatch
  let baseDispatch: LogDispatch;

  if (rendered.level === "prop-identical") {
    baseDispatch = {
      logFn: logIdenticalPropValueWarning as (...args: unknown[]) => void,
      args: [prefix, rendered.message],
    };
  } else if (rendered.level === "prop-initial") {
    baseDispatch = {
      logFn: logPropChange as (...args: unknown[]) => void,
      args: [prefix, rendered.message, true],
    };
  } else {
    baseDispatch = {
      logFn: logPropChange as (...args: unknown[]) => void,
      args: [prefix, rendered.message, false],
    };
  }

  // Wrap with object mode logging if needed
  if (isObjectMode && rendered.values) {
    return {
      logFn: () => {
        baseDispatch.logFn(...(baseDispatch.args as []));
        log(`${prefix}   Before:`, rendered.values![0]);
        log(`${prefix}   After: `, rendered.values![1]);
      },
      args: [],
    };
  }

  return baseDispatch;
}
