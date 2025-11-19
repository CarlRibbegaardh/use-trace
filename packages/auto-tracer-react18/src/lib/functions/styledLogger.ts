/**
 * Barrel export for styled logger functionality.
 * Re-exports types and functions from styledLogger/ subdirectory.
 */

// Types
export type { ColorPalette } from "./styledLogger/ColorPalette.js";
export type { StyledLoggerOptions } from "./styledLogger/StyledLoggerOptions.js";

// All logger functions
export {
  logDefinitive,
  groupDefinitive,
  logPropChange,
  logStateChange,
  logLogStatement,
  logWarnStatement,
  logErrorStatement,
  logReconciled,
  groupReconciled,
  logSkipped,
  groupSkipped,
  logIdenticalStateValueWarning,
  logIdenticalPropValueWarning,
  logStyled,
  groupStyled,
} from "./styledLogger/loggers/index.js";
