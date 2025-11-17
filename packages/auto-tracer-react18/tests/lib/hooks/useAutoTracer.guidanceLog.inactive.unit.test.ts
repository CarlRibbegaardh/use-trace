import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Failing test (TDD): one-time guidance log when enabled=true but tracer not initialized
// behind enableAutoTracerInternalsLogging.
// Expected message (spec-aligned draft):
//   "AutoTracer: useAutoTracer() called while tracer not initialized. Call autoTracer() early in app startup."

const EXPECTED_MESSAGE = "AutoTracer: useAutoTracer() called while tracer not initialized. Call autoTracer() early in app startup.";

describe("useAutoTracer - guidance log when active intent but not initialized", () => {
  beforeEach(async () => {
    const { clearRenderRegistry } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    clearRenderRegistry();
    const { updateAutoTracerOptions } = await import(
      "@src/lib/autoTracer.js"
    );
    updateAutoTracerOptions({ enabled: true, enableAutoTracerInternalsLogging: true });
  });

  it("logs guidance exactly once across multiple hook calls", async () => {
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    // Accept also console.log if implementation chooses that
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { useAutoTracer } = await import(
      "@src/lib/hooks/useAutoTracer.js"
    );

    // Multiple components / calls without initialization
    renderHook(() => useAutoTracer());
    renderHook(() => useAutoTracer());
    renderHook(() => useAutoTracer());

    // It should have logged the guidance message exactly once on one of the channels
    const infoCalls = consoleSpy.mock.calls.filter(c => c[0] === EXPECTED_MESSAGE).length;
    const logCalls = consoleLogSpy.mock.calls.filter(c => c[0] === EXPECTED_MESSAGE).length;
    expect(infoCalls + logCalls).toBe(1);

    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
