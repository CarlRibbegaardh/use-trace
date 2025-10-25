import { describe, expect, it, vi } from "vitest";

// Note: we import the package dynamically inside tests so that mocks
// (vi.doMock) can be applied before the module is evaluated.

describe("index exports", () => {
  it("should export useTrace function", async () => {
    const useTraceExports = await import("@src/index.js");
    expect(typeof useTraceExports.useTrace).toBe("function");
  });

  it("should export autoTracer functions", async () => {
    const useTraceExports = await import("@src/index.js");
    expect(typeof useTraceExports.autoTracer).toBe("function");
    expect(typeof useTraceExports.isAutoTracerInitialized).toBe("function");
    expect(typeof useTraceExports.stopAutoTracer).toBe("function");
    expect(typeof useTraceExports.updateAutoTracerOptions).toBe("function");
    expect(typeof useTraceExports.useAutoTrace).toBe("function");
  });

  it("should have all expected exports", async () => {
    const useTraceExports = await import("@src/index.js");
    const expectedExports = [
      "useTrace",
      "autoTracer",
      "isAutoTracerInitialized",
      "stopAutoTracer",
      "updateAutoTracerOptions",
      "useAutoTrace",
    ];

    expectedExports.forEach((exportName) => {
      expect(useTraceExports).toHaveProperty(exportName);
    });
  });

  it("should not export internal implementation details", async () => {
    const useTraceExports = await import("@src/index.js");
    const internalExports = [
      "traceEnter",
      "traceExit",
      "traceLogFn",
      "areHookInputsEqual",
      "isRefObject",
      "useObjectChangeTracker",
    ];

    internalExports.forEach((exportName) => {
      expect(useTraceExports).not.toHaveProperty(exportName);
    });
  });

  it("should be able to call useTrace", async () => {
    // We avoid calling the hook directly here because hooks require a
    // React render context. This test ensures the export exists and is
    // a callable function (behavioral tests live in hooks unit tests).
    const useTraceExports = await import("@src/index.js");
    expect(typeof useTraceExports.useTrace).toBe("function");
  });

  it("should be able to call autoTracer functions", async () => {
    const useTraceExports = await import("@src/index.js");

    expect(() => {
      const initialized = useTraceExports.isAutoTracerInitialized();
      expect(typeof initialized).toBe("boolean");
    }).not.toThrow();

    expect(() => {
      useTraceExports.stopAutoTracer();
    }).not.toThrow();

    expect(() => {
      useTraceExports.updateAutoTracerOptions({});
    }).not.toThrow();
  });
});
