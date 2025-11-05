import type { TransformConfig } from "../../interfaces/TransformConfig.js";

/**
 * DEFAULT_CONFIG
 *
 * The default, normalized configuration used by the transform when no user configuration is supplied.
 * Keep this as the single source of truth for default values.
 */
export const DEFAULT_CONFIG: Required<TransformConfig> = {
  mode: "opt-in",
  include: ["**/*.tsx", "**/*.jsx"],
  exclude: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"],
  serverComponents: false,
  importSource: "@auto-tracer/react18",
  labelHooks: ["useState", "useReducer"],
  labelHooksPattern: "",
};
