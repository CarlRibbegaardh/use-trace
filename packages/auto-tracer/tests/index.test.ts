import { describe, expect, it } from "vitest";

// Note: we import the package dynamically inside tests so that mocks
// (vi.doMock) can be applied before the module is evaluated.

describe("index exports", () => {
  it("should export autoTracer functions", async () => {
    const useTraceExports = await import("@src/index.js");
    expect(typeof useTraceExports.autoTracer).toBe("function");
    expect(typeof useTraceExports.isAutoTracerInitialized).toBe("function");
    expect(typeof useTraceExports.stopAutoTracer).toBe("function");
    expect(typeof useTraceExports.updateAutoTracerOptions).toBe("function");
    expect(typeof useTraceExports.useAutoTracer).toBe("function");
  });

  it("should have all expected exports", async () => {
    const useTraceExports = await import("@src/index.js");
    const expectedExports = [
      "autoTracer",
      "isAutoTracerInitialized",
      "stopAutoTracer",
      "updateAutoTracerOptions",
      "useAutoTracer",
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
