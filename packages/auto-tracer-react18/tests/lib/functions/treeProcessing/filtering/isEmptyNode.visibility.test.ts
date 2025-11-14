import { describe, it, expect } from "vitest";
import { isEmptyNode } from "../../../../../src/lib/functions/treeProcessing/filtering/isEmptyNode.js";
import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";
import type {
  StateChangeWithWarning,
  PropChangeWithWarning,
} from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";

/**
 * Tests for NonTrackedComponentVisibility feature.
 *
 * This test suite verifies the new visibility filtering behavior where:
 * - Tracked components are ALWAYS visible regardless of settings
 * - Non-tracked components visibility is controlled by:
 *   - "never": Never show
 *   - "forProps": Show only if has props
 *   - "forState": Show only if has state
 *   - "forPropsOrState": Show if has props OR state
 *   - "always": Always show
 */
describe("isEmptyNode - NonTrackedComponentVisibility", () => {
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

  // Helper to create state change
  const createStateChange = (
    name: string,
    value: unknown,
    prevValue: unknown
  ): StateChangeWithWarning => ({
    name,
    value,
    prevValue,
    hook: { memoizedState: value, queue: null, next: null },
    isIdenticalValueChange: false,
  });

  // Helper to create prop change
  const createPropChange = (
    name: string,
    value: unknown,
    prevValue: unknown
  ): PropChangeWithWarning => ({
    name,
    value,
    prevValue,
    isIdenticalValueChange: false,
  });

  describe('Tracked components are always visible', () => {
    it('should show tracked Mount component with "never" setting', () => {
      const node = createNode({
        renderType: "Mount",
        isTracked: true,
        trackingGUID: "test-guid-1"
      });
      const options = {
        includeReconciled: "never" as const,
        includeSkipped: "never" as const,
        includeMount: "never" as const
      };

      // Tracked components override visibility settings
      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show tracked Rendering component with "never" setting', () => {
      const node = createNode({
        renderType: "Rendering",
        isTracked: true,
        trackingGUID: "test-guid-2"
      });
      const options = {
        includeReconciled: "never" as const,
        includeSkipped: "never" as const,
        includeMount: "never" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show tracked Reconciled component with "never" setting', () => {
      const node = createNode({
        renderType: "Reconciled",
        isTracked: true,
        trackingGUID: "test-guid-3"
      });
      const options = {
        includeReconciled: "never" as const,
        includeSkipped: "never" as const,
        includeMount: "never" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });
  });

  describe('visibility: "never"', () => {
    it('should hide non-tracked Mount without props/state', () => {
      const node = createNode({ renderType: "Mount" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "never" as const
      };

      expect(isEmptyNode(node, options)).toBe(true);
    });

    it('should hide non-tracked Mount even with props', () => {
      const node = createNode({
        renderType: "Mount",
        propChanges: [createPropChange("value", 10, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "never" as const
      };

      // "never" means NEVER show non-tracked, even with content
      expect(isEmptyNode(node, options)).toBe(true);
    });

    it('should hide non-tracked Mount even with state', () => {
      const node = createNode({
        renderType: "Mount",
        stateChanges: [createStateChange("count", 0, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "never" as const
      };

      expect(isEmptyNode(node, options)).toBe(true);
    });

    it('should hide non-tracked Rendering without props/state', () => {
      const node = createNode({ renderType: "Rendering" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "never" as const
      };

      // Rendering without content is always empty
      expect(isEmptyNode(node, options)).toBe(true);
    });
  });

  describe('visibility: "forProps"', () => {
    it('should show non-tracked Mount with initial props', () => {
      const node = createNode({
        renderType: "Mount",
        propChanges: [createPropChange("value", 10, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forProps" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show non-tracked Rendering with prop changes', () => {
      const node = createNode({
        renderType: "Rendering",
        propChanges: [createPropChange("value", 10, 5)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forProps" as const,
        includeRendered: "forProps" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should hide non-tracked Mount with only state (no props)', () => {
      const node = createNode({
        renderType: "Mount",
        stateChanges: [createStateChange("count", 0, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forProps" as const
      };

      // Has state but not props - should be hidden with "forProps"
      expect(isEmptyNode(node, options)).toBe(true);
    });

    it('should hide non-tracked Mount without props or state', () => {
      const node = createNode({ renderType: "Mount" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forProps" as const
      };

      expect(isEmptyNode(node, options)).toBe(true);
    });
  });

  describe('visibility: "forState"', () => {
    it('should show non-tracked Mount with initial state', () => {
      const node = createNode({
        renderType: "Mount",
        stateChanges: [createStateChange("count", 0, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forState" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show non-tracked Rendering with state changes', () => {
      const node = createNode({
        renderType: "Rendering",
        stateChanges: [createStateChange("count", 5, 0)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forState" as const,
        includeRendered: "forState" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should hide non-tracked Mount with only props (no state)', () => {
      const node = createNode({
        renderType: "Mount",
        propChanges: [createPropChange("value", 10, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forState" as const
      };

      // Has props but not state - should be hidden with "forState"
      expect(isEmptyNode(node, options)).toBe(true);
    });

    it('should hide non-tracked Mount without props or state', () => {
      const node = createNode({ renderType: "Mount" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forState" as const
      };

      expect(isEmptyNode(node, options)).toBe(true);
    });
  });

  describe('visibility: "forPropsOrState"', () => {
    it('should show non-tracked Mount with props only', () => {
      const node = createNode({
        renderType: "Mount",
        propChanges: [createPropChange("value", 10, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forPropsOrState" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show non-tracked Mount with state only', () => {
      const node = createNode({
        renderType: "Mount",
        stateChanges: [createStateChange("count", 0, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forPropsOrState" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show non-tracked Mount with both props and state', () => {
      const node = createNode({
        renderType: "Mount",
        propChanges: [createPropChange("value", 10, undefined)],
        stateChanges: [createStateChange("count", 0, undefined)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forPropsOrState" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should hide non-tracked Mount without props or state', () => {
      const node = createNode({ renderType: "Mount" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forPropsOrState" as const
      };

      expect(isEmptyNode(node, options)).toBe(true);
    });

    it('should show non-tracked Rendering with prop changes', () => {
      const node = createNode({
        renderType: "Rendering",
        propChanges: [createPropChange("value", 10, 5)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forPropsOrState" as const,
        includeRendered: "forPropsOrState" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show non-tracked Rendering with state changes', () => {
      const node = createNode({
        renderType: "Rendering",
        stateChanges: [createStateChange("count", 5, 0)]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "forPropsOrState" as const,
        includeRendered: "forPropsOrState" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });
  });

  describe('visibility: "always"', () => {
    it('should show non-tracked Mount without props or state', () => {
      const node = createNode({ renderType: "Mount" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "always" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show non-tracked Reconciled without content', () => {
      const node = createNode({ renderType: "Reconciled" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "always" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });

    it('should show non-tracked Skipped without content', () => {
      const node = createNode({ renderType: "Skipped" });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "always" as const
      };

      expect(isEmptyNode(node, options)).toBe(false);
    });
  });

  describe('Component logs override visibility', () => {
    it('should show non-tracked Mount with logs even with "never"', () => {
      const node = createNode({
        renderType: "Mount",
        componentLogs: [{
          message: "test",
          args: ["test"],
          timestamp: Date.now(),
          level: "log" as const
        }]
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "never" as const
      };

      // Component logs make node non-empty regardless of visibility
      expect(isEmptyNode(node, options)).toBe(false);
    });
  });

  describe('Identical value warnings respect visibility', () => {
    it('should hide non-tracked Mount with warning when visibility is "never"', () => {
      const node = createNode({
        renderType: "Mount",
        hasIdenticalValueWarning: true
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "always" as const,
        includeMount: "never" as const
      };

      // Warnings now respect visibility settings - "never" means hidden
      expect(isEmptyNode(node, options)).toBe(true);
    });
  });

  describe('Multiple visibility settings combined', () => {
    it('should apply includeReconciled="forProps" correctly', () => {
      const withProps = createNode({
        renderType: "Reconciled",
        propChanges: [createPropChange("value", 10, 5)]
      });
      const withoutProps = createNode({
        renderType: "Reconciled"
      });
      const options = {
        includeReconciled: "forProps" as const,
        includeSkipped: "always" as const,
        includeMount: "always" as const
      };

      expect(isEmptyNode(withProps, options)).toBe(false);
      expect(isEmptyNode(withoutProps, options)).toBe(true);
    });

    it('should apply includeSkipped="forState" correctly', () => {
      const withState = createNode({
        renderType: "Skipped",
        stateChanges: [createStateChange("count", 5, 0)]
      });
      const withoutState = createNode({
        renderType: "Skipped"
      });
      const options = {
        includeReconciled: "always" as const,
        includeSkipped: "forState" as const,
        includeMount: "always" as const
      };

      expect(isEmptyNode(withState, options)).toBe(false);
      expect(isEmptyNode(withoutState, options)).toBe(true);
    });

    it('should handle different settings for different render types', () => {
      const reconciled = createNode({ renderType: "Reconciled" });
      const skipped = createNode({ renderType: "Skipped" });
      const mount = createNode({ renderType: "Mount" });

      const options = {
        includeReconciled: "never" as const,
        includeSkipped: "always" as const,
        includeMount: "forPropsOrState" as const,
        includeRendered: "always" as const
      };

      expect(isEmptyNode(reconciled, options)).toBe(true);  // Never shown
      expect(isEmptyNode(skipped, options)).toBe(false);     // Always shown
      expect(isEmptyNode(mount, options)).toBe(true);        // No props/state
    });
  });

  describe('includeRendered visibility setting', () => {
    describe('visibility: "never"', () => {
      it('should hide non-tracked Rendering without props/state', () => {
        const node = createNode({ renderType: "Rendering" });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "never" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });

      it('should hide non-tracked Rendering even with props', () => {
        const node = createNode({
          renderType: "Rendering",
          propChanges: [createPropChange("value", 10, 5)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "never" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });

      it('should hide non-tracked Rendering even with state', () => {
        const node = createNode({
          renderType: "Rendering",
          stateChanges: [createStateChange("count", 5, 0)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "never" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });
    });

    describe('visibility: "forProps"', () => {
      it('should show non-tracked Rendering with prop changes', () => {
        const node = createNode({
          renderType: "Rendering",
          propChanges: [createPropChange("value", 10, 5)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forProps" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it('should hide non-tracked Rendering with only state (no props)', () => {
        const node = createNode({
          renderType: "Rendering",
          stateChanges: [createStateChange("count", 5, 0)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forProps" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });

      it('should hide non-tracked Rendering without props or state', () => {
        const node = createNode({ renderType: "Rendering" });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forProps" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });
    });

    describe('visibility: "forState"', () => {
      it('should show non-tracked Rendering with state changes', () => {
        const node = createNode({
          renderType: "Rendering",
          stateChanges: [createStateChange("count", 5, 0)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forState" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it('should hide non-tracked Rendering with only props (no state)', () => {
        const node = createNode({
          renderType: "Rendering",
          propChanges: [createPropChange("value", 10, 5)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forState" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });

      it('should hide non-tracked Rendering without props or state', () => {
        const node = createNode({ renderType: "Rendering" });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forState" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });
    });

    describe('visibility: "forPropsOrState"', () => {
      it('should show non-tracked Rendering with props', () => {
        const node = createNode({
          renderType: "Rendering",
          propChanges: [createPropChange("value", 10, 5)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forPropsOrState" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it('should show non-tracked Rendering with state', () => {
        const node = createNode({
          renderType: "Rendering",
          stateChanges: [createStateChange("count", 5, 0)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forPropsOrState" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it('should show non-tracked Rendering with both props and state', () => {
        const node = createNode({
          renderType: "Rendering",
          propChanges: [createPropChange("value", 10, 5)],
          stateChanges: [createStateChange("count", 5, 0)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forPropsOrState" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it('should hide non-tracked Rendering without props or state', () => {
        const node = createNode({ renderType: "Rendering" });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "forPropsOrState" as const
        };

        expect(isEmptyNode(node, options)).toBe(true);
      });
    });

    describe('visibility: "always"', () => {
      it('should show non-tracked Rendering without props/state', () => {
        const node = createNode({ renderType: "Rendering" });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "always" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it('should show non-tracked Rendering with props', () => {
        const node = createNode({
          renderType: "Rendering",
          propChanges: [createPropChange("value", 10, 5)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "always" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });

      it('should show non-tracked Rendering with state', () => {
        const node = createNode({
          renderType: "Rendering",
          stateChanges: [createStateChange("count", 5, 0)]
        });
        const options = {
          includeReconciled: "always" as const,
          includeSkipped: "always" as const,
          includeMount: "always" as const,
          includeRendered: "always" as const
        };

        expect(isEmptyNode(node, options)).toBe(false);
      });
    });
  });
});
