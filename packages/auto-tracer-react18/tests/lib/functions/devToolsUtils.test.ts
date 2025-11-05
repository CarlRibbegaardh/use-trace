import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSafeRenderHook,
  getDevToolsHook,
  installRenderHook,
  isDevToolsAvailable,
  logDevToolsStatus,
  restoreRenderHook,
} from "@src/lib/functions/devToolsUtils.js";

// Mock log functions
vi.mock("@src/lib/functions/log.js", () => {
  return {
    log: vi.fn(),
    logError: vi.fn(),
    logWarn: vi.fn(),
  };
});

describe("devToolsUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window mock
    Object.defineProperty(globalThis, "window", {
      value: {},
      writable: true,
      configurable: true,
    });
  });

  describe("getDevToolsHook", () => {
    it("should return null when window is undefined", () => {
      // Simulate server-side environment
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const hook = getDevToolsHook();
      expect(hook).toBe(null);
    });

    it("should return null when React DevTools hook is not available", () => {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });

      const hook = getDevToolsHook();
      expect(hook).toBe(null);
    });

    it("should return the React DevTools hook when available", () => {
      const mockHook = {
        onCommitFiberRoot: vi.fn(),
      };

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: mockHook,
        },
        writable: true,
        configurable: true,
      });

      const hook = getDevToolsHook();
      expect(hook).toBe(mockHook);
    });

    it("should handle errors gracefully and return null", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      // Create a window object that throws when accessing the hook
      Object.defineProperty(globalThis, "window", {
        get() {
          throw new Error("Access denied");
        },
        configurable: true,
      });

      const hook = getDevToolsHook();
      expect(hook).toBe(null);
      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: Error accessing React DevTools hook:",
        expect.any(Error)
      );
    });
  });

  describe("isDevToolsAvailable", () => {
    it("should return false when DevTools hook is not available", () => {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });

      expect(isDevToolsAvailable()).toBe(false);
    });

    it("should return true when DevTools hook is available", () => {
      const mockHook = {
        onCommitFiberRoot: vi.fn(),
      };

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: mockHook,
        },
        writable: true,
        configurable: true,
      });

      expect(isDevToolsAvailable()).toBe(true);
    });

    it("should return false when window is undefined", () => {
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(isDevToolsAvailable()).toBe(false);
    });
  });

  describe("installRenderHook", () => {
    it("should return null when DevTools is not available", () => {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });

      const mockHook = vi.fn();
      const result = installRenderHook(mockHook);

      expect(result).toBe(null);
    });

    it("should install render hook and return original hook", () => {
      const originalHook = vi.fn();
      const newHook = vi.fn();
      const mockDevTools = {
        onCommitFiberRoot: originalHook,
      };

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: mockDevTools,
        },
        writable: true,
        configurable: true,
      });

      const result = installRenderHook(newHook);

      expect(result).toBe(originalHook);
      expect(mockDevTools.onCommitFiberRoot).toBe(newHook);
    });

    it("should use provided original hook when specified", () => {
      const currentHook = vi.fn();
      const newHook = vi.fn();
      const providedOriginal = vi.fn();
      const mockDevTools = {
        onCommitFiberRoot: currentHook,
      };

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: mockDevTools,
        },
        writable: true,
        configurable: true,
      });

      const result = installRenderHook(newHook, providedOriginal);

      expect(result).toBe(providedOriginal);
      expect(mockDevTools.onCommitFiberRoot).toBe(newHook);
    });

    it("should handle errors and return null", async () => {
      const { logError } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      // Create a DevTools object that throws when setting the hook
      const mockDevTools = {};
      Object.defineProperty(mockDevTools, "onCommitFiberRoot", {
        set() {
          throw new Error("Cannot set hook");
        },
        configurable: true,
      });

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: mockDevTools,
        },
        writable: true,
        configurable: true,
      });

      const newHook = vi.fn();
      const result = installRenderHook(newHook);

      expect(result).toBe(null);
      expect(logError).toHaveBeenCalledWith(
        "AutoTracer: Error installing render hook:",
        expect.any(Error)
      );
    });
  });

  describe("restoreRenderHook", () => {
    it("should return false when DevTools is not available", () => {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });

      const originalHook = vi.fn();
      const result = restoreRenderHook(originalHook);

      expect(result).toBe(false);
    });

    it("should restore the original hook and return true", () => {
      const currentHook = vi.fn();
      const originalHook = vi.fn();
      const mockDevTools = {
        onCommitFiberRoot: currentHook,
      };

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: mockDevTools,
        },
        writable: true,
        configurable: true,
      });

      const result = restoreRenderHook(originalHook);

      expect(result).toBe(true);
      expect(mockDevTools.onCommitFiberRoot).toBe(originalHook);
    });

    it("should handle errors and return false", async () => {
      const { logError } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      // Create a DevTools object that throws when setting the hook
      const mockDevTools = {};
      Object.defineProperty(mockDevTools, "onCommitFiberRoot", {
        set() {
          throw new Error("Cannot restore hook");
        },
        configurable: true,
      });

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: mockDevTools,
        },
        writable: true,
        configurable: true,
      });

      const originalHook = vi.fn();
      const result = restoreRenderHook(originalHook);

      expect(result).toBe(false);
      expect(logError).toHaveBeenCalledWith(
        "AutoTracer: Error restoring render hook:",
        expect.any(Error)
      );
    });
  });

  describe("createSafeRenderHook", () => {
    it("should return a function that calls the provided hook", () => {
      const mockHookFn = vi.fn();
      const safeHook = createSafeRenderHook(mockHookFn);

      expect(typeof safeHook).toBe("function");

      const rendererID = 1;
      const root = {};
      const priorityLevel = 2;

      safeHook!(rendererID, root, priorityLevel);

      expect(mockHookFn).toHaveBeenCalledWith(rendererID, root, priorityLevel);
    });

    it("should catch errors and not throw when hook function throws", () => {
      const mockHookFn = vi.fn(() => {
        throw new Error("Hook error");
      });
      const safeHook = createSafeRenderHook(mockHookFn);

      expect(() => {
        safeHook!(1, {}, 2);
      }).not.toThrow();

      expect(mockHookFn).toHaveBeenCalled();
    });

    it("should log errors when enableAutoTracerInternalsLogging is true", async () => {
      const { logError } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      const error = new Error("Hook error");
      const mockHookFn = vi.fn(() => {
        throw error;
      });
      const safeHook = createSafeRenderHook(mockHookFn, true);

      safeHook!(1, {}, 2);

      expect(logError).toHaveBeenCalledWith(
        "AutoTracer: Error in render hook:",
        error
      );
    });

    it("should not log errors when enableAutoTracerInternalsLogging is false", async () => {
      const { logError } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      const mockHookFn = vi.fn(() => {
        throw new Error("Hook error");
      });
      const safeHook = createSafeRenderHook(mockHookFn, false);

      safeHook!(1, {}, 2);

      expect(logError).not.toHaveBeenCalled();
    });

    it("should not log errors when enableAutoTracerInternalsLogging is undefined (default)", async () => {
      const { logError } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      const mockHookFn = vi.fn(() => {
        throw new Error("Hook error");
      });
      const safeHook = createSafeRenderHook(mockHookFn);

      safeHook!(1, {}, 2);

      expect(logError).not.toHaveBeenCalled();
    });
  });

  describe("logDevToolsStatus", () => {
    it("should not log anything when enableAutoTracerInternalsLogging is false", async () => {
      const { log, logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: {},
        },
        writable: true,
        configurable: true,
      });

      logDevToolsStatus(false);

      expect(log).not.toHaveBeenCalled();
      expect(logWarn).not.toHaveBeenCalled();
    });

    it("should log success message when DevTools is available and logging is enabled", async () => {
      const { log } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      Object.defineProperty(globalThis, "window", {
        value: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: {},
        },
        writable: true,
        configurable: true,
      });

      logDevToolsStatus(true);

      expect(log).toHaveBeenCalledWith("AutoTracer: React DevTools detected");
    });

    it("should log warning when DevTools is not available and logging is enabled", async () => {
      const { logWarn } = vi.mocked(
        await import("@src/lib/functions/log.js")
      );

      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });

      logDevToolsStatus(true);

      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer: React DevTools not found. Install React DevTools extension for tracing to work."
      );
    });
  });
});
