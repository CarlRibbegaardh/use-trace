import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { logWithOptionalStyle } from "../helpers/logWithOptionalStyle.js";

/**
 * Styled logging for identical state value warnings with theme-aware colors.
 * Prefix is monochrome, icon+message are styled: "  │   ⚠️ Identical value: {x:1} → {x:1}"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The warning message about identical state values
 * @param options - Styled logger options with theme and colors
 */
export function logIdenticalStateValueWarning(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const { formattedMessage, style } = createStyledMessage(
    "identicalStateValueWarning",
    "before",
    message,
    options.themeManager,
    options.getColors
  );
  logWithOptionalStyle(prefix, formattedMessage, style);
}
