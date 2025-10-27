import type { ColorOptions } from "../interfaces/AutoTracerOptions.js";
import {
  type ThemeManagerOptions,
  buildStyle,
  getThemeOptions,
} from "./themeManager.js";
import { safeLog } from "./consoleUtils.js";

/**
 * Options for styled logger dependency injection
 */
export interface StyledLoggerOptions {
  themeManager: ThemeManagerOptions;
}

export type ColorPalette = {
  definitiveRender?: ColorOptions;
  propChange?: ColorOptions;
  propInitial?: ColorOptions;
  stateChange?: ColorOptions;
  stateInitial?: ColorOptions;
  logStatements?: ColorOptions;
  reconciled?: ColorOptions;
  skipped?: ColorOptions;
};

export interface StyledLoggerOptions {
  themeManager: ThemeManagerOptions;
  getColors: () => ColorPalette;
}

/**
 * Internal helper: logs with CSS style if provided, otherwise logs plain text.
 */
function logWithOptionalStyle(
  prefix: string,
  content: string,
  style: string
): void {
  if (style && style.length > 0) {
    safeLog(`${prefix}%c${content}`, style);
  } else {
    safeLog(`${prefix}${content}`);
  }
}

/**
 * Styled logging for definitive render markers with theme-aware colors and icons
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Rendering ⚡"
 */
export function logDefinitive(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const colorOptions = options.getColors().definitiveRender;
  const themeOptions = getThemeOptions(colorOptions, options.themeManager);
  const icon = colorOptions?.icon ? ` ${colorOptions.icon}` : "";
  const style = buildStyle(themeOptions);

  logWithOptionalStyle(prefix, `${message}${icon}`, style);
}

/**
 * Styled logging for prop changes with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   📝 Initial prop: value"
 */
export function logPropChange(
  prefix: string,
  message: string,
  isInitial: boolean,
  options: StyledLoggerOptions
): void {
  const colorOptions = isInitial
    ? options.getColors().propInitial
    : options.getColors().propChange;
  const themeOptions = getThemeOptions(colorOptions, options.themeManager);
  const icon = colorOptions?.icon ? `${colorOptions.icon} ` : "";
  const style = buildStyle(themeOptions);

  logWithOptionalStyle(prefix, `${icon}${message}`, style);
}

/**
 * Styled logging for state changes with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   📊 State change: 1 → 2"
 */
export function logStateChange(
  prefix: string,
  message: string,
  isInitial: boolean,
  options: StyledLoggerOptions
): void {
  const colorOptions = isInitial
    ? options.getColors().stateInitial
    : options.getColors().stateChange;
  const themeOptions = getThemeOptions(colorOptions, options.themeManager);
  const icon = colorOptions?.icon ? `${colorOptions.icon} ` : "";
  const style = buildStyle(themeOptions);

  logWithOptionalStyle(prefix, `${icon}${message}`, style);
}

/**
 * Styled logging for log statements with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   Log: Custom message"
 */
export function logLogStatement(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const colorOptions = options.getColors().logStatements;
  const themeOptions = getThemeOptions(colorOptions, options.themeManager);
  const icon = colorOptions?.icon ? `${colorOptions.icon} ` : "";
  const style = buildStyle(themeOptions);

  logWithOptionalStyle(prefix, `${icon}${message}`, style);
}

/**
 * Styled logging for reconciled components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Reconciled ♻️"
 */
export function logReconciled(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const colorOptions = options.getColors().reconciled;
  const themeOptions = getThemeOptions(colorOptions, options.themeManager);
  const icon = colorOptions?.icon ? ` ${colorOptions.icon}` : "";
  const style = buildStyle(themeOptions);

  logWithOptionalStyle(prefix, `${message}${icon}`, style);
}

/**
 * Styled logging for skipped components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Skipped ⏭️"
 */
export function logSkipped(
  prefix: string,
  message: string,
  options: StyledLoggerOptions
): void {
  const colorOptions = options.getColors().skipped;
  const themeOptions = getThemeOptions(colorOptions, options.themeManager);
  const icon = colorOptions?.icon ? ` ${colorOptions.icon}` : "";
  const style = buildStyle(themeOptions);

  logWithOptionalStyle(prefix, `${message}${icon}`, style);
}

/**
 * Regular logging with optional styling support
 */
export function logStyled(
  prefix: string,
  message: string,
  isDefinitive: boolean,
  options: StyledLoggerOptions
): void {
  if (isDefinitive) {
    logDefinitive(prefix, message, options);
  } else {
    safeLog(`${prefix}${message}`);
  }
}
