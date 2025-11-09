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

  /**
   * Filter mode for collapsing empty nodes in the component tree.
   *
   * Empty nodes are components that render without meaningful content:
   * - No state changes
   * - No prop changes
   * - No component logs
   * - Not tracked (no trackingGUID)
   * - No identical value warnings
   * - Visibility-filtered nodes (Reconciled when includeReconciled=false, Skipped when includeSkipped=false)
   *
   * Filter modes:
   *
   * **"none"** (default):
   * - No filtering applied
   * - All nodes appear in the tree regardless of content
   * - Zero performance overhead (identity function)
   * - Use when you need complete visibility into the component hierarchy
   *
   * **"first"**:
   * - Collapses only the initial sequence of empty nodes at the start of the tree
   * - Replaces consecutive empty nodes with a single marker: "... (N empty levels)"
   * - Preserves all empty nodes that appear after the first non-empty node
   * - Useful for cleaning up top-level wrapper components while maintaining full visibility deeper in the tree
   *
   * **"all"**:
   * - Collapses all empty node sequences throughout the entire tree
   * - Each sequence of consecutive empty nodes becomes a marker: "... (N empty levels)"
   * - Provides the most compact view by removing all noise
   * - Useful for focusing on components with actual state/prop changes or logs
   *
   * Performance characteristics:
   * - "none": O(1) - identity function, no processing
   * - "first": O(n) - single pass, stops at first non-empty node
   * - "all": O(n) - single pass over entire array
   *
   * Markers preserve:
   * - Depth of the first empty node in the collapsed sequence
   * - Count of collapsed nodes (singular "level" or plural "levels")
   *
   * @example
   * ```typescript
   * // No filtering - see everything
   * { filterEmptyNodes: 'none' }
   *
   * // Clean up wrapper components at the top
   * { filterEmptyNodes: 'first' }
   *
   * // Maximum clarity - only show meaningful renders
   * { filterEmptyNodes: 'all' }
   * ```
   *
   * @default 'none'
   */
  filterEmptyNodes?: "none" | "first" | "all";

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
