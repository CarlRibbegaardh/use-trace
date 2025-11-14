import { describe, it, expect } from "vitest";
import { isEmptyNode } from "../../../../../src/lib/functions/treeProcessing/filtering/isEmptyNode.js";
import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";
import type {
  StateChangeWithWarning,
  PropChangeWithWarning,
} from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";

describe("isEmptyNode", () => {
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

  // Helper to create state change with warning flag
  const createStateChange = (
    name: string,
    value: unknown,
    prevValue: unknown,
    isIdenticalValueChange: boolean = false
  ): StateChangeWithWarning => ({
    name,
    value,
    prevValue,
    hook: { memoizedState: value, queue: null, next: null },
    isIdenticalValueChange,
  });

  // Helper to create prop change with warning flag
  const createPropChange = (
    name: string,
    value: unknown,
    prevValue: unknown,
    isIdenticalValueChange: boolean = false
  ): PropChangeWithWarning => ({
    name,
    value,
    prevValue,
    isIdenticalValueChange,
  });

  describe("Phase 1: Content Filtering (takes precedence)", () => {
    it("should consider Reconciled node as empty when includeReconciled='never' and no content", () => {
      const node = createNode({ renderType: "Reconciled" });
      const options = { includeReconciled: "never" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

      expect(isEmptyNode(node, options)).toBe(true);
    });

    it("should NOT consider Reconciled node as empty when includeReconciled='always' and no content", () => {
      const node = createNode({ renderType: "Reconciled" });
      const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it("should consider Skipped node as empty when includeSkipped='never' and no content", () => {
      const node = createNode({ renderType: "Skipped" });
      const options = { includeReconciled: "always" as const, includeSkipped: "never" as const, includeMount: "always" as const, includeRendered: "always" as const };

      expect(isEmptyNode(node, options)).toBe(true);
    });

    it("should NOT consider Skipped node as empty when includeSkipped='always' and no content", () => {
      const node = createNode({ renderType: "Skipped" });
      const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it("should NOT consider Reconciled node as empty when it has state changes, with includeReconciled='forPropsOrState'", () => {
      const node = createNode({
        renderType: "Reconciled",
        stateChanges: [createStateChange("state0", 1, 0)],
      });
      const options = { includeReconciled: "forPropsOrState" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

      // State changes make it visible with "forPropsOrState"
      expect(isEmptyNode(node, options)).toBe(false);
    });

    it("should NOT consider Skipped node as empty when it has prop changes, with includeSkipped='forPropsOrState'", () => {
      const node = createNode({
        renderType: "Skipped",
        propChanges: [createPropChange("value", 10, 5)],
      });
      const options = { includeReconciled: "always" as const, includeSkipped: "forPropsOrState" as const, includeMount: "always" as const, includeRendered: "always" as const };

      // Prop changes make it visible with "forPropsOrState"
      expect(isEmptyNode(node, options)).toBe(false);
    });
  });

  describe("Phase 2: Visibility Filtering (only for empty nodes)", () => {
    describe("Mount and Rendering nodes (always visible)", () => {
      it("should NOT consider Mount node empty when includeMount=true (default)", () => {
        const node = createNode({ renderType: "Mount" });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should consider Rendering node empty when no changes", () => {
        const node = createNode({ renderType: "Rendering" });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "never" as const };

        expect(isEmptyNode(node, options)).toBe(true);
      });

      it("should NOT consider Mount node empty when has state changes", () => {
        const node = createNode({
          renderType: "Mount",
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: undefined,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should NOT consider Rendering node empty when has prop changes", () => {
        const node = createNode({
          renderType: "Rendering",
          propChanges: [{ name: "value", value: 10, prevValue: 5 }],
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should NOT consider node empty when has component logs", () => {
        const node = createNode({
          renderType: "Rendering",
          componentLogs: [{ message: "test", args: [], timestamp: Date.now(), level: 'log' }],
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should NOT consider node empty when isTracked=true", () => {
        const node = createNode({
          renderType: "Rendering",
          isTracked: true,
          trackingGUID: "test-guid",
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should NOT consider node empty when hasIdenticalValueWarning=true", () => {
        const node = createNode({
          renderType: "Rendering",
          hasIdenticalValueWarning: true,
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should NOT consider node empty when has multiple content indicators", () => {
        const node = createNode({
          renderType: "Rendering",
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
          propChanges: [{ name: "value", value: 10, prevValue: 5 }],
          isTracked: true,
          trackingGUID: "test-guid",
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });
    });

    describe("Reconciled nodes (visible when includeReconciled=true)", () => {
      it("should NOT consider Reconciled node empty when visible (even without changes)", () => {
        const node = createNode({ renderType: "Reconciled" });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        // Reconciled nodes are never considered empty when visible
        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should NOT consider Reconciled node empty with state changes when visible", () => {
        const node = createNode({
          renderType: "Reconciled",
          stateChanges: [
            {
              name: "state0",
              value: 1,
              prevValue: 0,
              hook: { memoizedState: 1, queue: null, next: null },
            },
          ],
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });
    });

    describe("Skipped nodes (visible when includeSkipped=true)", () => {
      it("should NOT consider Skipped node empty when visible (even without changes)", () => {
        const node = createNode({ renderType: "Skipped" });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        // Skipped nodes are never considered empty when visible
        expect(isEmptyNode(node, options)).toBe(false);
      });

      it("should NOT consider Skipped node empty with prop changes when visible", () => {
        const node = createNode({
          renderType: "Skipped",
          propChanges: [{ name: "value", value: 10, prevValue: 5 }],
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });
    });

    describe("Marker nodes (always visible, never empty)", () => {
      it("should NOT consider Marker node as empty", () => {
        const node = createNode({
          renderType: "Marker",
          componentName: "... (3 levels collapsed)",
        });
        const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "always" as const };

        expect(isEmptyNode(node, options)).toBe(false);
      });
    });
  });

  describe("Edge cases and combinations", () => {
    it("should handle both visibility filters set to false", () => {
      const reconciled = createNode({ renderType: "Reconciled" });
      const skipped = createNode({ renderType: "Skipped" });
      const rendering = createNode({ renderType: "Rendering" });
      const options = { includeReconciled: "never" as const, includeSkipped: "never" as const, includeMount: "always" as const, includeRendered: "never" as const };

      expect(isEmptyNode(reconciled, options)).toBe(true);
      expect(isEmptyNode(skipped, options)).toBe(true);
      expect(isEmptyNode(rendering, options)).toBe(true); // Empty Rendering node
    });

    it("should handle both visibility filters set to true", () => {
      const reconciled = createNode({ renderType: "Reconciled" });
      const skipped = createNode({ renderType: "Skipped" });
      const rendering = createNode({ renderType: "Rendering" });
      const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "never" as const };

      expect(isEmptyNode(reconciled, options)).toBe(false); // Visible, never empty
      expect(isEmptyNode(skipped, options)).toBe(false); // Visible, never empty
      expect(isEmptyNode(rendering, options)).toBe(true); // Empty content
    });

    it("should handle nodes with empty arrays (truly empty)", () => {
      const node = createNode({
        renderType: "Rendering",
        stateChanges: [],
        propChanges: [],
        componentLogs: [],
      });
      const options = { includeReconciled: "always" as const, includeSkipped: "always" as const, includeMount: "always" as const, includeRendered: "never" as const };

      expect(isEmptyNode(node, options)).toBe(true);
    });
  });
});
