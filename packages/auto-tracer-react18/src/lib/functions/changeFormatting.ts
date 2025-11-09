import { stringify } from "./stringify.js";

/**
 * Format a value for display in prop changes
 * Functions are always shown as (fn:id) with identity tracking
 */
export function formatPropValue(value: unknown): string {
  return stringify(value);
}

/**
 * Format a prop change for display
 */
export function formatPropChange(before: unknown, after: unknown): string {
  return `${stringify(before)} → ${stringify(after)}`;
}

/**
 * Format a state value for display
 * Functions are always shown as (fn:id) with identity tracking
 */
export function formatStateValue(value: unknown): string {
  return stringify(value);
}

/**
 * Format a state change for display
 */
export function formatStateChange(before: unknown, after: unknown): string {
  return `${stringify(before)} → ${stringify(after)}`;
}
