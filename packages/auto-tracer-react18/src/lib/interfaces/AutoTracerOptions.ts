interface ThemeOptions {
  background?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
}
interface ColorOptions {
  darkMode?: ThemeOptions;
  lightMode?: ThemeOptions;
  icon?: string;
}
interface SkippedObjectProp {
  objectName: string;
  propNames: string[];
}

/**
 * Configuration options for detecting and warning about identical value changes.
 * This helps identify performance anti-patterns where components re-render due to
 * new object/array/function references that contain identical values.
 */
// Removed advanced configuration in favor of a simple boolean per spec
// Detect identical value changes: when references differ but stringified values are equal
type DetectIdenticalValueChanges = boolean;

interface AutoTracerOptions {
  enabled?: boolean; // Enable/disable the entire autoTracer (default: true)
  includeReconciled?: boolean;
  includeSkipped?: boolean;
  showFlags?: boolean;
  enableAutoTracerInternalsLogging?: boolean;
  maxFiberDepth?: number; // Maximum fiber traversal depth (20-1000, default: 100)
  skipNonTrackedBranches?: boolean; // Skip components that aren't tracked or in parent chain of tracked (default: true)
  skippedObjectProps?: SkippedObjectProp[]; // Skip specific props for specific object types (default: [])
  detectIdenticalValueChanges?: DetectIdenticalValueChanges; // Detect and warn about identical value changes

  // Styling options changed to colors object below
  // definitiveRenderColor?: string;
  // propChangeColor?: string;
  // stateChangeColor?: string;
  // showDefinitiveIcon?: boolean;

  colors?: {
    definitiveRender?: ColorOptions; // Light Default: #0044ff, Bold, ⚡
    propInitial?: ColorOptions; // Light Default: #ff00f2, Italic
    propChange?: ColorOptions; // Light Default: #ff00f2
    stateInitial?: ColorOptions; // Light Default: #ff9100, Italic
    stateChange?: ColorOptions; // Light Default: #ff9100
    logStatements?: ColorOptions; // Light Default: #00aa00
    reconciled?: ColorOptions; // Light Default: #6b7280 (Gray-500)
    skipped?: ColorOptions; // Light Default: #9ca3af (Gray-400)
    // Distinct styling for identical value warnings to layer on top of existing state/prop themes
    // Hue can be omitted; we inherit base theme styling from state/prop change themes
    identicalStateValueWarning?: ColorOptions; // Uses same icon as prop; no specific hue required by default
    identicalPropValueWarning?: ColorOptions; // Uses same icon as state; no specific hue required by default
    other?: ColorOptions; // Light Default: #000000
  };
}

export type {
  AutoTracerOptions,
  ThemeOptions,
  ColorOptions,
  SkippedObjectProp,
  DetectIdenticalValueChanges,
};
