import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

describe("useAutoTracer - inactive when not initialized (enabled=true)", () => {
  beforeEach(async () => {
    // Ensure any registries are cleared between tests
    const { clearRenderRegistry } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    clearRenderRegistry();

    // Ensure options are at defaults (enabled=true by default)
    const { updateAutoTracerOptions } = await import(
      "@src/lib/autoTracer.js"
    );
    updateAutoTracerOptions({});
  });

  it("does not collect GUIDs or logs when tracer not initialized", async () => {
    const { useAutoTracer } = await import(
      "@src/lib/hooks/useAutoTracer.js"
    );
    const { getTrackedGUIDs } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    const { componentLogRegistry } = await import(
      "@src/lib/functions/componentLogRegistry.js"
    );

    // Render a hook caller without initializing the tracer
    const { result } = renderHook(() => {
      return useAutoTracer();
    });

    // Use the logger to ensure no-ops don't throw
    const logger = result.current;
    logger.log("test");
    logger.warn("warn");
    logger.error("error");
    logger.labelState(0, "x", 1);

    // Assert no collection occurred
    expect(getTrackedGUIDs().size).toBe(0);
    expect(componentLogRegistry.getLogCount()).toBe(0);
  });
});
