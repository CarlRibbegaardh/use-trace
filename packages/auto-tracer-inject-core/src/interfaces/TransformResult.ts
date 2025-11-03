import type { ComponentInfo } from "./ComponentInfo.js";

/**
 * Result of transforming a source file with Auto Tracer injection.
 */
export interface TransformResult {
  code: string;
  map?: any;
  injected: boolean;
  components: ComponentInfo[];
}
