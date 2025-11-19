import type { ThemeManagerOptions } from "../themeManager.js";
import type { ColorPalette } from "./ColorPalette.js";

/**
 * Options for styled logger dependency injection.
 * Provides theme manager configuration and color palette accessor.
 */
export interface StyledLoggerOptions {
  themeManager: ThemeManagerOptions;
  getColors: () => ColorPalette;
}
