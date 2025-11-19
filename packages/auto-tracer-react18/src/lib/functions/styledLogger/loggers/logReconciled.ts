import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { logWithOptionalStyle } from "../helpers/logWithOptionalStyle.js";

/**
 * Styled logging for reconciled components.
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Reconciled ♻️"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The reconciled component message
 * @param options - Styled logger options with theme and colors
 */
export function logReconciled(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const { formattedMessage, style } = createStyledMessage(
    "reconciled",
    "after",
    message,
    options.themeManager,
    options.getColors
  );
  logWithOptionalStyle(prefix, formattedMessage, style);
}
