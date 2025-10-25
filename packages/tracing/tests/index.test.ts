import { describe, expect, it } from "vitest";
import * as useTraceExports from "../src/index.js";

describe("index exports", () => {
  it("should export useTrace function", () => {
    expect(typeof useTraceExports.useTrace).toBe("function");
  });

  it("should export autoTracer functions", () => {
    expect(typeof useTraceExports.autoTracer).toBe("function");
    expect(typeof useTraceExports.isAutoTracerInitialized).toBe("function");
    expect(typeof useTraceExports.stopAutoTracer).toBe("function");
    expect(typeof useTraceExports.updateAutoTracerOptions).toBe("function");
    expect(typeof useTraceExports.useAutoTrace).toBe("function");
  });

  it("should have all expected exports", () => {
    const expectedExports = [
      "useTrace",
      "autoTracer",
      "isAutoTracerInitialized",
      "stopAutoTracer",
      "updateAutoTracerOptions",
      "useAutoTrace"
    ];

    expectedExports.forEach(exportName => {
      expect(useTraceExports).toHaveProperty(exportName);
    });
  });

  it("should not export internal implementation details", () => {
    const internalExports = [
      "traceEnter",
      "traceExit",
      "traceLogFn",
      "areHookInputsEqual",
      "isRefObject",
      "useObjectChangeTracker"
    ];

    internalExports.forEach(exportName => {
      expect(useTraceExports).not.toHaveProperty(exportName);
    });
  });
});
