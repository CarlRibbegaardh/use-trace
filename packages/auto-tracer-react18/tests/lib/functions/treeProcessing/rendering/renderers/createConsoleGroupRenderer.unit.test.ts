import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConsoleGroupRenderer } from "@src/lib/functions/treeProcessing/rendering/renderers/createConsoleGroupRenderer.js";
import type { TreeNode } from "@src/lib/functions/treeProcessing/types/TreeNode.js";

// Mock the log module
const mockLog = vi.hoisted(() => {
  return {
    log: vi.fn(),
    logStyled: vi.fn(),
    logGroup: vi.fn(),
    logGroupEnd: vi.fn(),
    logReconciled: vi.fn(),
    logSkipped: vi.fn(),
    logStateChange: vi.fn(),
    logIdenticalStateValueWarning: vi.fn(),
    groupStyled: vi.fn(),
    groupReconciled: vi.fn(),
    groupSkipped: vi.fn(),
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

describe("createConsoleGroupRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render a simple tree using groups", () => {
    const renderer = createConsoleGroupRenderer();
    const nodes = [createMockNode(0, "Rendering", "App")];

    renderer(nodes);

    // Should log the component
    // Since it's the root, it might not be grouped, or it might be.
    // Let's assume we just log it for now.
    expect(mockLog.logStyled).toHaveBeenCalledWith(
      expect.anything(), // prefix (empty?)
      expect.stringContaining("App"),
      expect.anything()
    );
  });

  it("should group nested nodes", () => {
    const renderer = createConsoleGroupRenderer();
    const nodes = [
      createMockNode(0, "Mount", "Parent"),
      createMockNode(1, "Mount", "Child"),
    ];

    renderer(nodes);

    // Parent should be a GROUP because it has a child
    // Since it is tracked (default), it should use groupStyled
    expect(mockLog.groupStyled).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("Parent"),
      true
    );

    // Child should be a LOG because it is a leaf
    expect(mockLog.logStyled).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("Child"),
      expect.anything()
    );

    // Should close the group at the end
    expect(mockLog.logGroupEnd).toHaveBeenCalled();
  });

  it("should use specific group functions for non-tracked nodes", () => {
    const renderer = createConsoleGroupRenderer();
    const nodes = [
      createMockNode(0, "Reconciled", "ParentReconciled", false),
      createMockNode(1, "Mount", "Child"),
    ];

    renderer(nodes);

    // Parent is Reconciled and NOT tracked -> groupReconciled
    expect(mockLog.groupReconciled).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("ParentReconciled")
    );
  });

  it("should use groupSkipped for Skipped non-tracked nodes", () => {
    const renderer = createConsoleGroupRenderer();
    const nodes = [
      createMockNode(0, "Skipped", "ParentSkipped", false),
      createMockNode(1, "Mount", "Child"),
    ];

    renderer(nodes);

    // Parent is Skipped and NOT tracked -> groupSkipped
    expect(mockLog.groupSkipped).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("ParentSkipped")
    );
  });
});
