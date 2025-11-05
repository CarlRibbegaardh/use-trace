import type { TransformConfig } from "../../interfaces/TransformConfig.js";
import { DEFAULT_CONFIG } from "./DEFAULT_CONFIG.js";

/**
 * normalizeConfig
 *
 * Returns a fully-populated configuration by merging user-provided partial values
 * with the DEFAULT_CONFIG. This function is the canonical way to obtain a
 * Required<TransformConfig> for downstream logic.
 */
export function normalizeConfig(
  config: Partial<TransformConfig> = {}
): Required<TransformConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}
