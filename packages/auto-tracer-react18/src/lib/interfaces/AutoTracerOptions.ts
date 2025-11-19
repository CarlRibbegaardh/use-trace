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
 * Controls visibility of non-tracked components in the tree.
 * Tracked components (those with useAutoTracer) are ALWAYS visible regardless of these settings.
 *
 * @example
 * "never" - Never show non-tracked components of this type
 * "forProps" - Show only if component has initial props or prop changes
 * "forState" - Show only if component has initial state or state changes
 * "forPropsOrState" - Show if component has props OR state (most common for curious users)
 * "always" - Always show non-tracked components of this type (full debug mode)
 */
type NonTrackedComponentVisibility =
  | "never"
  | "forProps"
  | "forState"
  | "forPropsOrState"
  | "always";

/**
 * Configuration options for detecting and warning about identical value changes.
 * This helps identify performance anti-patterns where components re-render due to
 * new object/array/function references that contain identical values.
 */
// Removed advanced configuration in favor of a simple boolean per spec
// Detect identical value changes: when references differ but stringified values are equal
type DetectIdenticalValueChanges = boolean;

interface AutoTracerOptions {
  /**
   * Enable or disable the entire autoTracer system.
   * When false, no tracing will occur and performance overhead is minimal.
   * @default true
   */
  enabled?: boolean;

  /**
   * Control visibility of reconciled non-tracked components.
   * Reconciled components are those that React checked but didn't need to re-render.
   *
   * Tracked components are ALWAYS visible regardless of this setting.
   *
   * - "never": Hide all reconciled non-tracked components
   * - "forProps": Show only if has props changes
   * - "forState": Show only if has state changes
   * - "forPropsOrState": Show if has props OR state
   * - "always": Show all reconciled components
   *
   * @default "never"
   */
  includeReconciled?: NonTrackedComponentVisibility;

  /**
   * Control visibility of skipped non-tracked components.
   * Skipped components are those where React did internal work but didn't execute the component function.
   *
   * Tracked components are ALWAYS visible regardless of this setting.
   *
   * - "never": Hide all skipped non-tracked components
   * - "forProps": Show only if has props changes
   * - "forState": Show only if has state changes
   * - "forPropsOrState": Show if has props OR state
   * - "always": Show all skipped components
   *
   * @default "never"
   */
  includeSkipped?: NonTrackedComponentVisibility;

  /**
   * Control visibility of mount non-tracked components.
   * Mount components are those rendering for the first time.
   *
   * Tracked components are ALWAYS visible regardless of this setting.
   *
   * - "never": Hide all mount non-tracked components
   * - "forProps": Show only if has initial props
   * - "forState": Show only if has initial state
   * - "forPropsOrState": Show if has props OR state
   * - "always": Show all mount components
   *
   * @default "never"
   */
  includeMount?: NonTrackedComponentVisibility;

  /**
   * Control visibility of rendered (update phase) non-tracked components.
   * Rendered components are those re-rendering due to props/state changes.
   *
   * Tracked components are ALWAYS visible regardless of this setting.
   *
   * - "never": Hide all rendered non-tracked components
   * - "forProps": Show only if has props changes
   * - "forState": Show only if has state changes
   * - "forPropsOrState": Show if has props OR state
   * - "always": Show all rendered components
   *
   * @default "never"
   */
  includeRendered?: NonTrackedComponentVisibility;

  /**
   * Show React fiber flags in the output.
   * Flags indicate internal React operations like Placement, Update, etc.
   * Useful for deep debugging of React's reconciliation process.
   * @default false
   */
  showFlags?: boolean;

  /**
   * Enable detailed internal logging for autoTracer debugging.
   * Shows depth levels, traversal information, and other internal details.
   * Primarily useful for debugging autoTracer itself.
   * @default false
   */
  enableAutoTracerInternalsLogging?: boolean;

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

  /**
   * Selects the output format for the component tree.
   *
   * - "indented": Traditional text-based indentation (default).
   *   Best for copy-pasting and general readability.
   *   Example:
   *   ├─ [Parent]
   *   │   └─ [Child]
   *
   * - "console-group": Uses browser's native console.group().
   *   Best for interactive debugging, filtering, and deep trees.
   *   Allows collapsing/expanding sections in DevTools.
   *
   * @default "indented"
   */
  renderer?: "indented" | "console-group";

