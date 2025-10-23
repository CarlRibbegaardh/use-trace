/**
 * Validation utilities for autoTracer options
 */

import type { AutoTracerOptions } from "../interfaces/AutoTracerOptions.js";
import { logWarn } from "./log.js";

/**
 * Validates and clamps maxFiberDepth to safe bounds
 * @param depth - The depth value to validate
 * @returns Clamped depth value between 20 and 1000
 */
export function validateMaxFiberDepth(depth: number | undefined): number {
  // Default to 100 if not provided
  if (depth === undefined || depth === null) {
    return 100;
  }

  // Ensure it's a valid number
  if (typeof depth !== "number" || isNaN(depth)) {
    logWarn("AutoTracer: Invalid maxFiberDepth, using default (100)");
    return 100;
  }

  // Clamp between 20 and 1000
  if (depth < 20) {
    logWarn("AutoTracer: maxFiberDepth too low, using minimum (20)");
    return 20;
  }

  if (depth > 1000) {
    logWarn("AutoTracer: maxFiberDepth too high, using maximum (1000)");
    return 1000;
  }

  return Math.floor(depth); // Ensure integer
}

/**
 * Validates an entire AutoTracerOptions object
 * @param options - Options to validate
 * @returns Validated options with safe values
 */
export function validateAutoTracerOptions(
  options: AutoTracerOptions
): AutoTracerOptions {
  return {
    ...options,
    maxFiberDepth: validateMaxFiberDepth(options.maxFiberDepth),
  };
}
