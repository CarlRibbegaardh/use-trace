import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Failing test (TDD): stopAutoTracer() should clear registries once.

describe("stopAutoTracer - clears registries", () => {
  beforeEach(async () => {
    const { clearRenderRegistry } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    clearRenderRegistry();
    // Provide DevTools hook so initialization succeeds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { onCommitFiberRoot: () => {} };
  });

  it("clears tracked GUIDs and logs after stop", async () => {
    const { autoTracer, stopAutoTracer } = await import("@src/lib/autoTracer.js");
    const { useAutoTracer } = await import("@src/lib/hooks/useAutoTracer.js");
    const { getTrackedGUIDs } = await import("@src/lib/functions/renderRegistry.js");
    const { componentLogRegistry } = await import("@src/lib/functions/componentLogRegistry.js");

    autoTracer();

    // Create two component instances and log
    renderHook(() => {
      const logger = useAutoTracer();
      logger.log("first");
    });
    renderHook(() => {
      const logger = useAutoTracer();
      logger.log("second");
    });

    expect(getTrackedGUIDs().size).toBe(2);
    expect(componentLogRegistry.getLogCount()).toBeGreaterThanOrEqual(2);

    // Stop tracer
    stopAutoTracer();

    // After stopping, registries should be cleared by implementation
    expect(getTrackedGUIDs().size).toBe(0);
    expect(componentLogRegistry.getLogCount()).toBe(0);
  });
});
