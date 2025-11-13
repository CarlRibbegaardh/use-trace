import { describe, it, expect } from "vitest";
import { createMarkerNode } from "../../../../../src/lib/functions/treeProcessing/filtering/createMarkerNode.js";
import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";

describe("createMarkerNode", () => {
  it("should create marker node with correct format for 1 level", () => {
    const marker = createMarkerNode(5, 1, 1);

    expect(marker.depth).toBe(5);
    expect(marker.componentName).toBe("... (1 levels collapsed)");
    expect(marker.displayName).toBe("... (1 levels collapsed)");
    expect(marker.renderType).toBe("Marker");
    expect(marker.flags).toBe(0);
    expect(marker.stateChanges).toEqual([]);
    expect(marker.propChanges).toEqual([]);
    expect(marker.componentLogs).toEqual([]);
    expect(marker.isTracked).toBe(false);
    expect(marker.trackingGUID).toBeNull();
    expect(marker.hasIdenticalValueWarning).toBe(false);
    expect(marker.filteredNodeCount).toBe(1);
  });

  it("should create marker node with correct format for 2 levels", () => {
    const marker = createMarkerNode(3, 2, 2);

    expect(marker.componentName).toBe("... (2 levels collapsed)");
    expect(marker.displayName).toBe("... (2 levels collapsed)");
    expect(marker.filteredNodeCount).toBe(2);
  });

  it("should create marker node with correct format for 5 levels", () => {
    const marker = createMarkerNode(10, 5, 5);

    expect(marker.componentName).toBe("... (5 levels collapsed)");
    expect(marker.displayName).toBe("... (5 levels collapsed)");
    expect(marker.filteredNodeCount).toBe(5);
  });

  it("should preserve original depth", () => {
    const marker = createMarkerNode(42, 3, 3);

    expect(marker.depth).toBe(42);
  });

  it("should create marker at depth 0", () => {
    const marker = createMarkerNode(0, 1, 1);

    expect(marker.depth).toBe(0);
    expect(marker.componentName).toBe("... (1 levels collapsed)");
  });

  it("should return immutable arrays", () => {
    const marker = createMarkerNode(5, 3, 3);

    expect(Object.isFrozen(marker.stateChanges)).toBe(true);
    expect(Object.isFrozen(marker.propChanges)).toBe(true);
    expect(Object.isFrozen(marker.componentLogs)).toBe(true);
  });

  it("should return readonly TreeNode (type check)", () => {
    const marker: TreeNode = createMarkerNode(5, 3, 3);

    // Type check: this should compile without errors
    // The readonly properties prevent mutations
    expect(marker).toBeDefined();
  });
});
