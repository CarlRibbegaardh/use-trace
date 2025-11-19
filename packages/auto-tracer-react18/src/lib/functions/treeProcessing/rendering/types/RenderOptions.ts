/**
 * Rendering options passed to node detail rendering functions.
 * Explicit alternative to reading from global state.
 */
export interface RenderOptions {
  /**
   * Output format mode.
   * - "copy-paste": Text format optimized for copy-pasting
   * - "devtools-json": Interactive objects for DevTools inspection
   */
  readonly objectRenderingMode: "copy-paste" | "devtools-json";

  /**
   * Whether to detect and warn about identical value changes.
   * When true, shows warnings for new references with identical content.
   */
  readonly detectIdenticalValueChanges: boolean;

  /**
   * Indentation prefix for output lines.
   * Empty string for console-group renderer.
   */
  readonly prefix: string;

  /**
   * Component display name for filtering skipped props.
   */
  readonly displayName?: string;
}
