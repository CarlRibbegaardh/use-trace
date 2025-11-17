import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Spec: enabled=true & initialized => active behavior unchanged

describe("useAutoTracer - active when enabled=true and tracer initialized", () => {
  beforeEach(async () => {
    const { clearRenderRegistry } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    clearRenderRegistry();
    // Provide a fake React DevTools global hook so initialization succeeds
    // jsdom's window exists; we attach the expected shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      // Minimal stub; autoTracer replaces onCommitFiberRoot
      onCommitFiberRoot: () => {},
    };
    const { autoTracer } = await import("@src/lib/autoTracer.js");
    autoTracer({ enableAutoTracerInternalsLogging: false });
  });

  it("collects a GUID and logs when logger used", async () => {
    const { useAutoTracer } = await import(
      "@src/lib/hooks/useAutoTracer.js"
    );
    const { getTrackedGUIDs } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    const { componentLogRegistry } = await import(
      "@src/lib/functions/componentLogRegistry.js"
    );

    const { result } = renderHook(() => useAutoTracer());
    const logger = result.current;
    logger.log("active-log");

    // At least one GUID should be present (the component instance)
    expect(getTrackedGUIDs().size).toBe(1);
    // Log registry should have recorded the log (>=1)
    expect(componentLogRegistry.getLogCount()).toBe(1);
  });
});
