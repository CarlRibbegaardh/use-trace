import type { LogDispatch } from "../types/LogDispatch.js";
import type { RenderedStateChange } from "../details/renderStateChange.js";
import {
  log,
  logIdenticalStateValueWarning,
  logStateChange,
} from "../../../log.js";

/**
 * Determines which log function to use for a state change and constructs arguments.
 * Pure function that returns dispatch instructions without executing side effects.
 *
 * @param rendered - The rendered state change data
 * @param prefix - The indentation prefix
 * @param isObjectMode - Whether object rendering mode is active
 * @returns Log dispatch instructions
 */
export function dispatchStateLog(
  rendered: RenderedStateChange,
  prefix: string,
  isObjectMode: boolean
): LogDispatch {
  // Determine base dispatch
  let baseDispatch: LogDispatch;

  if (rendered.level === "state-identical") {
    baseDispatch = {
      logFn: logIdenticalStateValueWarning as (...args: unknown[]) => void,
      args: [prefix, rendered.message],
    };
  } else if (rendered.level === "state-initial") {
    baseDispatch = {
      logFn: logStateChange as (...args: unknown[]) => void,
      args: [prefix, rendered.message, true],
    };
  } else {
    baseDispatch = {
      logFn: logStateChange as (...args: unknown[]) => void,
      args: [prefix, rendered.message, false],
    };
  }

  // Wrap with object mode logging if needed
  if (isObjectMode && rendered.values) {
    return {
      logFn: () => {
        if (rendered.values!.length === 1) {
          // Initial: single value on same line - pass as additional arg
          baseDispatch.logFn(...(baseDispatch.args as []), rendered.values![0]);
        } else {
          // Update: Before/After on separate lines
          baseDispatch.logFn(...(baseDispatch.args as []));
          log(`${prefix}  Before`, rendered.values![0]);
          log(`${prefix}  After `, rendered.values![1]);
        }
      },
      args: [],
    };
  }

  return baseDispatch;
}
