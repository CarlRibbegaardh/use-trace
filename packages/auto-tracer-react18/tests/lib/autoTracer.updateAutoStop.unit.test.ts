import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Failing test (TDD): updateAutoTracerOptions({ enabled:false }) auto-stops when previously active.

describe("updateAutoTracerOptions - enabled true→false triggers auto-stop", () => {
  beforeEach(async () => {
    const { clearRenderRegistry } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    clearRenderRegistry();
    // Provide DevTools hook so initialization succeeds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { onCommitFiberRoot: () => {} };
  });

  it("disables tracer and clears registries on enabled:false update", async () => {
    const { autoTracer, updateAutoTracerOptions, isAutoTracerInitialized } = await import("@src/lib/autoTracer.js");
    const { useAutoTracer } = await import("@src/lib/hooks/useAutoTracer.js");
    const { getTrackedGUIDs } = await import("@src/lib/functions/renderRegistry.js");

    autoTracer();
    expect(isAutoTracerInitialized()).toBe(true);

    // Render components to populate registry
    renderHook(() => useAutoTracer());
    renderHook(() => useAutoTracer());
    expect(getTrackedGUIDs().size).toBe(2);

    // Disable tracing at runtime
    updateAutoTracerOptions({ enabled: false, enableAutoTracerInternalsLogging: true });

    // Should be deactivated
    expect(isAutoTracerInitialized()).toBe(false);
    // Registries should be cleared
    expect(getTrackedGUIDs().size).toBe(0);
  });
});
