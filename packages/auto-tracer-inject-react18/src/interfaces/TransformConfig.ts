/**
 * Options that control how the Auto Tracer code transform behaves.
 *
 * These options are forwarded by the Vite plugin, so they can be configured
 * directly in your `vite.config.ts` inside the `autoTracer.vite({...})` call.
 *
 * @example
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { autoTracer } from '@auto-tracer/plugin-vite-react18';
 *
 * export default defineConfig(({ mode }) => ({
 *   plugins: [
 *     mode === 'development' &&
 *       autoTracer.vite({
 *         mode: 'opt-out',
 *         importSource: '@auto-tracer/react18',
 *         include: ['src/**\/*.tsx'],
 *         exclude: ['**\/*.spec.*', '**\/*.test.*'],
 *         labelHooks: ['useState', 'useReducer', 'useSelector', 'useAppSelector'],
 *         // Example regex string to label custom hooks too
 *         labelHooksPattern: '^use[A-Z].*',
 *       }),
 *     react(),
 *   ].filter(Boolean),
 * }));
 */
export interface TransformConfig {
  /**
   * Controls how components are selected for injection.
   *
   * - `opt-in`: Only files matching `include` (and not matching `exclude`) are transformed.
   * - `opt-out`: All files are eligible except those matching `exclude`.
   *
   * Pragmas (compile-time attributes) and precedence
   * -----------------------------------------------
   * In addition to `mode` and glob patterns, the transformer honors file- or
   * component-level pragma comments to override behavior on a narrower scope.
   * The exact pragma tokens are configurable; the examples below are
   * illustrative only.
   *
   * - In `opt-in`, files must still match `include`; pragmas can enable
   *   tracing within an included file or for specific components.
   * - In `opt-out`, a pragma that disables tracing can opt-out a file or
   *   component even though it would otherwise be included.
   * - Component-level pragma overrides file-level pragma for that component.
   * - A "disable" pragma wins over an "enable" pragma when both apply.
   * - File-level `exclude` still prevents the file from being processed at all
   *   (pragmas do not bypass `exclude`).
   *
   * Examples (illustrative pragma names):
   * // File-level opt-out in an opt-out project
   * // @tracing:disable
   *
   * // Force-enable a specific component in an opt-in project
   * // @tracing:enable
   * export function MyComponent() { … }
   *
   * // Disable only the next component in an otherwise traced file
   * // @tracing:disable-next
   * export const HeavyComponent = function() { … };
   *
   * @example
   * // Safest during initial adoption
   * mode: 'opt-in'
   *
   * @example
   * // Enable broadly in development, then explicitly exclude if needed
   * mode: 'opt-out'
   */
  mode: "opt-in" | "opt-out";
  /**
   * Glob patterns of files to include in the transform.
   * Only relevant when `mode` is `opt-in` (recommended for gradual rollout).
   *
   * Uses Vite/rollup-style globs relative to the project root.
   *
   * @example
   * include: ['src/**\/*.tsx']
   */
  include?: string[];
  /**
   * Glob patterns of files to exclude from the transform.
   *
   * This is applied in both modes, and is particularly useful to skip tests,
   * stories, or build artifacts.
   *
   * @example
   * exclude: ['**\/*.spec.*', '**\/*.test.*', 'src/mocks/**']
   */
  exclude?: string[];
  /**
  * Enable React Server Components (RSC) safety checks.
  *
  * When `true`, the transformer will treat files as Server Modules by default
  * and will NOT inject anything unless the module is explicitly marked as a
  * Client Component via the standard directive:
  *
  *   "use client";
  *
  * Implementation details:
  * - We parse top-level directives and consider a module a Client Component
  *   only if it contains a literal directive whose value is exactly
  *   `"use client"`.
  * - If the directive is present, normal transform rules (mode/include/
  *   exclude/pragma) apply and injection can occur.
  * - If the directive is NOT present, the transform returns the original
  *   code unmodified to avoid injecting client-only hooks into server code.
  *
  * When `false` (default), no special RSC gating is applied; the transform
  * proceeds based on `mode`, `include`, `exclude`, and pragmas.
  *
  * Notes:
  * - This flag does not auto-detect framework environments; it is a
  *   conservative guard you should enable in RSC-aware toolchains (e.g.,
  *   Next.js App Router) to prevent accidental client code injection.
  * - Behavior is intentionally minimal and safe-by-default when enabled.
   */
  serverComponents?: boolean;
  /**
   * The module specifier to import runtime helpers from when injecting.
   */
  importSource?: string;
  /**
   * Names of hooks that should be automatically labeled.
   */
  labelHooks?: string[];
  /**
   * Optional regex string to match additional hook names to label.
   */
  labelHooksPattern?: string;
}
