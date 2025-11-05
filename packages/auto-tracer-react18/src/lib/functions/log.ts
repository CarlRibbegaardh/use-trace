import { isDarkMode, traceOptions } from "../types/globalState.js";
import {
  safeError,
  safeGroup,
  safeGroupEnd,
  safeLog,
  safeWarn,
} from "./consoleUtils.js";
import {
  type StyledLoggerOptions,
  logDefinitive as logDefinitiveStyled,
  logLogStatement as logLogStatementStyled,
  logPropChange as logPropChangeStyled,
  logReconciled as logReconciledStyled,
  logSkipped as logSkippedStyled,
  logStateChange as logStateChangeStyled,
  logStyled as logStyledStyled,
} from "./styledLogger.js";

// Create dependency injection configuration for styled logger
const styledLoggerOptions: StyledLoggerOptions = Object.freeze({
  themeManager: Object.freeze({
    isDarkMode: () => {
      return isDarkMode();
    },
  }),
  getColors: () => {
    return traceOptions.colors || {};
  },
});

// Re-export console utilities with original names
export const log = safeLog;
export const logGroup = safeGroup;
export const logGroupEnd = safeGroupEnd;
export const logWarn = safeWarn;
export const logError = safeError;

/**
 * Styled logging for definitive render markers with theme-aware colors and icons
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Rendering ⚡"
 */
export function logDefinitive(prefix: string, message: string): void {
  logDefinitiveStyled(prefix, message, styledLoggerOptions);
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
  logPropChangeStyled(prefix, message, isInitial, styledLoggerOptions);
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
  logStateChangeStyled(prefix, message, isInitial, styledLoggerOptions);
}

/**
 * Styled logging for log statements with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   Log: Custom message"
 */
export function logLogStatement(prefix: string, message: string): void {
  logLogStatementStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled logging for reconciled components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Reconciled ♻️"
 */
export function logReconciled(prefix: string, message: string): void {
  logReconciledStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled logging for skipped components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Skipped ⏭️"
 */
export function logSkipped(prefix: string, message: string): void {
  logSkippedStyled(prefix, message, styledLoggerOptions);
}

/**
 * Regular logging with optional styling support
 */
export function logStyled(
  prefix: string,
  message: string,
  isDefinitive: boolean = false
): void {
  logStyledStyled(prefix, message, isDefinitive, styledLoggerOptions);
}
