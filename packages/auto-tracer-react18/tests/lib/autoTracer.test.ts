import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock DevTools utils using vi.hoisted() to ensure proper hoisting
const {
  mockInstallRenderHook,
  mockRestoreRenderHook,
  mockCreateSafeRenderHook,
  mockIsDevToolsAvailable,
  mockLogDevToolsStatus,
} = vi.hoisted(() => {
  return {
    mockInstallRenderHook: vi.fn(),
    mockRestoreRenderHook: vi.fn(),
    mockCreateSafeRenderHook: vi.fn(),
    mockIsDevToolsAvailable: vi.fn(),
    mockLogDevToolsStatus: vi.fn(),
  };
});

import {
  autoTracer,
  isAutoTracerInitialized,
  stopAutoTracer,
  updateAutoTracerOptions,
  useAutoTracer,
} from "@src/lib/autoTracer.js";

// Mock global state
vi.mock("@src/lib/types/globalState.js", () => {
  return {
    setTracerOptions: vi.fn(),
    setIsGlobalTracerInstalled: vi.fn(),
  };
});

// Mock validation
vi.mock("@src/lib/functions/validateOptions.js", () => {
  return {
    validateAutoTracerOptions: vi.fn((options) => {
      return options;
    }),
  };
});

// Mock deep merge
vi.mock("@src/lib/functions/deepMerge.js", () => {
  return {
    deepMergeOptions: vi.fn((_target, source) => {
      // For testing, always start with defaults and merge the source
      const defaults = {
        enabled: true,
        enableAutoTracerInternalsLogging: false,
        includeReconciled: "never" as const,
        includeSkipped: "never" as const,
        showFlags: false,
        maxFiberDepth: 100,
        detectIdenticalValueChanges: true,
        includeNonTrackedBranches: false,
        skippedObjectProps: [],
      };
      return { ...defaults, ...source };
    }),
  };
});

// Mock default settings
vi.mock("@src/lib/types/defaultSettings.js", () => {
  return {
    defaultAutoTracerOptions: {
      enabled: true,
      enableAutoTracerInternalsLogging: false,
      includeReconciled: "never" as const,
      includeSkipped: "never" as const,
      showFlags: false,
      maxFiberDepth: 100,
      detectIdenticalValueChanges: true,
      includeNonTrackedBranches: false,
      skippedObjectProps: [],
    },
  };
});

vi.mock("@src/lib/functions/devToolsUtils.js", () => {
  return {
    installRenderHook: mockInstallRenderHook,
    restoreRenderHook: mockRestoreRenderHook,
    createSafeRenderHook: mockCreateSafeRenderHook,
    isDevToolsAvailable: mockIsDevToolsAvailable,
    logDevToolsStatus: mockLogDevToolsStatus,
  };
});

// Mock detect updated components
vi.mock("@src/lib/functions/detectUpdatedComponents.js", () => {
  return {
    detectUpdatedComponents: vi.fn(),
  };
});

// Mock log functions
vi.mock("@src/lib/functions/log.js", () => {
  return {
    log: vi.fn((...args: unknown[]) => {
      // Call through to console.log so the test spies can capture it
      console.log(...args);
    }),
    logWarn: vi.fn((...args: unknown[]) => {
      // Call through to console.warn so the test spies can capture it
      console.warn(...args);
    }),
  };
});

// Mock render registry (include clearRenderRegistry to satisfy stopAutoTracer clearing logic)
vi.mock("@src/lib/functions/renderRegistry.js", () => {
  return {
    useAutoTracer: vi.fn(),
    clearRenderRegistry: vi.fn(),
  };
});

