import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { logWithOptionalStyle } from "../helpers/logWithOptionalStyle.js";

/**
 * Styled logging for state changes with theme-aware colors.
 * Prefix is monochrome, icon+message are styled: "  │   📊 State change: 1 → 2"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The state change message
 * @param isInitial - Whether this is an initial state value
 * @param options - Styled logger options with theme and colors
 */
export function logStateChange(
  prefix: string,
  message: string,
  isInitial: boolean,
  options: StyledLoggerOptions
): void {
  const colorKey = isInitial ? "stateInitial" : "stateChange";
  const { formattedMessage, style } = createStyledMessage(
    colorKey,
    "before",
    message,
    options.themeManager,
    options.getColors
  );
  logWithOptionalStyle(prefix, formattedMessage, style);
}
