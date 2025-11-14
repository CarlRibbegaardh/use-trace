import { describe, it, expect } from "vitest";
import { filterFirstEmptyNodes } from "../../../../../src/lib/functions/treeProcessing/filtering/filterFirstEmptyNodes.js";
import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";
import type { EmptyNodeOptions } from "../../../../../src/lib/functions/treeProcessing/filtering/isEmptyNode.js";

describe("filterFirstEmptyNodes", () => {
  // Helper to create test nodes
  const createNode = (overrides: Partial<TreeNode>): TreeNode => ({
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
  });

  const defaultOptions: EmptyNodeOptions = {
    includeReconciled: "always" as const,
    includeSkipped: "always" as const,
    includeMount: "always" as const,
    includeRendered: "forPropsOrState" as const,
  };

  describe("Empty array edge cases", () => {
    it("should return empty array when input is empty", () => {
      const result = filterFirstEmptyNodes([], defaultOptions);
      expect(result).toEqual([]);
    });
  });

  describe("No initial empty nodes", () => {
    it("should return unchanged array when first node has content", () => {
      const nodes = [
        createNode({ depth: 0, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
        createNode({ depth: 1 }),
        createNode({ depth: 2 }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);
      expect(result).toEqual(nodes);
    });

    it("should return unchanged when tracked node is first", () => {
      const nodes = [
        createNode({ depth: 0, isTracked: true, trackingGUID: "test-guid" }),
        createNode({ depth: 1 }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);
      expect(result).toEqual(nodes);
    });

    it("should return unchanged when Reconciled node is first and visible", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Reconciled" }),
        createNode({ depth: 1 }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);
      expect(result).toEqual(nodes);
    });
  });

  describe("Single initial empty node", () => {
    it("should replace single initial empty node with marker", () => {
      const nodes = [
        createNode({ depth: 0 }), // Empty
        createNode({ depth: 1, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(2);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (1 levels collapsed)");
      expect(result[0]!.depth).toBe(0);
      expect(result[1]).toBe(nodes[1]); // Second node unchanged
    });

    it("should handle marker at different depth", () => {
      const nodes = [
        createNode({ depth: 5, componentName: "Empty5" }), // Empty
        createNode({ depth: 6, isTracked: true, trackingGUID: "guid" }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(2);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (1 levels collapsed)");
      expect(result[0]!.depth).toBe(5); // Preserves original depth
    });
  });

  describe("Multiple consecutive initial empty nodes", () => {
    it("should collapse multiple initial empty nodes into single marker", () => {
      const nodes = [
        createNode({ depth: 0, componentName: "Empty0" }), // Empty
        createNode({ depth: 1, componentName: "Empty1" }), // Empty
        createNode({ depth: 2, componentName: "Empty2" }), // Empty
        createNode({ depth: 3, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(2);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (3 levels collapsed)");
      expect(result[0]!.depth).toBe(0); // Depth of first empty node
      expect(result[1]).toBe(nodes[3]); // Non-empty node unchanged
    });

    it('should handle plural marker text correctly', () => {
      const nodes = [
        createNode({ depth: 10 }), // Empty
        createNode({ depth: 11 }), // Empty
        createNode({ depth: 12 }), // Empty
        createNode({ depth: 13 }), // Empty
        createNode({ depth: 14 }), // Empty
        // Warnings now respect visibility, so this node is also empty with default "never" setting
        createNode({ depth: 15, hasIdenticalValueWarning: true }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      // All 6 nodes are now empty, so they should all be collapsed into one marker
      expect(result).toHaveLength(1);
      expect(result[0]!.componentName).toBe("... (6 levels collapsed)");
      expect(result[0]!.depth).toBe(10);
    });
  });

  describe("All nodes empty", () => {
    it("should replace all nodes with single marker when all are empty", () => {
      const nodes = [
        createNode({ depth: 0 }),
        createNode({ depth: 1 }),
        createNode({ depth: 2 }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(1);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (3 levels collapsed)");
      expect(result[0]!.depth).toBe(0);
    });

    it("should handle single empty node in array", () => {
      const nodes = [createNode({ depth: 0 })];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(1);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (1 levels collapsed)");
    });
  });

  describe("Empty nodes later in sequence (should not be filtered)", () => {
    it("should only filter initial sequence, not later empty nodes", () => {
      const nodes = [
        createNode({ depth: 0 }), // Empty - should be filtered
        createNode({ depth: 1 }), // Empty - should be filtered
        createNode({ depth: 2, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }), // Non-empty
        createNode({ depth: 3 }), // Empty - should NOT be filtered
        createNode({ depth: 4 }), // Empty - should NOT be filtered
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(4);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[1]).toBe(nodes[2]); // Non-empty node
      expect(result[2]).toBe(nodes[3]); // Later empty node unchanged
      expect(result[3]).toBe(nodes[4]); // Later empty node unchanged
    });
  });

  describe("Visibility filtering interaction", () => {
    it("should treat filtered Reconciled nodes as empty when includeReconciled=false", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Reconciled" }), // Filtered out = empty
        createNode({ depth: 1, renderType: "Reconciled" }), // Filtered out = empty
        createNode({
          depth: 2,
          renderType: "Mount",
          stateChanges: [{
            name: "count",
            value: 1,
            prevValue: 0,
            hook: { memoizedState: 1, queue: null, next: null }
          }]
        }), // Has content = non-empty
      ];

      const options: EmptyNodeOptions = {
        includeReconciled: "never" as const,
        includeSkipped: "always" as const,
        includeMount: "always" as const,
      };

      const result = filterFirstEmptyNodes(nodes, options);

      expect(result).toHaveLength(2);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[1]).toBe(nodes[2]);
    });

    it("should NOT treat visible Reconciled nodes as empty when includeReconciled=true", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Reconciled" }), // Visible = not empty
        createNode({ depth: 1, renderType: "Mount" }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toEqual(nodes); // Unchanged
    });

    it("should treat filtered Skipped nodes as empty when includeSkipped=false", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Skipped" }), // Filtered out = empty
        createNode({ depth: 1, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const options: EmptyNodeOptions = {
        includeReconciled: "always" as const,
        includeSkipped: "never" as const,
        includeMount: "always" as const,
        includeRendered: "forPropsOrState" as const,
      };

      const result = filterFirstEmptyNodes(nodes, options);

      expect(result).toHaveLength(2);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (1 levels collapsed)");
    });
  });

  describe("Marker node preservation", () => {
    it("should treat existing Marker as non-empty (never filter markers)", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Marker", componentName: "... (5 levels collapsed)" }), // Marker = not empty
        createNode({ depth: 5, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).toEqual(nodes); // Unchanged - marker is never empty
    });
  });

  describe("Depth preservation", () => {
    it("should preserve the depth of the first empty node in marker", () => {
      const nodes = [
        createNode({ depth: 7 }),
        createNode({ depth: 8 }),
        createNode({ depth: 9, isTracked: true, trackingGUID: "test" }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result[0]!.depth).toBe(7); // First empty node's depth
      expect(result[0]!.componentName).toBe("... (2 levels collapsed)");
    });
  });

  describe("Immutability", () => {
    it("should not mutate the input array", () => {
      const nodes = [
        createNode({ depth: 0 }),
        createNode({ depth: 1, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];
      const originalNodes = [...nodes];

      filterFirstEmptyNodes(nodes, defaultOptions);

      expect(nodes).toEqual(originalNodes); // Input unchanged
    });

    it("should return new array instance", () => {
      const nodes = [
        createNode({ depth: 0 }),
        createNode({ depth: 1, stateChanges: [{ name: "state0", value: 1, prevValue: 0, hook: { memoizedState: 1, queue: null, next: null } }] }),
      ];

      const result = filterFirstEmptyNodes(nodes, defaultOptions);

      expect(result).not.toBe(nodes); // New array instance
    });
  });
});
