/**
 * Manual React DevTools Hook Polyfill for Vitest
 *
 * WHY THIS FILE EXISTS:
 * ===================
 * We need the React DevTools hook to be available BEFORE React loads, or React won't connect to it.
 *
 * WHY NOT USE react-devtools-core's initialize()?
 * ================================================
 * The react-devtools-core package provides an initialize() function that calls installHook().
 * However, installHook() uses Object.defineProperty() to create a GETTER for the hook:
 *
 *   Object.defineProperty(target, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
 *     configurable: __DEV__,
 *     enumerable: false,
 *     get() { return hook; }  // <-- hook is in a closure
 *   });
 *
 * This doesn't work with Vitest because:
 * 1. Vitest's globalSetup runs in a SEPARATE Node.js process
 * 2. That process exits before tests run
 * 3. Test workers are NEW processes with fresh JavaScript contexts
 * 4. The property descriptor and closure state DON'T TRANSFER across processes
 *
 * WHY THIS APPROACH WORKS:
 * ========================
 * 1. This file runs in setupFiles (see vitest.config.ts)
 * 2. setupFiles execute INSIDE EACH test worker process
 * 3. We create a plain object property, not a getter
 * 4. The hook lives in the same memory space as the tests
 *
 * IMPLEMENTATION NOTES:
 * =====================
 * This is a minimal implementation based on react-devtools-shared/src/hook.js.
 * It includes all methods React 18 expects:
 * - supportsFiber: true (required for React 16+)
 * - supportsFlight: true (required for React Flight/Server Components)
 * - checkDCE() (React checks for dead code elimination)
 * - onCommitFiberRoot/onCommitFiberUnmount (React's lifecycle hooks)
 * - onPostCommitFiberRoot/setStrictMode (React 18+ features)
 * - Event system (emit/on/off/sub)
 * - Profiler helpers (getInternalModuleRanges, etc.)
 */

(globalThis as any).window = globalThis;
(globalThis as any).self = globalThis;

// Event listener storage
const listeners: Record<string, Array<(data: any) => void>> = {};
let uidCounter = 0;

(globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  renderers: new Map(),
  rendererInterfaces: new Map(),
  listeners,
  backends: new Map(),
  hasUnsupportedRendererAttached: false,

  // React v16+ compatibility flag
  supportsFiber: true,

  // React Flight Client compatibility flag
  supportsFlight: true,

  inject(renderer: unknown) {
    console.log(">>> React renderer injected", renderer);
    const id = ++uidCounter;
    this.renderers.set(id, renderer);
    this.emit("renderer", { id, renderer, reactBuildType: "production" });
    return id;
  },

  checkDCE(fn: Function) {
    // Minimal implementation - React checks for dead code elimination
    // In tests we can just no-op this
  },

  onCommitFiberRoot(id: unknown, root: unknown, priorityLevel?: unknown) {
    //console.log(">>> onCommitFiberRoot", id, root);
  },

  onCommitFiberUnmount(id: unknown, fiber: unknown) {
    //console.log(">>> onCommitFiberUnmount", id, fiber);
  },

  // React v18.0+
  onPostCommitFiberRoot(id: unknown, root: unknown) {
    // Optional hook for post-commit work
  },

  setStrictMode(id: unknown, isStrictMode: boolean) {
    // StrictMode console patching - can be no-op in tests
  },

  emit(event: string, data: any) {
    if (listeners[event]) {
      listeners[event].forEach((fn) => fn(data));
    }
  },

  on(event: string, fn: (data: any) => void) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(fn);
  },

  off(event: string, fn: (data: any) => void) {
    if (!listeners[event]) return;
    const index = listeners[event].indexOf(fn);
    if (index !== -1) {
      listeners[event].splice(index, 1);
    }
  },

  sub(event: string, fn: (data: any) => void) {
    this.on(event, fn);
    return () => this.off(event, fn);
  },

  getFiberRoots(rendererID: number) {
    // Return empty set - not needed for basic functionality
    return new Set();
  },

  // Schedule Profiler runtime helpers
  getInternalModuleRanges() {
    return [];
  },

  registerInternalModuleStart(moduleStartError: Error) {
    // No-op for tests
  },

  registerInternalModuleStop(moduleStopError: Error) {
    // No-op for tests
  },
};
