import type { TransformConfig } from "../../interfaces/TransformConfig.js";
import { matchesPattern } from "./matchesPattern.js";

/**
 * shouldProcessFile
 *
 * Applies include/exclude logic to determine whether a file should be transformed.
 * Exclude patterns are evaluated first, then include patterns must match.
 */
export function shouldProcessFile(
  filepath: string,
  config: Required<TransformConfig>
): boolean {
  // Check exclude patterns first
  if (matchesPattern(filepath, config.exclude)) {
    return false;
  }

  // Check include patterns
  return matchesPattern(filepath, config.include);
}
