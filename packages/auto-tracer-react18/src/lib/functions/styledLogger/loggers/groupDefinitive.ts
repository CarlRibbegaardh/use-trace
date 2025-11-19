import type { StyledLoggerOptions } from "../StyledLoggerOptions.js";
import { createStyledMessage } from "../createStyledMessage.js";
import { groupWithOptionalStyle } from "../helpers/groupWithOptionalStyle.js";

/**
 * Styled console group for definitive render markers with theme-aware colors and icons.
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Rendering ⚡"
 *
 * @param prefix - Monochrome prefix (e.g., tree indentation)
 * @param message - The component render message
 * @param options - Styled logger options with theme and colors
 */
export function groupDefinitive(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const { formattedMessage, style } = createStyledMessage(
    "definitiveRender",
    "after",
    message,
    options.themeManager,
    options.getColors
  );
  groupWithOptionalStyle(prefix, formattedMessage, style);
}
