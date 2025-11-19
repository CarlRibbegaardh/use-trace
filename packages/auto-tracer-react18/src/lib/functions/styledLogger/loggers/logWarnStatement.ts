import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { logWithOptionalStyle } from "../helpers/logWithOptionalStyle.js";

/**
 * Styled logging for warn statements with theme-aware colors.
 * Prefix is monochrome, icon+message are styled: "  │   ⚠️ Warning message"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The warning message
 * @param options - Styled logger options with theme and colors
 * @param args - Additional arguments to pass to console.log
 */
export function logWarnStatement(
  prefix: string,
  message: string,
  options: StyledLoggerOptions,
  ...args: unknown[]
): void {
  const { formattedMessage, style } = createStyledMessage(
    "warnStatements",
    "before",
    message,
    options.themeManager,
    options.getColors
  );
  logWithOptionalStyle(prefix, formattedMessage, style, ...args);
}
