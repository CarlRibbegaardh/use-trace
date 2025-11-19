import merge from "deepmerge";
import type { AutoTracerOptions } from "../interfaces/AutoTracerOptions.js";

/**
 * Deep merge utility for AutoTracerOptions.
 * Recursively merges nested color configurations and all other properties.
 * Uses the battle-tested `deepmerge` library for immutable, predictable merging.
 *
 * Configuration:
 * - Arrays are replaced (not concatenated) to preserve reference identity
 * - Undefined source values are filtered out before merging (target values are preserved)
 */
export function deepMergeOptions(
  target: AutoTracerOptions,
  source: Partial<AutoTracerOptions>
): AutoTracerOptions {
  // Filter out undefined values from source before merging
  const filteredSource = Object.fromEntries(
    Object.entries(source).filter(([_, value]) => {
      return value !== undefined;
    })
  ) as Partial<AutoTracerOptions>;

  return merge(target, filteredSource, {
    // Replace arrays instead of concatenating (preserves array reference)
    arrayMerge: (_target, source) => {
      return source;
    },
  }) as AutoTracerOptions;
}
