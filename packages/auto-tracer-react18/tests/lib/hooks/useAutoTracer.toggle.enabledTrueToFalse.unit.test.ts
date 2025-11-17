import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Spec: toggling enabled true->false while initialized prevents further collection

describe("useAutoTracer - toggle enabled true→false while initialized", () => {
  beforeEach(async () => {
    const { clearRenderRegistry } = await import(
      "@src/lib/functions/renderRegistry.js"
    );
    clearRenderRegistry();
    // Fake DevTools hook for successful initialization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      onCommitFiberRoot: () => {},
    };
  });

  it("auto-stops and clears GUIDs after disabling", async () => {
    const { autoTracer, updateAutoTracerOptions } = await import(
      "@src/lib/autoTracer.js"
    );
    const { useAutoTracer } = await import(
      "@src/lib/hooks/useAutoTracer.js"
    );
    const { getTrackedGUIDs } = await import(
      "@src/lib/functions/renderRegistry.js"
    );

    // Initialize tracer (enabled=true by default)
    autoTracer();

    // First component render collects one GUID
    renderHook(() => useAutoTracer());
    expect(getTrackedGUIDs().size).toBe(1);
    const initialGuids = Array.from(getTrackedGUIDs());

    // Disable tracing at runtime
    updateAutoTracerOptions({ enabled: false });

    // Render a second component instance; tracer should have auto-stopped & cleared registries
    renderHook(() => useAutoTracer());

    expect(getTrackedGUIDs().size).toBe(0);
  });
});
