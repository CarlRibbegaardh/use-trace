import { describe, expect, it } from "vitest";
import { applyEmptyNodeFilter } from "../../../../../src/lib/functions/treeProcessing/filtering/applyEmptyNodeFilter.js";
import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";
import type { EmptyNodeOptions } from "../../../../../src/lib/functions/treeProcessing/filtering/isEmptyNode.js";

/**
 * Helper to create test TreeNode
 */
function createNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    depth: 0,
    componentName: "TestComponent",
    displayName: "TestComponent",
    renderType: "Rendering",
    flags: 0,
    stateChanges: [],
    propChanges: [],
    componentLogs: [],
    isTracked: false,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
    ...overrides,
  };
}

describe("applyEmptyNodeFilter", () => {
  const defaultOptions: EmptyNodeOptions = {
    includeReconciled: true,
    includeSkipped: true,
    includeMount: true,
  };

  describe("Mode: 'none'", () => {
    it("should return identity function for 'none' mode", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty
        createNode({ depth: 1, renderType: "Rendering" }), // Empty
        createNode({ depth: 2, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const filterFn = applyEmptyNodeFilter("none");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toBe(nodes); // Exact same reference (identity)
      expect(result).toHaveLength(3);
    });

    it("should not modify array when mode is 'none'", () => {
      const nodes = [
        createNode({ depth: 0 }),
        createNode({ depth: 1 }),
        createNode({ depth: 2 }),
      ];

      const filterFn = applyEmptyNodeFilter("none");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toEqual(nodes);
      expect(result).toBe(nodes);
    });

    it("should work with empty array in 'none' mode", () => {
      const nodes: TreeNode[] = [];

      const filterFn = applyEmptyNodeFilter("none");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toBe(nodes);
      expect(result).toHaveLength(0);
    });
  });

  describe("Mode: 'first'", () => {
    it("should return filterFirstEmptyNodes function for 'first' mode", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty - should be filtered
        createNode({ depth: 1, renderType: "Rendering" }), // Empty - should be filtered
        createNode({ depth: 2, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }), // Non-empty
        createNode({ depth: 3, renderType: "Rendering" }), // Empty - should NOT be filtered
      ];

      const filterFn = applyEmptyNodeFilter("first");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[1]).toBe(nodes[2]); // Non-empty node preserved
      expect(result[2]).toBe(nodes[3]); // Later empty node preserved
    });

    it("should only filter initial empty sequence in 'first' mode", () => {
      const nodes = [
        createNode({ depth: 0 }), // Empty - filtered
        createNode({ depth: 1, propChanges: [{ name: "count", value: 5, prevValue: 0 }] }), // Non-empty
        createNode({ depth: 2 }), // Empty - NOT filtered
      ];

      const filterFn = applyEmptyNodeFilter("first");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[1]).toBe(nodes[1]);
      expect(result[2]).toBe(nodes[2]);
    });

    it("should handle empty array in 'first' mode", () => {
      const nodes: TreeNode[] = [];

      const filterFn = applyEmptyNodeFilter("first");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toHaveLength(0);
    });
  });

  describe("Mode: 'all'", () => {
    it("should return filterAllEmptyNodes function for 'all' mode", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty - should be filtered
        createNode({ depth: 1, renderType: "Rendering" }), // Empty - should be filtered
        createNode({ depth: 2, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }), // Non-empty
        createNode({ depth: 3, renderType: "Rendering" }), // Empty - should be filtered
        createNode({ depth: 4, renderType: "Rendering" }), // Empty - should be filtered
      ];

      const filterFn = applyEmptyNodeFilter("all");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[1]).toBe(nodes[2]); // Non-empty node preserved
      expect(result[2]!.renderType).toBe("Marker");
      expect(result[2]!.componentName).toBe("... (2 levels collapsed)");
    });

    it("should filter all empty sequences in 'all' mode", () => {
      const nodes = [
        createNode({ depth: 0 }), // Empty - filtered
        createNode({ depth: 1, propChanges: [{ name: "count", value: 5, prevValue: 0 }] }), // Non-empty
        createNode({ depth: 2 }), // Empty - filtered
        createNode({ depth: 3 }), // Empty - filtered
        createNode({ depth: 4, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }), // Non-empty
      ];

      const filterFn = applyEmptyNodeFilter("all");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toHaveLength(4);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[1]).toBe(nodes[1]);
      expect(result[2]!.renderType).toBe("Marker");
      expect(result[3]).toBe(nodes[4]);
    });

    it("should handle empty array in 'all' mode", () => {
      const nodes: TreeNode[] = [];

      const filterFn = applyEmptyNodeFilter("all");
      const result = filterFn(nodes, defaultOptions);

      expect(result).toHaveLength(0);
    });
  });

  describe("Function purity", () => {
    it("should return same function reference for same mode", () => {
      const filterFn1 = applyEmptyNodeFilter("none");
      const filterFn2 = applyEmptyNodeFilter("none");

      // Should be the same function reference (no recreation)
      expect(filterFn1).toBe(filterFn2);
    });

    it("should return different function references for different modes", () => {
      const noneFn = applyEmptyNodeFilter("none");
      const firstFn = applyEmptyNodeFilter("first");
      const allFn = applyEmptyNodeFilter("all");

      expect(noneFn).not.toBe(firstFn);
      expect(noneFn).not.toBe(allFn);
      expect(firstFn).not.toBe(allFn);
    });

    it("should be pure (same input produces same output)", () => {
      const nodes = [
        createNode({ depth: 0 }),
        createNode({ depth: 1, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const filterFn = applyEmptyNodeFilter("first");
      const result1 = filterFn(nodes, defaultOptions);
      const result2 = filterFn(nodes, defaultOptions);

      // Results should be structurally equal
      expect(result1).toEqual(result2);
      // But should be different instances (new array created each time)
      expect(result1).not.toBe(result2);
    });
  });

  describe("Options propagation", () => {
    it("should pass options to filter function for 'first' mode", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Reconciled" }), // Filtered when includeReconciled=false
        createNode({ depth: 1, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const options: EmptyNodeOptions = {
        includeReconciled: false,
        includeSkipped: true,
        includeMount: true,
      };

      const filterFn = applyEmptyNodeFilter("first");
      const result = filterFn(nodes, options);

      expect(result).toHaveLength(2);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[1]).toBe(nodes[1]);
    });

    it("should pass options to filter function for 'all' mode", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Skipped" }), // Filtered when includeSkipped=false
        createNode({ depth: 1, propChanges: [{ name: "count", value: 5, prevValue: 0 }] }),
        createNode({ depth: 2, renderType: "Skipped" }), // Filtered when includeSkipped=false
      ];

      const options: EmptyNodeOptions = {
        includeReconciled: true,
        includeSkipped: false,
        includeMount: true,
      };

      const filterFn = applyEmptyNodeFilter("all");
      const result = filterFn(nodes, options);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[1]).toBe(nodes[1]);
      expect(result[2]!.renderType).toBe("Marker");
    });
  });
});
