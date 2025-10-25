import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectUpdatedComponents } from "@src/lib/features/autoTracer/functions/detectUpdatedComponents.js";

// Mock dependencies
vi.mock("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js", () => {
  return {
    resetDepthTracking: vi.fn(),
    walkFiberForUpdates: vi.fn(),
  };
});

vi.mock("@src/lib/features/autoTracer/functions/renderRegistry.js", () => {
  return {
    clearRenderRegistry: vi.fn(),
  };
});

vi.mock("@src/lib/features/autoTracer/functions/log.js", () => {
  return {
    logError: vi.fn(),
    logGroup: vi.fn(),
    logGroupEnd: vi.fn(),
  };
});

describe("detectUpdatedComponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return early when root is falsy", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    detectUpdatedComponents(null);

    expect(logGroup).not.toHaveBeenCalled();
    expect(resetDepthTracking).not.toHaveBeenCalled();
    expect(walkFiberForUpdates).not.toHaveBeenCalled();
    expect(clearRenderRegistry).not.toHaveBeenCalled();
    expect(logGroupEnd).not.toHaveBeenCalled();
  });

  it("should return early when root.current is falsy", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    const root = { current: null };
    detectUpdatedComponents(root);

    expect(logGroup).not.toHaveBeenCalled();
    expect(resetDepthTracking).not.toHaveBeenCalled();
    expect(walkFiberForUpdates).not.toHaveBeenCalled();
    expect(clearRenderRegistry).not.toHaveBeenCalled();
    expect(logGroupEnd).not.toHaveBeenCalled();
  });

  it("should return early when root.current is undefined", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    const root = {};
    detectUpdatedComponents(root);

    expect(logGroup).not.toHaveBeenCalled();
    expect(resetDepthTracking).not.toHaveBeenCalled();
    expect(walkFiberForUpdates).not.toHaveBeenCalled();
    expect(clearRenderRegistry).not.toHaveBeenCalled();
    expect(logGroupEnd).not.toHaveBeenCalled();
  });

  it("should process valid root and call all required functions", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    const mockFiberNode = { type: "div", props: {} };
    const root = { current: mockFiberNode };

    detectUpdatedComponents(root);

    expect(logGroup).toHaveBeenCalledWith("Component render cycle:");
    expect(resetDepthTracking).toHaveBeenCalled();
    expect(walkFiberForUpdates).toHaveBeenCalledWith(mockFiberNode, 0);
    expect(clearRenderRegistry).toHaveBeenCalled();
    expect(logGroupEnd).toHaveBeenCalled();
  });

  it("should call functions in correct order", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    const callOrder: string[] = [];

    logGroup.mockImplementation(() => {
      callOrder.push("logGroup");
    });
    resetDepthTracking.mockImplementation(() => {
      callOrder.push("resetDepthTracking");
    });
    walkFiberForUpdates.mockImplementation(() => {
      callOrder.push("walkFiberForUpdates");
    });
    clearRenderRegistry.mockImplementation(() => {
      callOrder.push("clearRenderRegistry");
    });
    logGroupEnd.mockImplementation(() => {
      callOrder.push("logGroupEnd");
    });

    const root = { current: {} };
    detectUpdatedComponents(root);

    expect(callOrder).toEqual([
      "logGroup",
      "resetDepthTracking",
      "walkFiberForUpdates",
      "clearRenderRegistry",
      "logGroupEnd",
    ]);
  });

  it("should handle errors gracefully and clean up state", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logError, logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    const testError = new Error("Test error");
    walkFiberForUpdates.mockImplementation(() => {
      throw testError;
    });

    const root = { current: {} };
    detectUpdatedComponents(root);

    expect(logGroup).toHaveBeenCalledWith("Component render cycle:");
    expect(resetDepthTracking).toHaveBeenCalled();
    expect(walkFiberForUpdates).toHaveBeenCalled();
    expect(logGroupEnd).toHaveBeenCalledTimes(1); // Once in catch only
    expect(logError).toHaveBeenCalledWith(
      "AutoTracer: Error during component detection:",
      testError
    );
    expect(clearRenderRegistry).toHaveBeenCalled();
    expect(resetDepthTracking).toHaveBeenCalledTimes(2); // Once at start, once in cleanup
  });

  it("should handle cleanup errors gracefully", async () => {
    const { walkFiberForUpdates } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logError } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    const walkError = new Error("Walk error");
    const cleanupError = new Error("Cleanup error");

    walkFiberForUpdates.mockImplementation(() => {
      throw walkError;
    });

    // Make clearRenderRegistry throw during cleanup
    clearRenderRegistry.mockImplementation(() => {
      throw cleanupError;
    });

    const root = { current: {} };
    detectUpdatedComponents(root);

    expect(logError).toHaveBeenNthCalledWith(
      1,
      "AutoTracer: Error during component detection:",
      walkError
    );
    expect(logError).toHaveBeenNthCalledWith(
      2,
      "AutoTracer: Error during cleanup:",
      cleanupError
    );
  });

  it("should handle errors in resetDepthTracking during cleanup", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logError } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    const walkError = new Error("Walk error");
    const resetError = new Error("Reset error");

    walkFiberForUpdates.mockImplementation(() => {
      throw walkError;
    });

    // Ensure clearRenderRegistry doesn't throw in this test
    clearRenderRegistry.mockImplementation(() => {});

    // Make resetDepthTracking throw on second call (during cleanup)
    let resetCallCount = 0;
    resetDepthTracking.mockImplementation(() => {
      resetCallCount++;
      if (resetCallCount === 2) {
        throw resetError;
      }
    });

    const root = { current: {} };
    detectUpdatedComponents(root);

    expect(logError).toHaveBeenNthCalledWith(
      1,
      "AutoTracer: Error during component detection:",
      walkError
    );
    expect(logError).toHaveBeenNthCalledWith(
      2,
      "AutoTracer: Error during cleanup:",
      resetError
    );
  });

  it("should pass correct parameters to walkFiberForUpdates", async () => {
    const { walkFiberForUpdates, resetDepthTracking } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/walkFiberForUpdates.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/log.js")
    );

    // Ensure all functions work normally for this test
    walkFiberForUpdates.mockImplementation(() => {});
    resetDepthTracking.mockImplementation(() => {});
    clearRenderRegistry.mockImplementation(() => {});
    logGroup.mockImplementation(() => {});
    logGroupEnd.mockImplementation(() => {});

    const mockFiberNode = {
      type: "div",
      props: { id: "test" },
      children: []
    };
    const root = { current: mockFiberNode };

    detectUpdatedComponents(root);

    expect(walkFiberForUpdates).toHaveBeenCalledWith(mockFiberNode, 0);
    expect(walkFiberForUpdates).toHaveBeenCalledTimes(1);
  });
});
