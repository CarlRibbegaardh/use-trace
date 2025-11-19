import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { logWithOptionalStyle } from "../helpers/logWithOptionalStyle.js";

/**
 * Styled logging for prop changes with theme-aware colors.
 * Prefix is monochrome, icon+message are styled: "  │   📝 Initial prop: value"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The prop change message
 * @param isInitial - Whether this is an initial prop value
 * @param options - Styled logger options with theme and colors
 * @param args - Additional arguments to log (e.g., the value in object mode)
 */
export function logPropChange(
  prefix: string,
  message: string,
  isInitial: boolean,
  options: StyledLoggerOptions,
  ...args: unknown[]
): void {
  const colorKey = isInitial ? "propInitial" : "propChange";
  const { formattedMessage, style } = createStyledMessage(
    colorKey,
    "before",
    message,
    options.themeManager,
    options.getColors
  );
  logWithOptionalStyle(prefix, formattedMessage, style, ...args);
}