describe("autoTracer", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset autoTracer state before each test
    if (isAutoTracerInitialized()) {
      stopAutoTracer();
    }
    // Set default mock return values (don't set mockIsDevToolsAvailable - let tests control it)
    mockCreateSafeRenderHook.mockReturnValue(vi.fn());
    mockInstallRenderHook.mockReturnValue(vi.fn());
    mockLogDevToolsStatus.mockImplementation(() => {});
    mockRestoreRenderHook.mockImplementation(() => {});

    // Set up detectUpdatedComponents mock
    const { detectUpdatedComponents } = await import(
      "@src/lib/functions/detectUpdatedComponents.js"
    );
    vi.mocked(detectUpdatedComponents).mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up after each test
    if (isAutoTracerInitialized()) {
      stopAutoTracer();
    }
  });

  describe("autoTracer function", () => {
    it("should return cleanup function when disabled", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const cleanup = autoTracer({
        enabled: false,
        enableAutoTracerInternalsLogging: true,
      });

      expect(typeof cleanup).toBe("function");
      expect(consoleSpy).toHaveBeenCalledWith(
        "AutoTracer: Disabled via enabled: false option"
      );
      expect(isAutoTracerInitialized()).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should handle when DevTools is not available", () => {
      mockIsDevToolsAvailable.mockReturnValue(false);

      const cleanup = autoTracer({ enableAutoTracerInternalsLogging: true });

      expect(mockLogDevToolsStatus).toHaveBeenCalledWith(true);
      expect(typeof cleanup).toBe("function");
      expect(isAutoTracerInitialized()).toBe(false);
    });

    it("should initialize successfully when DevTools is available", () => {
      mockIsDevToolsAvailable.mockReturnValue(true);
      mockCreateSafeRenderHook.mockReturnValue(vi.fn());
      mockInstallRenderHook.mockReturnValue(vi.fn());

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const cleanup = autoTracer({ enableAutoTracerInternalsLogging: true });

      expect(mockCreateSafeRenderHook).toHaveBeenCalled();
      expect(mockInstallRenderHook).toHaveBeenCalled();
      expect(isAutoTracerInitialized()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "AutoTracer: Global render monitor initialized"
      );
      expect(typeof cleanup).toBe("function");

      consoleSpy.mockRestore();
    });

    it("should return existing cleanup when already initialized", async () => {
      mockIsDevToolsAvailable.mockReturnValue(true);
      mockCreateSafeRenderHook.mockReturnValue(vi.fn());
      mockInstallRenderHook.mockReturnValue(vi.fn());

      // First initialization
      autoTracer();
      expect(isAutoTracerInitialized()).toBe(true);

      // Second call should warn and return stopAutoTracer
      const { logWarn } = await import("@src/lib/functions/log.js");
      const cleanup = autoTracer({ enableAutoTracerInternalsLogging: true });

      expect(logWarn).toHaveBeenCalledWith(
        "AutoTracer is already active. Call stopAutoTracer() first."
      );
      expect(cleanup).toBe(stopAutoTracer);
    });

    it("should handle options properly", async () => {
      mockIsDevToolsAvailable.mockReturnValue(true);
      mockCreateSafeRenderHook.mockReturnValue(vi.fn());
      mockInstallRenderHook.mockReturnValue(vi.fn());

      const options = {
        includeReconciled: "always" as const,
        maxFiberDepth: 200,
      };

      autoTracer(options);

      const { validateAutoTracerOptions } = await import(
        "@src/lib/functions/validateOptions.js"
      );
      const { deepMergeOptions } = await import(
        "@src/lib/functions/deepMerge.js"
      );
      const { setTracerOptions } = await import(
        "@src/lib/types/globalState.js"
      );

      expect(validateAutoTracerOptions).toHaveBeenCalledWith(options);
      expect(deepMergeOptions).toHaveBeenCalled();
      expect(setTracerOptions).toHaveBeenCalled();
    });
  });

  describe("stopAutoTracer", () => {
    it("should do nothing when not initialized", () => {
      expect(isAutoTracerInitialized()).toBe(false);

      stopAutoTracer();

      expect(mockRestoreRenderHook).not.toHaveBeenCalled();
    });

    it("should stop properly when initialized", () => {
      mockIsDevToolsAvailable.mockReturnValue(true);
      mockCreateSafeRenderHook.mockReturnValue(vi.fn());
      const originalHook = vi.fn();
      mockInstallRenderHook.mockReturnValue(originalHook);

      autoTracer({ enableAutoTracerInternalsLogging: true });
      expect(isAutoTracerInitialized()).toBe(true);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      stopAutoTracer();

      expect(mockRestoreRenderHook).toHaveBeenCalledWith(originalHook);
      expect(isAutoTracerInitialized()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "AutoTracer: Global render monitor stopped"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("isAutoTracerInitialized", () => {
    it("should return false initially", () => {
      expect(isAutoTracerInitialized()).toBe(false);
    });

    it("should return true when initialized", () => {
      mockIsDevToolsAvailable.mockReturnValue(true);
      mockCreateSafeRenderHook.mockReturnValue(vi.fn());
      mockInstallRenderHook.mockReturnValue(vi.fn());

      autoTracer();
      expect(isAutoTracerInitialized()).toBe(true);
    });

    it("should return false after stopping", () => {
      mockIsDevToolsAvailable.mockReturnValue(true);
      mockCreateSafeRenderHook.mockReturnValue(vi.fn());
      mockInstallRenderHook.mockReturnValue(vi.fn());

      autoTracer();
      expect(isAutoTracerInitialized()).toBe(true);

      stopAutoTracer();
      expect(isAutoTracerInitialized()).toBe(false);
    });
  });

  describe("updateAutoTracerOptions", () => {
    it("should update options", async () => {
      const newOptions = {
        includeReconciled: "always" as const,
        maxFiberDepth: 150,
      };

      updateAutoTracerOptions(newOptions);

      const { validateAutoTracerOptions } = await import(
        "@src/lib/functions/validateOptions.js"
      );
      const { deepMergeOptions } = await import(
        "@src/lib/functions/deepMerge.js"
      );
      const { setTracerOptions } = await import(
        "@src/lib/types/globalState.js"
      );

      expect(validateAutoTracerOptions).toHaveBeenCalledWith(newOptions);
      expect(deepMergeOptions).toHaveBeenCalled();
      expect(setTracerOptions).toHaveBeenCalled();
    });

    it("should handle empty options", async () => {
      updateAutoTracerOptions({});

      const { validateAutoTracerOptions } = await import(
        "@src/lib/functions/validateOptions.js"
      );
      expect(validateAutoTracerOptions).toHaveBeenCalledWith({});
    });
  });

  describe("useAutoTracer export", () => {
    it("should re-export useAutoTracer from renderRegistry", () => {
      expect(useAutoTracer).toBeDefined();
      expect(typeof useAutoTracer).toBe("function");
    });
  });
});
