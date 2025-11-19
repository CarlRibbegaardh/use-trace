import type { ColorOptions } from "../../interfaces/AutoTracerOptions.js";

/**
 * Color palette mapping for different log message types.
 * Each key corresponds to a specific styling category used by styled loggers.
 */
export type ColorPalette = {
  definitiveRender?: ColorOptions;
  propChange?: ColorOptions;
  propInitial?: ColorOptions;
  stateChange?: ColorOptions;
  stateInitial?: ColorOptions;
  logStatements?: ColorOptions;
  warnStatements?: ColorOptions;
  errorStatements?: ColorOptions;
  reconciled?: ColorOptions;
  skipped?: ColorOptions;
  // Split identical value warning styling for state and prop
  identicalStateValueWarning?: ColorOptions;
  identicalPropValueWarning?: ColorOptions;
};
