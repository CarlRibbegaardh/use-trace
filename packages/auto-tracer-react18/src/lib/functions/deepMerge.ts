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
  if (source.includeMount !== undefined) {
    result.includeMount = source.includeMount;
  }
  if (source.includeRendered !== undefined) {
    result.includeRendered = source.includeRendered;
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
  if (source.includeNonTrackedBranches !== undefined) {
    result.includeNonTrackedBranches = source.includeNonTrackedBranches;
  }
  if (source.skippedObjectProps !== undefined) {
    result.skippedObjectProps = source.skippedObjectProps;
  }
  if (source.detectIdenticalValueChanges !== undefined) {
    result.detectIdenticalValueChanges = source.detectIdenticalValueChanges;
  }
  if (source.filterEmptyNodes !== undefined) {
    result.filterEmptyNodes = source.filterEmptyNodes;
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

    if (source.colors.logStatements) {
      result.colors.logStatements = {
        ...target.colors?.logStatements,
        ...source.colors.logStatements,
        lightMode: {
          ...target.colors?.logStatements?.lightMode,
          ...source.colors.logStatements.lightMode,
        },
        darkMode: {
          ...target.colors?.logStatements?.darkMode,
          ...source.colors.logStatements.darkMode,
        },
      };
    }

    if (source.colors.warnStatements) {
      result.colors.warnStatements = {
        ...target.colors?.warnStatements,
        ...source.colors.warnStatements,
        lightMode: {
          ...target.colors?.warnStatements?.lightMode,
          ...source.colors.warnStatements.lightMode,
        },
        darkMode: {
          ...target.colors?.warnStatements?.darkMode,
          ...source.colors.warnStatements.darkMode,
        },
      };
    }

    if (source.colors.errorStatements) {
      result.colors.errorStatements = {
        ...target.colors?.errorStatements,
        ...source.colors.errorStatements,
        lightMode: {
          ...target.colors?.errorStatements?.lightMode,
          ...source.colors.errorStatements.lightMode,
        },
        darkMode: {
          ...target.colors?.errorStatements?.darkMode,
          ...source.colors.errorStatements.darkMode,
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

    if (source.colors.identicalStateValueWarning) {
      result.colors.identicalStateValueWarning = {
        ...target.colors?.identicalStateValueWarning,
        ...source.colors.identicalStateValueWarning,
        lightMode: {
          ...target.colors?.identicalStateValueWarning?.lightMode,
          ...source.colors.identicalStateValueWarning.lightMode,
        },
        darkMode: {
          ...target.colors?.identicalStateValueWarning?.darkMode,
          ...source.colors.identicalStateValueWarning.darkMode,
        },
      };
    }

    if (source.colors.identicalPropValueWarning) {
      result.colors.identicalPropValueWarning = {
        ...target.colors?.identicalPropValueWarning,
        ...source.colors.identicalPropValueWarning,
        lightMode: {
          ...target.colors?.identicalPropValueWarning?.lightMode,
          ...source.colors.identicalPropValueWarning.lightMode,
        },
        darkMode: {
          ...target.colors?.identicalPropValueWarning?.darkMode,
          ...source.colors.identicalPropValueWarning.darkMode,
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
