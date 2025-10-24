import type { AutoTracerOptions } from "../interfaces/AutoTracerOptions.js";

/**
 * Deep merge utility specifically for AutoTracerOptions
 * Preserves nested color configurations when merging partial options
 */
export function deepMergeOptions(
  target: AutoTracerOptions,
  source: Partial<AutoTracerOptions>
): AutoTracerOptions {
  const result: AutoTracerOptions = { ...target };

  // Handle top-level properties
  if (source.includeReconciled !== undefined) {
    result.includeReconciled = source.includeReconciled;
  }
  if (source.includeSkipped !== undefined) {
    result.includeSkipped = source.includeSkipped;
  }
  if (source.showFlags !== undefined) {
    result.showFlags = source.showFlags;
  }
  if (source.enabled !== undefined) {
    result.enabled = source.enabled;
  }
  if (source.enableAutoTracerInternalsLogging !== undefined) {
    result.enableAutoTracerInternalsLogging =
      source.enableAutoTracerInternalsLogging;
  }
  if (source.maxFiberDepth !== undefined) {
    result.maxFiberDepth = source.maxFiberDepth;
  }
  if (source.showFunctionContentOnChange !== undefined) {
    result.showFunctionContentOnChange = source.showFunctionContentOnChange;
  }
  if (source.skipNonTrackedBranches !== undefined) {
    result.skipNonTrackedBranches = source.skipNonTrackedBranches;
  }
  if (source.skippedObjectProps !== undefined) {
    result.skippedObjectProps = source.skippedObjectProps;
  }

  // Handle nested colors object
  if (source.colors) {
    result.colors = { ...target.colors };

    // Merge each color configuration
    if (source.colors.definitiveRender) {
      result.colors.definitiveRender = {
        ...target.colors?.definitiveRender,
        ...source.colors.definitiveRender,
        lightMode: {
          ...target.colors?.definitiveRender?.lightMode,
          ...source.colors.definitiveRender.lightMode,
        },
        darkMode: {
          ...target.colors?.definitiveRender?.darkMode,
          ...source.colors.definitiveRender.darkMode,
        },
      };
    }

    if (source.colors.propInitial) {
      result.colors.propInitial = {
        ...target.colors?.propInitial,
        ...source.colors.propInitial,
        lightMode: {
          ...target.colors?.propInitial?.lightMode,
          ...source.colors.propInitial.lightMode,
        },
        darkMode: {
          ...target.colors?.propInitial?.darkMode,
          ...source.colors.propInitial.darkMode,
        },
      };
    }

    if (source.colors.propChange) {
      result.colors.propChange = {
        ...target.colors?.propChange,
        ...source.colors.propChange,
        lightMode: {
          ...target.colors?.propChange?.lightMode,
          ...source.colors.propChange.lightMode,
        },
        darkMode: {
          ...target.colors?.propChange?.darkMode,
          ...source.colors.propChange.darkMode,
        },
      };
    }

    if (source.colors.stateInitial) {
      result.colors.stateInitial = {
        ...target.colors?.stateInitial,
        ...source.colors.stateInitial,
        lightMode: {
          ...target.colors?.stateInitial?.lightMode,
          ...source.colors.stateInitial.lightMode,
        },
        darkMode: {
          ...target.colors?.stateInitial?.darkMode,
          ...source.colors.stateInitial.darkMode,
        },
      };
    }

    if (source.colors.stateChange) {
      result.colors.stateChange = {
        ...target.colors?.stateChange,
        ...source.colors.stateChange,
        lightMode: {
          ...target.colors?.stateChange?.lightMode,
          ...source.colors.stateChange.lightMode,
        },
        darkMode: {
          ...target.colors?.stateChange?.darkMode,
          ...source.colors.stateChange.darkMode,
        },
      };
    }

    if (source.colors.reconciled) {
      result.colors.reconciled = {
        ...target.colors?.reconciled,
        ...source.colors.reconciled,
        lightMode: {
          ...target.colors?.reconciled?.lightMode,
          ...source.colors.reconciled.lightMode,
        },
        darkMode: {
          ...target.colors?.reconciled?.darkMode,
          ...source.colors.reconciled.darkMode,
        },
      };
    }

    if (source.colors.skipped) {
      result.colors.skipped = {
        ...target.colors?.skipped,
        ...source.colors.skipped,
        lightMode: {
          ...target.colors?.skipped?.lightMode,
          ...source.colors.skipped.lightMode,
        },
        darkMode: {
          ...target.colors?.skipped?.darkMode,
          ...source.colors.skipped.darkMode,
        },
      };
    }

    if (source.colors.other) {
      result.colors.other = {
        ...target.colors?.other,
        ...source.colors.other,
        lightMode: {
          ...target.colors?.other?.lightMode,
          ...source.colors.other.lightMode,
        },
        darkMode: {
          ...target.colors?.other?.darkMode,
          ...source.colors.other.darkMode,
        },
      };
    }
  }

  return result;
}
