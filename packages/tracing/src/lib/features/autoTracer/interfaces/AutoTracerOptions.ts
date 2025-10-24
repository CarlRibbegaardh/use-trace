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

interface AutoTracerOptions {
  enabled?: boolean; // Enable/disable the entire autoTracer (default: true)
  includeReconciled?: boolean;
  includeSkipped?: boolean;
  showFlags?: boolean;
  enableAutoTracerInternalsLogging?: boolean;
  maxFiberDepth?: number; // Maximum fiber traversal depth (20-1000, default: 100)
  showFunctionContentOnChange?: boolean; // Show full function content in prop changes (default: false)
  skipNonTrackedBranches?: boolean; // Skip components that aren't tracked or in parent chain of tracked (default: true)
  skippedObjectProps?: SkippedObjectProp[]; // Skip specific props for specific object types (default: [])

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
    reconciled?: ColorOptions; // Light Default: #6b7280 (Gray-500)
    skipped?: ColorOptions; // Light Default: #9ca3af (Gray-400)
    other?: ColorOptions; // Light Default: #000000
  };
}

export type {
  AutoTracerOptions,
  ThemeOptions,
  ColorOptions,
  SkippedObjectProp,
};
