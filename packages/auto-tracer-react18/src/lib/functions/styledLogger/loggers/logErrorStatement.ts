import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { logWithOptionalStyle } from "../helpers/logWithOptionalStyle.js";

/**
 * Styled logging for error statements with theme-aware colors.
 * Prefix is monochrome, icon+message are styled: "  │   ❌ Error message"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The error message
 * @param options - Styled logger options with theme and colors
 * @param args - Additional arguments to pass to console.log
 */
export function logErrorStatement(
  prefix: string,
  message: string,
  options: StyledLoggerOptions,
  ...args: unknown[]
): void {
  const { formattedMessage, style } = createStyledMessage(
    "errorStatements",
    "before",
    message,
    options.themeManager,
    options.getColors
  );
  logWithOptionalStyle(prefix, formattedMessage, style, ...args);
}
