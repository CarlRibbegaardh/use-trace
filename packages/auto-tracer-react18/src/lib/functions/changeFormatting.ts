import { stringify } from "./stringify.js";

/**
 * Options for formatting values and changes
 */
export interface FormatOptions {
  showFunctionContent: boolean;
}

/**
 * Format a value for display in prop changes, respecting the showFunctionContentOnChange setting
 */
export function formatPropValue(value: unknown, options: FormatOptions): string {
  if (typeof value === "function") {
    if (options.showFunctionContent) {
      return stringify(value);
    } else {
      return "[Function]";
    }
  }
  return stringify(value);
}

/**
 * Format a prop change for display, respecting the showFunctionContentOnChange setting
 */
export function formatPropChange(before: unknown, after: unknown, options: FormatOptions): string {
  if (
    typeof before === "function" &&
    !options.showFunctionContent
  ) {
    return "[Function changed]";
  }

  return `${stringify(before)} → ${stringify(after)}`;
}

/**
 * Format a state value for display, respecting the showFunctionContentOnChange setting
 */
export function formatStateValue(value: unknown, options: FormatOptions): string {
  if (typeof value === "function") {
    if (options.showFunctionContent) {
      return stringify(value);
    } else {
      return "[Function]";
    }
  }
  return stringify(value);
}

/**
 * Format a state change for display, respecting the showFunctionContentOnChange setting
 */
export function formatStateChange(before: unknown, after: unknown, options: FormatOptions): string {
  if (
    typeof before === "function" &&
    !options.showFunctionContent
  ) {
    return "[Function changed]";
  }

  return `${stringify(before)} → ${stringify(after)}`;
}
