import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Spec: enabled=false & not initialized => strict no-op, no GUIDs/logs

describe("useAutoTracer - inactive when enabled=false and not initialized", () => {
  beforeEach(async () => {
    const { clearRenderRegistry } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    clearRenderRegistry();
    // Explicitly set enabled:false; do not initialize tracer
    const { updateAutoTracerOptions } = await import(
      "@src/lib/autoTracer.js"
    );
    updateAutoTracerOptions({ enabled: false });
  });

  it("returns no-op logger and does not collect GUIDs or logs", async () => {
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
    // Should be safe to call methods (no-ops)
    logger.log("inactive-test");
    logger.warn("inactive-warn");
    logger.error("inactive-error");
    logger.labelState(0, "label", 123);

    expect(getTrackedGUIDs().size).toBe(0);
    expect(componentLogRegistry.getLogCount()).toBe(0);
  });
});
