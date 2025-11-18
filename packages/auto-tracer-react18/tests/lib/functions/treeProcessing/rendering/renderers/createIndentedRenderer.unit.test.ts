import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createIndentedRenderer } from "@src/lib/functions/treeProcessing/rendering/renderers/createIndentedRenderer.js";
import type { TreeNode } from "@src/lib/functions/treeProcessing/types/TreeNode.js";

// Mock the log module
const mockLog = vi.hoisted(() => {
  return {
    log: vi.fn(),
    logStyled: vi.fn(),
    logReconciled: vi.fn(),
    logSkipped: vi.fn(),
    logStateChange: vi.fn(),
    logPropChange: vi.fn(),
    logLogStatement: vi.fn(),
    logWarnStatement: vi.fn(),
    logErrorStatement: vi.fn(),
    logIdenticalStateValueWarning: vi.fn(),
    logIdenticalPropValueWarning: vi.fn(),
  };
});

vi.mock("../../../../../../src/lib/functions/log.js", () => {
  return mockLog;
});
vi.mock("@src/lib/functions/log.js", () => {
  return mockLog;
});

// Minimal mock factory for TreeNode
const createMockNode = (
  depth: number,
  renderType: TreeNode["renderType"] = "Rendering",
  displayName = "TestComponent",
  isTracked = true
): TreeNode => {
  return {
    depth,
    renderType,
    componentName: displayName,
    displayName,
    flags: 0,
    stateChanges: [],
    propChanges: [],
    componentLogs: [],
    isTracked,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
  };
};

describe("createIndentedRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render a simple tree", () => {
    const renderer = createIndentedRenderer();
    const nodes = [createMockNode(0, "Mount", "App")];

    renderer(nodes);

    // Should log the component
    expect(mockLog.logStyled).toHaveBeenCalledWith(
      expect.stringContaining("├─"),
      expect.stringContaining("App"),
      expect.anything()
    );
  });

  it("should render connectors for nested nodes", () => {
    const renderer = createIndentedRenderer();
    const nodes = [
      createMockNode(0, "Mount", "Parent"),
      createMockNode(1, "Mount", "Child"),
    ];

    renderer(nodes);

    // Parent
    expect(mockLog.logStyled).toHaveBeenCalledWith(
      expect.stringContaining("├─"),
      expect.stringContaining("Parent"),
      expect.anything()
    );

    // Connector for Child
    expect(mockLog.log).toHaveBeenCalledWith(expect.stringContaining("└─┐"));

    // Child
    expect(mockLog.logStyled).toHaveBeenCalledWith(
      expect.stringContaining("├─"),
      expect.stringContaining("Child"),
      expect.anything()
    );
  });
});