  /**
   * Control the format of object values (props, state, logs) in the console.
   *
   * - "copy-paste": Values are stringified and formatted for easy copy-pasting (default).
   * - "devtools-json": Values are logged as interactive JavaScript objects for inspection in DevTools.
   *
   * @default "copy-paste"
   */
  objectRenderingMode?: "copy-paste" | "devtools-json";

  /**
   * Maximum depth to traverse in the React fiber tree.
   * Prevents stack overflow in deeply nested component hierarchies.
   * Valid range: 20-1000
   * @default 100
   */
  maxFiberDepth?: number;

  /**
   * Include all component branches in the output, even those without tracked components.
   * When false (default), only shows tracked components and their ancestor chain.
   * When true, shows all components regardless of tracking status.
   * If you don't inject useAutoTracer using one of the plugins, this needs to be true to see any output.
   * @default false
   */
  includeNonTrackedBranches?: boolean;

  /**
   * Skip specific props for specific components to reduce noise in the output.
   * Useful for ignoring props that change frequently but aren't relevant for debugging
   * (e.g., theme objects, styling props, callback references).
   * @default []
   * @example
   * ```typescript
   * skippedObjectProps: [
   *   { objectName: 'Button', propNames: ['theme', 'sx'] },
   *   { objectName: 'Input', propNames: ['onChange'] }
   * ]
   * ```
   */
  skippedObjectProps?: SkippedObjectProp[];

  /**
   * Detect and warn about identical value changes.
   * Helps identify performance anti-patterns where components re-render due to
   * new object/array/function references that contain identical values.
   * When enabled, shows warnings like "⚠️ Identical value" for these cases.
   * @default false
   */
  detectIdenticalValueChanges?: DetectIdenticalValueChanges;

  /**
   * Color and styling configuration for different types of render output.
   * Supports both light and dark mode themes with customizable colors, icons, and text styles.
   */
  colors?: {
    /** Styling for definitive renders (tracked components that actually rendered). Default: #0044ff, Bold, ⚡ */
    definitiveRender?: ColorOptions;

    /** Styling for initial prop values on mount. Default: #ff00f2, Italic */
    propInitial?: ColorOptions;

    /** Styling for prop changes. Default: #ff00f2 */
    propChange?: ColorOptions;

    /** Styling for initial state values on mount. Default: #ff9100, Italic */
    stateInitial?: ColorOptions;

    /** Styling for state changes. Default: #ff9100 */
    stateChange?: ColorOptions;

    /** Styling for component log statements. Default: #00aa00 */
    logStatements?: ColorOptions;

    /** Styling for component log statements.
     * Light: Foreground: #000000, Background: #fbf6d7, ⚠️
     * Dark: Foreground: #f9f2a3, Background: #3f3c28, ⚠️   */
    warnStatements?: ColorOptions;

    /** Styling for component log statements.
     * Default: Foreground: #000000, Background: #f6eceb, ⛔
     * Default: Foreground: #f0dfd2, Background: #473635, ⛔  */
    errorStatements?: ColorOptions;

    /** Styling for reconciled components (evaluated but not changed). Default: #6b7280 (Gray-500) */
    reconciled?: ColorOptions;

    /** Styling for skipped components (internal work only). Default: #9ca3af (Gray-400) */
    skipped?: ColorOptions;

    /** Styling for identical state value warnings. Inherits from stateChange theme by default. */
    identicalStateValueWarning?: ColorOptions;

    /** Styling for identical prop value warnings. Inherits from propChange theme by default. */
    identicalPropValueWarning?: ColorOptions;

    /** Styling for other/unknown component types. Default: #000000 */
    other?: ColorOptions;
  };
}

export type {
  AutoTracerOptions,
  NonTrackedComponentVisibility,
  ThemeOptions,
  ColorOptions,
  SkippedObjectProp,
  DetectIdenticalValueChanges,
};
