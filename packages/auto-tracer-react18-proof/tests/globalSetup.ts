/**
 * DEPRECATED: Global setup for Vitest
 * ====================================
 *
 * This approach did NOT work for initializing the React DevTools hook.
 *
 * WHY IT FAILED:
 * ==============
 * 1. Vitest's globalSetup runs in a SEPARATE Node.js process from test workers
 * 2. react-devtools-core's initialize() uses Object.defineProperty() to create
 *    a GETTER for __REACT_DEVTOOLS_GLOBAL_HOOK__ with the hook object in a closure
 * 3. When the globalSetup process exits, the property descriptor and closure are lost
 * 4. Test workers start with fresh JavaScript contexts that don't have the hook
 *
 * THE SOLUTION:
 * =============
 * See polyfill-globals.ts, which runs in setupFiles (inside each test worker).
 * It creates a plain object property instead of a getter, which persists in
 * the same memory space as the tests.
 *
 * This file is kept for documentation purposes but is not currently used.
 */
export default async function globalSetup() {
  console.log(
    "Global setup: Polyfilling browser globals for react-devtools-core..."
  );

  // Polyfill 'self' which react-devtools-core expects
  (globalThis as Record<string, unknown>).self = globalThis;
  (globalThis as Record<string, unknown>).window = globalThis;

  // Import and initialize after polyfill is in place
  console.log("Global setup: Initializing React DevTools hook...");

  const { initialize } = await import("react-devtools-core");
  initialize(null);

  console.log("Global setup: DevTools hook initialized");
}
