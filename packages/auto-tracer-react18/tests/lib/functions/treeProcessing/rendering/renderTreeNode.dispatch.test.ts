import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderTreeNode } from "@src/lib/functions/treeProcessing/rendering/renderTreeNode.js";
import * as indentedRenderer from "@src/lib/functions/treeProcessing/rendering/renderIndentedNode.js";
import type { TreeNode } from "@src/lib/functions/treeProcessing/types/TreeNode.js";

vi.mock("@src/lib/functions/treeProcessing/rendering/renderIndentedNode.js");

describe("renderTreeNode", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockNode: TreeNode = {
    componentName: "Test",
    displayName: "Test",
    depth: 0,
    renderType: "Rendering",
    flags: 0,
    isTracked: true,
    stateChanges: [],
    propChanges: [],
    componentLogs: [],
    filteredNodeCount: 0,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
  };

  it("delegates to renderIndentedNode", () => {
    renderTreeNode(mockNode, 1, 0, false);
    expect(indentedRenderer.renderIndentedNode).toHaveBeenCalledWith(
      mockNode,
      1,
      0,
      false,
      undefined
    );
  });
});
