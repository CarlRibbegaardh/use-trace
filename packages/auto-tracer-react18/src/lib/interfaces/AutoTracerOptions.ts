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
  /**
   * Enable or disable the entire autoTracer system.
   * When false, no tracing will occur and performance overhead is minimal.
   * @default true
   */
  enabled?: boolean;

  /**
   * Include reconciled components in the output.
   * Reconciled components are those that React checked but didn't need to re-render.
   * Set to true to see all components React evaluates, even if they didn't change.
   * @default false
   */
  includeReconciled?: boolean;

  /**
   * Include skipped components in the output.
   * Skipped components are those where React did internal work but didn't execute the component function.
   * @default false
   */
  includeSkipped?: boolean;

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
  ThemeOptions,
  ColorOptions,
  SkippedObjectProp,
  DetectIdenticalValueChanges,
};
