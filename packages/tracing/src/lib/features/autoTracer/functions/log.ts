import { isDarkMode, traceOptions } from "../types/globalState.js";
import type {
  ColorOptions,
  ThemeOptions,
} from "../interfaces/AutoTracerOptions.js";

/**
 * Get the appropriate theme options based on current color scheme
 */
function getThemeOptions(colorOptions?: ColorOptions): ThemeOptions {
  if (!colorOptions) return {};

  const darkModeActive = isDarkMode();
  return darkModeActive
    ? colorOptions.darkMode || {}
    : colorOptions.lightMode || {};
}

/**
 * Build CSS style string from theme options
 */
function buildStyle(themeOptions: ThemeOptions): string {
  const styles: string[] = [];

  if (themeOptions.text) styles.push(`color: ${themeOptions.text}`);
  if (themeOptions.background)
    styles.push(`background: ${themeOptions.background}`);
  if (themeOptions.bold) styles.push("font-weight: bold");
  if (themeOptions.italic) styles.push("font-style: italic");

  return styles.join("; ");
}

/**
 * Logging utility for autoTracer for better Chrome DevTools appearance
 * Safely handles environments where console might not be available
 */
export function log(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.log) {
      console.log(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.group wrapper
 */
export function logGroup(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.group) {
      console.group(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.groupEnd wrapper
 */
export function logGroupEnd(): void {
  try {
    if (typeof console !== "undefined" && console.groupEnd) {
      console.groupEnd();
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.warn wrapper
 */
export function logWarn(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.warn) {
      console.warn(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Safe console.error wrapper
 */
export function logError(...args: unknown[]): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(...args);
    }
  } catch (_error) {
    // Silently fail if console is not available
  }
}

/**
 * Styled logging for definitive render markers with theme-aware colors and icons
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Rendering ⚡"
 */
export function logDefinitive(prefix: string, message: string): void {
  const colorOptions = traceOptions.colors?.definitiveRender;
  const themeOptions = getThemeOptions(colorOptions);
  const icon = colorOptions?.icon ? ` ${colorOptions.icon}` : "";
  const style = buildStyle(themeOptions);

  log(`${prefix}%c${message}${icon}`, style);
}

/**
 * Styled logging for prop changes with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   📝 Initial prop: value"
 */
export function logPropChange(
  prefix: string,
  message: string,
  isInitial: boolean = false
): void {
  const colorOptions = isInitial
    ? traceOptions.colors?.propInitial
    : traceOptions.colors?.propChange;
  const themeOptions = getThemeOptions(colorOptions);
  const icon = colorOptions?.icon ? `${colorOptions.icon} ` : "";
  const style = buildStyle(themeOptions);

  log(`${prefix}%c${icon}${message}`, style);
}

/**
 * Styled logging for state changes with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   📊 State change: 1 → 2"
 */
export function logStateChange(
  prefix: string,
  message: string,
  isInitial: boolean = false
): void {
  const colorOptions = isInitial
    ? traceOptions.colors?.stateInitial
    : traceOptions.colors?.stateChange;
  const themeOptions = getThemeOptions(colorOptions);
  const icon = colorOptions?.icon ? `${colorOptions.icon} ` : "";
  const style = buildStyle(themeOptions);

  log(`${prefix}%c${icon}${message}`, style);
}

/**
 * Styled logging for log statements with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   Log: Custom message"
 */
export function logLogStatement(
  prefix: string,
  message: string
): void {
  const colorOptions = traceOptions.colors?.logStatements;
  const themeOptions = getThemeOptions(colorOptions);
  const icon = colorOptions?.icon ? `${colorOptions.icon} ` : "";
  const style = buildStyle(themeOptions);

  log(`${prefix}%c${icon}${message}`, style);
}

/**
 * Styled logging for reconciled components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Reconciled ♻️"
 */
export function logReconciled(prefix: string, message: string): void {
  const colorOptions = traceOptions.colors?.reconciled;
  const themeOptions = getThemeOptions(colorOptions);
  const icon = colorOptions?.icon ? ` ${colorOptions.icon}` : "";
  const style = buildStyle(themeOptions);

  log(`${prefix}%c${message}${icon}`, style);
}

/**
 * Styled logging for skipped components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Skipped ⏭️"
 */
export function logSkipped(prefix: string, message: string): void {
  const colorOptions = traceOptions.colors?.skipped;
  const themeOptions = getThemeOptions(colorOptions);
  const icon = colorOptions?.icon ? ` ${colorOptions.icon}` : "";
  const style = buildStyle(themeOptions);

  log(`${prefix}%c${message}${icon}`, style);
}

/**
 * Regular logging with optional styling support
 */
export function logStyled(
  prefix: string,
  message: string,
  isDefinitive: boolean = false
): void {
  if (isDefinitive) {
    logDefinitive(prefix, message);
  } else {
    log(`${prefix}${message}`);
  }
}
