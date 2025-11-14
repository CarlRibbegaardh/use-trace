import { describe, it, expect } from "vitest";
import { filterAllEmptyNodes } from "../../../../../src/lib/functions/treeProcessing/filtering/filterAllEmptyNodes.js";
import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";
import type { EmptyNodeOptions } from "../../../../../src/lib/functions/treeProcessing/filtering/isEmptyNode.js";

describe("filterAllEmptyNodes", () => {
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
      const result = filterAllEmptyNodes([], defaultOptions);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("No empty nodes", () => {
    it("should return unchanged array when no nodes are empty", () => {
      const nodes = [
        createNode({
          depth: 0,
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }),
        createNode({
          depth: 1,
          propChanges: [{ name: "count", value: 5, prevValue: 0 }],
        }),
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(nodes[0]);
      expect(result[1]).toBe(nodes[1]);
    });

    it("should preserve tracked nodes as non-empty", () => {
      const nodes = [
        createNode({ depth: 0, isTracked: true, trackingGUID: "guid-1" }),
        createNode({ depth: 1, isTracked: true, trackingGUID: "guid-2" }),
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(nodes[0]);
      expect(result[1]).toBe(nodes[1]);
    });
  });

  describe("Single empty sequence", () => {
    it("should replace initial empty sequence with marker", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty
        createNode({ depth: 1, renderType: "Rendering" }), // Empty
        createNode({
          depth: 2,
          stateChanges: [
            {
              name: "count",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }), // Non-empty
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(2);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[0]!.depth).toBe(0);
      expect(result[1]).toBe(nodes[2]);
    });

    it("should replace trailing empty sequence with marker", () => {
      const nodes = [
        createNode({
          depth: 0,
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }), // Non-empty
        createNode({ depth: 1, renderType: "Rendering" }), // Empty
        createNode({ depth: 2, renderType: "Rendering" }), // Empty
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(nodes[0]);
      expect(result[1]!.renderType).toBe("Marker");
      expect(result[1]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[1]!.depth).toBe(1);
    });

    it("should replace all nodes with single marker when all empty", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }),
        createNode({ depth: 1, renderType: "Rendering" }),
        createNode({ depth: 2, renderType: "Rendering" }),
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(1);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (3 levels collapsed)");
      expect(result[0]!.depth).toBe(0);
    });
  });

  describe("Multiple empty sequences", () => {
    it("should replace two separate empty sequences with markers", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty
        createNode({ depth: 1, renderType: "Rendering" }), // Empty
        createNode({
          depth: 2,
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }), // Non-empty
        createNode({ depth: 3, renderType: "Rendering" }), // Empty
        createNode({ depth: 4, renderType: "Rendering" }), // Empty
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[0]!.depth).toBe(0);
      expect(result[1]).toBe(nodes[2]);
      expect(result[2]!.renderType).toBe("Marker");
      expect(result[2]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[2]!.depth).toBe(3);
    });

    it("should handle three separate empty sequences", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty
        createNode({
          depth: 1,
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }), // Non-empty
        createNode({ depth: 2, renderType: "Rendering" }), // Empty
        createNode({ depth: 3, renderType: "Rendering" }), // Empty
        createNode({
          depth: 4,
          propChanges: [{ name: "count", value: 5, prevValue: 0 }],
        }), // Non-empty
        createNode({ depth: 5, renderType: "Rendering" }), // Empty
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(5);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.componentName).toBe("... (1 levels collapsed)");
      expect(result[0]!.depth).toBe(0);
      expect(result[1]).toBe(nodes[1]);
      expect(result[2]!.renderType).toBe("Marker");
      expect(result[2]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[2]!.depth).toBe(2);
      expect(result[3]).toBe(nodes[4]);
      expect(result[4]!.renderType).toBe("Marker");
      expect(result[4]!.componentName).toBe("... (1 levels collapsed)");
      expect(result[4]!.depth).toBe(5);
    });

    it("should handle alternating empty and non-empty nodes", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty
        createNode({
          depth: 1,
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }), // Non-empty
        createNode({ depth: 2, renderType: "Rendering" }), // Empty
        createNode({
          depth: 3,
          propChanges: [{ name: "count", value: 5, prevValue: 0 }],
        }), // Non-empty
        createNode({ depth: 4, renderType: "Rendering" }), // Empty
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(5);
      // Each single empty node becomes a marker
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[1]).toBe(nodes[1]);
      expect(result[2]!.renderType).toBe("Marker");
      expect(result[3]).toBe(nodes[3]);
      expect(result[4]!.renderType).toBe("Marker");
    });
  });

  describe("Marker preservation", () => {
    it("should treat existing markers as non-empty", () => {
      const marker = createNode({
        depth: 1,
        componentName: "... (5 levels collapsed)",
        renderType: "Marker",
      });
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty
        marker, // Non-empty (marker)
        createNode({ depth: 6, renderType: "Rendering" }), // Empty
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.depth).toBe(0);
      expect(result[1]).toBe(marker);
      expect(result[2]!.renderType).toBe("Marker");
      expect(result[2]!.depth).toBe(6);
    });
  });

  describe("Visibility filtering interaction", () => {
    it("should treat filtered Reconciled nodes as empty when includeReconciled=false", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Reconciled" }), // Filtered = empty
        createNode({
          depth: 1,
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }), // Non-empty
        createNode({ depth: 2, renderType: "Reconciled" }), // Filtered = empty
        createNode({ depth: 3, renderType: "Reconciled" }), // Filtered = empty
      ];

      const options: EmptyNodeOptions = {
        includeReconciled: "never" as const,
        includeSkipped: "always" as const,
        includeMount: "always" as const,
        includeRendered: "forPropsOrState" as const,
      };

      const result = filterAllEmptyNodes(nodes, options);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[0]!.depth).toBe(0);
      expect(result[1]).toBe(nodes[1]);
      expect(result[2]!.renderType).toBe("Marker");
      expect(result[2]!.componentName).toBe("... (2 levels collapsed)");
      expect(result[2]!.depth).toBe(2);
    });

    it("should NOT treat visible Reconciled nodes as empty when includeReconciled=true", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Reconciled" }), // Visible = non-empty
        createNode({ depth: 1, renderType: "Reconciled" }), // Visible = non-empty
      ];

      const options: EmptyNodeOptions = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "always" as const,
      };

      const result = filterAllEmptyNodes(nodes, options);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(nodes[0]);
      expect(result[1]).toBe(nodes[1]);
    });

    it("should treat filtered Skipped nodes as empty when includeSkipped=false", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Skipped" }), // Filtered = empty
        createNode({
          depth: 1,
          propChanges: [{ name: "count", value: 5, prevValue: 0 }],
        }), // Non-empty
        createNode({ depth: 2, renderType: "Skipped" }), // Filtered = empty
      ];

      const options: EmptyNodeOptions = {
        includeReconciled: "always" as const,
        includeSkipped: "never" as const,
        includeMount: "always" as const,
        includeRendered: "forPropsOrState" as const,
      };

      const result = filterAllEmptyNodes(nodes, options);

      expect(result).toHaveLength(3);
      expect(result[0]!.renderType).toBe("Marker");
      expect(result[1]).toBe(nodes[1]);
      expect(result[2]!.renderType).toBe("Marker");
    });
  });

  describe("Immutability guarantees", () => {
    it("should not mutate the input array", () => {
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }),
        createNode({ depth: 1, renderType: "Rendering" }),
      ];
      const originalLength = nodes.length;
      const firstNode = nodes[0];

      filterAllEmptyNodes(nodes, defaultOptions);

      expect(nodes).toHaveLength(originalLength);
      expect(nodes[0]).toBe(firstNode);
    });

    it("should return new array instance", () => {
      const nodes = [
        createNode({
          depth: 0,
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        }),
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result).not.toBe(nodes);
    });

    it("should reuse non-empty node references (structural sharing)", () => {
      const nonEmptyNode = createNode({
        depth: 1,
        stateChanges: [
          {
            name: "state0",
            value: 1,
            prevValue: 0,
            hook: { memoizedState: 1, queue: null, next: null },
          },
        ],
      });
      const nodes = [
        createNode({ depth: 0, renderType: "Rendering" }), // Empty
        nonEmptyNode,
        createNode({ depth: 2, renderType: "Rendering" }), // Empty
      ];

      const result = filterAllEmptyNodes(nodes, defaultOptions);

      expect(result[1]).toBe(nonEmptyNode);
    });
  });
});
