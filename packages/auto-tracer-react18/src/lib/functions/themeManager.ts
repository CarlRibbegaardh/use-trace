import type {
  ColorOptions,
  ThemeOptions,
} from "../interfaces/AutoTracerOptions.js";

/**
 * Options for theme manager dependency injection
 */
export interface ThemeManagerOptions {
  isDarkMode: () => boolean;
}

/**
 * Get the appropriate theme options based on current color scheme
 * Uses dependency injection for isDarkMode to keep the function pure and testable
 */
export function getThemeOptions(
  colorOptions: ColorOptions | undefined,
  options: ThemeManagerOptions
): ThemeOptions {
  if (!colorOptions) return {};

  const darkModeActive = options.isDarkMode();
  return darkModeActive
    ? colorOptions.darkMode || {}
    : colorOptions.lightMode || {};
}

/**
 * Build CSS style string from theme options
 */
export function buildStyle(themeOptions: ThemeOptions): string {
  const styles: string[] = [];

  if (themeOptions.text) styles.push(`color: ${themeOptions.text}`);
  if (themeOptions.background)
    styles.push(`background: ${themeOptions.background}`);
  if (themeOptions.bold) styles.push("font-weight: bold");
  if (themeOptions.italic) styles.push("font-style: italic");

  return styles.join("; ");
}

/**
 * Default dark mode detection function
 * Can be used as a default implementation for ThemeManagerOptions.isDarkMode
 */
export function detectDarkMode(): boolean {
  if (typeof window === "undefined") {
    return false; // Default to light mode in non-browser environments
  }

  if (window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return false; // Fallback to light mode if matchMedia is not supported
}
