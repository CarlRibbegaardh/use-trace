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
  groupDefinitive as groupDefinitiveStyled,
  groupReconciled as groupReconciledStyled,
  groupSkipped as groupSkippedStyled,
  groupStyled as groupStyledStyled,
  logDefinitive as logDefinitiveStyled,
  logErrorStatement as logErrorStatementStyled,
  logIdenticalPropValueWarning as logIdenticalPropValueWarningStyled,
  logIdenticalStateValueWarning as logIdenticalStateValueWarningStyled,
  logLogStatement as logLogStatementStyled,
  logPropChange as logPropChangeStyled,
  logReconciled as logReconciledStyled,
  logSkipped as logSkippedStyled,
  logStateChange as logStateChangeStyled,
  logStyled as logStyledStyled,
  logWarnStatement as logWarnStatementStyled,
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

export function groupDefinitive(prefix: string, message: string): void {
  groupDefinitiveStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled logging for prop changes with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   📝 Initial prop: value"
 */
export function logPropChange(
  prefix: string,
  message: string,
  isInitial: boolean = false,
  ...args: unknown[]
): void {
  logPropChangeStyled(prefix, message, isInitial, styledLoggerOptions, ...args);
}

/**
 * Styled logging for state changes with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   📊 State change: 1 → 2"
 */
export function logStateChange(
  prefix: string,
  message: string,
  isInitial: boolean = false,
  ...args: unknown[]
): void {
  logStateChangeStyled(prefix, message, isInitial, styledLoggerOptions, ...args);
}

/**
 * Styled logging for log statements with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   📝 Custom message"
 */
export function logLogStatement(
  prefix: string,
  message: string,
  ...args: unknown[]
): void {
  logLogStatementStyled(prefix, message, styledLoggerOptions, ...args);
}

/**
 * Styled logging for warn statements with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   ⚠️ Warning message"
 */
export function logWarnStatement(
  prefix: string,
  message: string,
  ...args: unknown[]
): void {
  logWarnStatementStyled(prefix, message, styledLoggerOptions, ...args);
}

/**
 * Styled logging for error statements with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   ❌ Error message"
 */
export function logErrorStatement(
  prefix: string,
  message: string,
  ...args: unknown[]
): void {
  logErrorStatementStyled(prefix, message, styledLoggerOptions, ...args);
}

/**
 * Styled logging for reconciled components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Reconciled ♻️"
 */
export function logReconciled(prefix: string, message: string): void {
  logReconciledStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled console group for reconciled components
 * Starts a group with the same styling as logReconciled.
 */
export function groupReconciled(prefix: string, message: string): void {
  groupReconciledStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled logging for skipped components
 * Prefix is monochrome, message+icon are styled: "  │   [Component] Skipped ⏭️"
 */
export function logSkipped(prefix: string, message: string): void {
  logSkippedStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled console group for skipped components
 * Starts a group with the same styling as logSkipped.
 */
export function groupSkipped(prefix: string, message: string): void {
  groupSkippedStyled(prefix, message, styledLoggerOptions);
}

/**
 * Styled logging for identical value warnings with theme-aware colors
 * Prefix is monochrome, icon+message are styled: "  │   ⚠️ Identical value: {x:1} → {x:1}"
 */
export function logIdenticalStateValueWarning(
  prefix: string,
  message: string
): void {
  logIdenticalStateValueWarningStyled(prefix, message, styledLoggerOptions);
}

export function logIdenticalPropValueWarning(
  prefix: string,
  message: string
): void {
  logIdenticalPropValueWarningStyled(prefix, message, styledLoggerOptions);
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

/**
 * Starts a styled console group with optional definitive render styling.
 */
export function groupStyled(
  prefix: string,
  message: string,
  isDefinitive: boolean = false
): void {
  groupStyledStyled(prefix, message, isDefinitive, styledLoggerOptions);
}
