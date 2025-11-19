import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { logDefinitive } from "./logDefinitive.js";
import { safeLog } from "../../consoleUtils.js";

/**
 * Regular logging with optional styling support.
 * Uses styled logger for definitive renders, plain logging otherwise.
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The message to log
 * @param isDefinitive - Whether this is a definitive render
 * @param options - Styled logger options with theme and colors
 */
export function logStyled(
  prefix: string,
  message: string,
  isDefinitive: boolean,
  options: StyledLoggerOptions
): void {
  if (isDefinitive) {
    logDefinitive(prefix, message, options);
  } else {
    safeLog(`${prefix}${message}`);
  }
}
