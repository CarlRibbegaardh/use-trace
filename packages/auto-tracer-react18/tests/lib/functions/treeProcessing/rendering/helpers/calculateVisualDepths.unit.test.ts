import { describe, expect, it } from "vitest";
import { calculateVisualDepths } from "@src/lib/functions/treeProcessing/rendering/helpers/calculateVisualDepths.js";
import type { TreeNode } from "@src/lib/functions/treeProcessing/types/TreeNode.js";

// Minimal mock factory for TreeNode
const createMockNode = (
  depth: number,
  renderType: TreeNode["renderType"] = "Rendering"
): TreeNode => {
  return {
    depth,
    renderType,
    componentName: "TestComponent",
    displayName: "TestComponent",
    flags: 0,
    stateChanges: [],
    propChanges: [],
    componentLogs: [],
    isTracked: false,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
  };
};

describe("calculateVisualDepths", () => {
  it("should return empty array for empty input", () => {
    expect(calculateVisualDepths([])).toEqual([]);
  });

  it("should start at visual depth 0", () => {
    const nodes = [createMockNode(0)];
    expect(calculateVisualDepths(nodes)).toEqual([0]);
  });

  it("should increase visual depth for children", () => {
    const nodes = [
      createMockNode(0), // Parent
      createMockNode(1), // Child
      createMockNode(2), // Grandchild
    ];
    expect(calculateVisualDepths(nodes)).toEqual([0, 1, 2]);
  });

  it("should maintain visual depth for siblings", () => {
    const nodes = [
      createMockNode(0), // Parent
      createMockNode(1), // Child 1
      createMockNode(1), // Child 2
    ];
    expect(calculateVisualDepths(nodes)).toEqual([0, 1, 1]);
  });

  it("should decrease visual depth for parents/uncles", () => {
    const nodes = [
      createMockNode(0), // Parent
      createMockNode(1), // Child
      createMockNode(0), // Sibling to Parent
    ];
    expect(calculateVisualDepths(nodes)).toEqual([0, 1, 0]);
  });

  it("should handle markers correctly (siblings)", () => {
    const nodes = [
      createMockNode(0),
      createMockNode(1, "Marker"), // Marker at depth 1
      createMockNode(1), // Sibling at depth 1
    ];
    // Current implementation behavior: Marker at child level doesn't increase visual depth
    // So Marker(1) is at visual depth 0 (same as Node(0))
    // And Node(1) follows Marker(1), so it also gets visual depth 0
    expect(calculateVisualDepths(nodes)).toEqual([0, 0, 0]);
  });

  it("should handle markers correctly (going deeper)", () => {
    const nodes = [
      createMockNode(0),
      createMockNode(1, "Marker"),
      createMockNode(2), // Child of marker
    ];
    // Current implementation behavior:
    // Node(0) -> 0
    // Marker(1) -> 0 (child but treated as sibling visually?)
    // Node(2) -> 1 (child of marker, so 0 + 1)
    expect(calculateVisualDepths(nodes)).toEqual([0, 0, 1]);
  });
});
