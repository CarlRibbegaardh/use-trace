import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectUpdatedComponents } from "@src/lib/functions/detectUpdatedComponents.js";

// Mock dependencies
vi.mock("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js", () => {
  return {
    buildTreeFromFiber: vi.fn(() => []),
  };
});

vi.mock("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js", () => {
  return {
    applyEmptyNodeFilter: vi.fn(() => vi.fn((nodes) => nodes)),
  };
});

vi.mock("@src/lib/functions/treeProcessing/rendering/renderTree.js", () => {
  return {
    renderTree: vi.fn(),
  };
});

vi.mock("@src/lib/functions/renderRegistry.js", () => {
  return {
    clearRenderRegistry: vi.fn(),
  };
});

vi.mock("@src/lib/functions/log.js", () => {
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
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { applyEmptyNodeFilter } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js")
    );
    const { renderTree } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/rendering/renderTree.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    detectUpdatedComponents(null);

    expect(logGroup).not.toHaveBeenCalled();
    expect(buildTreeFromFiber).not.toHaveBeenCalled();
    expect(applyEmptyNodeFilter).not.toHaveBeenCalled();
    expect(renderTree).not.toHaveBeenCalled();
    expect(clearRenderRegistry).not.toHaveBeenCalled();
    expect(logGroupEnd).not.toHaveBeenCalled();
  });

  it("should return early when root.current is falsy", async () => {
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { applyEmptyNodeFilter } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js")
    );
    const { renderTree } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/rendering/renderTree.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    const root = { current: null };
    detectUpdatedComponents(root);

    expect(logGroup).not.toHaveBeenCalled();
    expect(buildTreeFromFiber).not.toHaveBeenCalled();
    expect(applyEmptyNodeFilter).not.toHaveBeenCalled();
    expect(renderTree).not.toHaveBeenCalled();
    expect(clearRenderRegistry).not.toHaveBeenCalled();
    expect(logGroupEnd).not.toHaveBeenCalled();
  });

  it("should return early when root.current is undefined", async () => {
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { applyEmptyNodeFilter } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js")
    );
    const { renderTree } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/rendering/renderTree.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    const root = {};
    detectUpdatedComponents(root);

    expect(logGroup).not.toHaveBeenCalled();
    expect(buildTreeFromFiber).not.toHaveBeenCalled();
    expect(applyEmptyNodeFilter).not.toHaveBeenCalled();
    expect(renderTree).not.toHaveBeenCalled();
    expect(clearRenderRegistry).not.toHaveBeenCalled();
    expect(logGroupEnd).not.toHaveBeenCalled();
  });

  it("should process valid root and call all required functions", async () => {
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { applyEmptyNodeFilter } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js")
    );
    const { renderTree } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/rendering/renderTree.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    const mockFiberNode = { type: "div", props: {} };
    const root = { current: mockFiberNode };

    detectUpdatedComponents(root);

    expect(logGroup).toHaveBeenCalledWith("Component render cycle:");
    expect(buildTreeFromFiber).toHaveBeenCalledWith(mockFiberNode, 0);
    expect(applyEmptyNodeFilter).toHaveBeenCalled();
    expect(renderTree).toHaveBeenCalled();
    expect(clearRenderRegistry).toHaveBeenCalled();
    expect(logGroupEnd).toHaveBeenCalled();
  });

  it("should call functions in correct order", async () => {
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { applyEmptyNodeFilter } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js")
    );
    const { renderTree } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/rendering/renderTree.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    const callOrder: string[] = [];

    logGroup.mockImplementation(() => {
      callOrder.push("logGroup");
    });
    buildTreeFromFiber.mockImplementation(() => {
      callOrder.push("buildTreeFromFiber");
      return [];
    });
    const mockFilterFn = vi.fn((nodes) => {
      callOrder.push("filterFn");
      return nodes;
    });
    applyEmptyNodeFilter.mockImplementation(() => {
      callOrder.push("applyEmptyNodeFilter");
      return mockFilterFn;
    });
    renderTree.mockImplementation(() => {
      callOrder.push("renderTree");
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
      "buildTreeFromFiber",
      "applyEmptyNodeFilter",
      "filterFn",
      "renderTree",
      "clearRenderRegistry",
      "logGroupEnd",
    ]);
  });

  it("should handle errors gracefully and clean up state", async () => {
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { applyEmptyNodeFilter } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js")
    );
    const { renderTree } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/rendering/renderTree.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logError, logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    const testError = new Error("Test error");
    buildTreeFromFiber.mockImplementation(() => {
      throw testError;
    });

    const root = { current: {} };
    detectUpdatedComponents(root);

    expect(logGroup).toHaveBeenCalledWith("Component render cycle:");
    expect(buildTreeFromFiber).toHaveBeenCalled();
    expect(logGroupEnd).toHaveBeenCalledTimes(1); // Once in catch
    expect(logError).toHaveBeenCalledWith(
      "AutoTracer: Error during component detection:",
      testError
    );
    expect(clearRenderRegistry).toHaveBeenCalled();
  });

  it("should handle cleanup errors gracefully", async () => {
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logError } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    const buildError = new Error("Build error");
    const cleanupError = new Error("Cleanup error");

    buildTreeFromFiber.mockImplementation(() => {
      throw buildError;
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
      buildError
    );
    expect(logError).toHaveBeenNthCalledWith(
      2,
      "AutoTracer: Error during cleanup:",
      cleanupError
    );
  });

  it("should pass correct parameters to buildTreeFromFiber", async () => {
    const { buildTreeFromFiber } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/building/buildTreeFromFiber.js")
    );
    const { applyEmptyNodeFilter } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js")
    );
    const { renderTree } = vi.mocked(
      await import("@src/lib/functions/treeProcessing/rendering/renderTree.js")
    );
    const { clearRenderRegistry } = vi.mocked(
      await import("@src/lib/functions/renderRegistry.js")
    );
    const { logGroup, logGroupEnd } = vi.mocked(
      await import("@src/lib/functions/log.js")
    );

    // Ensure all functions work normally for this test
    buildTreeFromFiber.mockImplementation(() => []);
    applyEmptyNodeFilter.mockImplementation(() => vi.fn((nodes) => nodes));
    renderTree.mockImplementation(() => {});
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

    expect(buildTreeFromFiber).toHaveBeenCalledWith(mockFiberNode, 0);
    expect(buildTreeFromFiber).toHaveBeenCalledTimes(1);
  });
});
