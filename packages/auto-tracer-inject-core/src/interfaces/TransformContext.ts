import type { TransformConfig } from "./TransformConfig.js";

/**
 * Transformation context containing filename and configuration.
 */
export interface TransformContext {
  filename: string;
  config: TransformConfig;
}
