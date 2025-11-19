import type { ColorPalette } from "./ColorPalette.js";
import type { ThemeManagerOptions } from "../themeManager.js";
import { buildStyle, getThemeOptions } from "../themeManager.js";

/**
 * Icon placement strategy for styled messages.
 */
export type IconPlacement = "before" | "after";

/**
 * Result of styled message creation containing formatted text and CSS style.
 */
export interface StyledMessageResult {
  readonly formattedMessage: string;
  readonly style: string;
}

/**
 * Creates a formatted message with CSS styling based on color palette configuration.
 * This pure function eliminates duplication across all styled logger functions.
 *
 * @param colorKey - The color palette key to use for styling
 * @param iconPlacement - Whether to place the icon before or after the message
 * @param message - The message content to format
 * @param themeManager - Theme manager options for style resolution
 * @param getColors - Function that returns the color palette
 * @returns Formatted message and CSS style string
 */
export function createStyledMessage(
  colorKey: keyof ColorPalette,
  iconPlacement: IconPlacement,
  message: string,
  themeManager: ThemeManagerOptions,
  getColors: () => ColorPalette
): StyledMessageResult {
  const colorOptions = getColors()[colorKey];
  const themeOptions = getThemeOptions(colorOptions, themeManager);
  const icon = colorOptions?.icon ?? "";
  const style = buildStyle(themeOptions);

  const formattedMessage =
    iconPlacement === "before" && icon
      ? `${icon} ${message}`
      : iconPlacement === "after" && icon
        ? `${message} ${icon}`
        : message;

  return { formattedMessage, style };
}
