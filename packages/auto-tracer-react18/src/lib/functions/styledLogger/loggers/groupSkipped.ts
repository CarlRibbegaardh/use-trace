import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { groupWithOptionalStyle } from "../helpers/groupWithOptionalStyle.js";

/**
 * Styled console group for skipped components.
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Skipped ⏭️"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The skipped component message
 * @param options - Styled logger options with theme and colors
 */
export function groupSkipped(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const { formattedMessage, style } = createStyledMessage(
    "skipped",
    "after",
    message,
    options.themeManager,
    options.getColors
  );
  groupWithOptionalStyle(prefix, formattedMessage, style);
}
