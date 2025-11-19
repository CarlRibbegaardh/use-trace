import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { groupDefinitive } from "./groupDefinitive.js";
import { safeGroup } from "../../consoleUtils.js";

/**
 * Regular console group with optional styling support.
 * Uses styled logger for definitive renders, plain grouping otherwise.
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The message to group
 * @param isDefinitive - Whether this is a definitive render
 * @param options - Styled logger options with theme and colors
 */
export function groupStyled(
  prefix: string,
  message: string,
  isDefinitive: boolean,
  options: StyledLoggerOptions
): void {
  if (isDefinitive) {
    groupDefinitive(prefix, message, options);
  } else {
    safeGroup(`${prefix}${message}`);
  }
}
