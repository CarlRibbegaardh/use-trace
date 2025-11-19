import type { LogDispatch } from "../types/LogDispatch.js";
import type { RenderedComponentLog } from "../details/renderComponentLog.js";
import {
  logErrorStatement,
  logLogStatement,
  logWarnStatement,
} from "../../../log.js";

/**
 * Determines which log function to use for a component log and constructs arguments.
 * Pure function that returns dispatch instructions without executing side effects.
 *
 * @param rendered - The rendered component log data
 * @param prefix - The indentation prefix
 * @returns Log dispatch instructions
 */
export function dispatchComponentLog(
  rendered: RenderedComponentLog,
  prefix: string,
): LogDispatch {
  const baseArgs: unknown[] = [prefix, rendered.message];

  // Add additional args if present
  if (rendered.args) {
    baseArgs.push(...rendered.args);
  }

  // Determine which log function based on level
  let logFn: (...args: unknown[]) => void;

  if (rendered.level === "error") {
    logFn = logErrorStatement as (...args: unknown[]) => void;
  } else if (rendered.level === "warn") {
    logFn = logWarnStatement as (...args: unknown[]) => void;
  } else {
    logFn = logLogStatement as (...args: unknown[]) => void;
  }

  return { logFn, args: baseArgs };
}
