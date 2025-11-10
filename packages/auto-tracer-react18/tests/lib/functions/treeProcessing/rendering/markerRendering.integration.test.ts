import { beforeEach, describe, expect, it } from "vitest";
import { renderTree } from "../../../../../src/lib/functions/treeProcessing/rendering/renderTree.js";
import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";
import { traceOptions } from "../../../../../src/lib/types/globalState.js";

/**
 * Integration tests for marker rendering with visual depth calculation.
 *
 * These tests verify that:
 * 1. Markers don't generate intermediate connectors
 * 2. Visual depth is calculated based on filtered position
 * 3. Original depth is preserved for debug labels
 * 4. Multiple markers handle visual depth correctly
 */

/**
 * Captures console.log calls during test execution
 */
function captureConsoleLogs(fn: () => void): string[] {
  const logs: string[] = [];
  const originalLog = console.log;

  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(" "));
  };

  try {
    fn();
  } finally {
    console.log = originalLog;
  }

  return logs;
}

/**
 * Helper to get indent length from a string
 */
function getIndentLength(line: string): number {
  const match = line.match(/^( *)/);
  if (!match || !match[1]) {
    return 0;
  }
  return match[1].length;
}

/**
 * Helper to create a marker node for testing
 */
function createMarkerNode(depth: number, count: number): TreeNode {
  const plural = count !== 1 ? "s" : "";
  return {
    depth,
    componentName: `... (${count} empty level${plural})`,
    displayName: `... (${count} empty level${plural})`,
    renderType: "Marker",
    flags: 0,
    stateChanges: [],
    propChanges: [],
    componentLogs: [],
    isTracked: false,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
  };
}

/**
 * Helper to create a rendering node for testing
 */
function createRenderingNode(
  depth: number,
  componentName: string,
  hasStateChange = true
): TreeNode {
  return {
    depth,
    componentName,
    displayName: componentName,
    renderType: "Rendering",
    flags: 0,
    stateChanges: hasStateChange
      ? [
          {
            name: "todos",
            value: [{ id: 1, text: "Test" }],
            prevValue: [],
            hook: {
              memoizedState: [{ id: 1, text: "Test" }],
              queue: null,
              next: null,
            },
          },
        ]
      : [],
    propChanges: [],
    componentLogs: [],
    isTracked: false,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
  };
}

/**
 * Helper to create a reconciled node for testing
 */
function createReconciledNode(depth: number, componentName: string): TreeNode {
  return {
    depth,
    componentName,
    displayName: componentName,
    renderType: "Reconciled",
    flags: 0,
    stateChanges: [],
    propChanges: [],
    componentLogs: [],
    isTracked: false,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
  };
}

describe("Marker Rendering Integration Tests", () => {
  beforeEach(() => {
    // Reset trace options to default
    traceOptions.enableAutoTracerInternalsLogging = false;
  });

  describe("Scenario 1: Single marker with content node", () => {
    it("should render marker and component with no intermediate connectors", () => {
      const nodes: readonly TreeNode[] = [
        createMarkerNode(1, 21),
        createRenderingNode(22, "TodoList"),
      ];

      const logs = captureConsoleLogs(() => {
        renderTree(nodes);
      });

      // Filter out empty lines
      const output = logs.filter((line) => line.trim().length > 0);

      // Should have exactly marker + component line + state change line (no intermediate connectors)
      // Marker line, component line, and state change details
      expect(output.length).toBeGreaterThanOrEqual(2);
      expect(output.length).toBeLessThan(23); // Should NOT have 21 intermediate connectors

      const fullOutput = output.join("\n");

      // Should contain marker
      expect(fullOutput).toContain("21 empty level");

      // Should contain component
      expect(fullOutput).toContain("[TodoList]");
      expect(fullOutput).toContain("Rendering");

      // Verify visual indentation
      const markerLine = output.find((line) => line.includes("21 empty level"));
      const componentLine = output.find((line) => line.includes("[TodoList]"));

      expect(markerLine).toBeDefined();
      expect(componentLine).toBeDefined();

      // Marker should have no leading spaces (visual depth 0)
      expect(getIndentLength(markerLine!)).toBe(0);

      // Component should have 2 spaces indent (visual depth 1)
      expect(getIndentLength(componentLine!)).toBe(2);

      // Should NOT have 21 connector lines between marker and component
      const connectorLines = output.filter(
        (line) => line.includes("└─┐") && !line.includes("empty level")
      );
      expect(connectorLines.length).toBe(0);
    });
  });

  describe("Scenario 2: Marker with debug labels enabled", () => {
    it("should show original depths in labels while using visual depths for indentation", () => {
      traceOptions.enableAutoTracerInternalsLogging = true;

      const nodes: readonly TreeNode[] = [
        createMarkerNode(1, 21),
        createRenderingNode(22, "TodoList"),
      ];

      const logs = captureConsoleLogs(() => {
        renderTree(nodes);
      });

      const output = logs.filter((line) => line.trim().length > 0);
      const fullOutput = output.join("\n");

      // Should show original depth in marker label
      expect(fullOutput).toContain("Level: 1");

      // Should show original depth in component label
      expect(fullOutput).toContain("Level: 22");

      // Verify visual indentation still correct
      const componentLine = output.find((line) => line.includes("[TodoList]"));
      expect(componentLine).toBeDefined();

      // Component should have 2 spaces indent (visual depth 1), not 44 spaces (original depth 22)
      const indent = getIndentLength(componentLine!);
      expect(indent).toBe(2); // Visual depth 1
      expect(indent).not.toBe(44); // NOT original depth 22 * 2
    });
  });

  describe("Scenario 3: Multiple markers in sequence", () => {
    it("should handle multiple markers with correct visual depths", () => {
      // Tree structure:
      // Marker (depths 1-5) - represents empty parent levels
      //   TodoList (depth 6) - child of collapsed levels
      //   Marker (depths 7-9) - SIBLING to TodoList (represents collapsed space)
      //     TodoItem (depth 10) - child of second marker
      const nodes: readonly TreeNode[] = [
        createMarkerNode(1, 5),
        createRenderingNode(6, "TodoList"),
        createMarkerNode(7, 3),
        createRenderingNode(10, "TodoItem"),
      ];

      const logs = captureConsoleLogs(() => {
        renderTree(nodes);
      });

      const output = logs.filter((line) => line.trim().length > 0);
      const fullOutput = output.join("\n");

      // Should contain both markers
      expect(fullOutput).toContain("5 empty level");
      expect(fullOutput).toContain("3 empty level");

      // Should contain both components
      expect(fullOutput).toContain("[TodoList]");
      expect(fullOutput).toContain("[TodoItem]");

      // Find the lines
      const firstMarkerLine = output.find((line) =>
        line.includes("5 empty level")
      );
      const todoListLine = output.find((line) => line.includes("[TodoList]"));
      const secondMarkerLine = output.find((line) =>
        line.includes("3 empty level")
      );
      const todoItemLine = output.find((line) => line.includes("[TodoItem]"));

      expect(firstMarkerLine).toBeDefined();
      expect(todoListLine).toBeDefined();
      expect(secondMarkerLine).toBeDefined();
      expect(todoItemLine).toBeDefined();

      // First marker: visual depth 0 (0 spaces)
      expect(getIndentLength(firstMarkerLine!)).toBe(0);

      // TodoList: visual depth 1 (2 spaces) - child of first marker
      expect(getIndentLength(todoListLine!)).toBe(2);

      // Second marker: visual depth 1 (2 spaces) - SIBLING to TodoList
      // (markers after components are siblings, representing collapsed space)
      expect(getIndentLength(secondMarkerLine!)).toBe(2);

      // TodoItem: visual depth 2 (4 spaces) - child of second marker
      expect(getIndentLength(todoItemLine!)).toBe(4);

      // Should NOT have extra connectors
      const connectorLines = output.filter(
        (line) =>
          line.includes("└─┐") &&
          !line.includes("empty level") &&
          line.trim() === "└─┐"
      );
      expect(connectorLines.length).toBe(0);
    });
  });

  describe("Scenario 3b: Marker going UP the tree (lower original level)", () => {
    it("should decrease visual depth when marker level < previous component level", () => {
      // Tree structure matching the real app output:
      // Marker (level 1-5) - root marker
      //   TodoList (level 6) - child of marker
      //     Child1 (level 7) - child of TodoList
      //   Marker (level 6) - BACK UP to same level as TodoList (sibling)
      //     Child2 (level 7) - child of second marker
      const nodes: readonly TreeNode[] = [
        createMarkerNode(1, 5),
        createRenderingNode(6, "TodoList"),
        createRenderingNode(7, "Child1"),
        createMarkerNode(6, 1), // Marker at level 6 after component at level 7 (going UP)
        createRenderingNode(7, "Child2"),
      ];

      const logs = captureConsoleLogs(() => {
        renderTree(nodes);
      });

      const output = logs.filter((line) => line.trim().length > 0);

      // Find the lines
      const firstMarkerLine = output.find((line) =>
        line.includes("5 empty level")
      );
      const todoListLine = output.find((line) => line.includes("[TodoList]"));
      const child1Line = output.find((line) => line.includes("[Child1]"));
      const secondMarkerLine = output.find((line) =>
        line.includes("1 empty level")
      );
      const child2Line = output.find((line) => line.includes("[Child2]"));

      expect(firstMarkerLine).toBeDefined();
      expect(todoListLine).toBeDefined();
      expect(child1Line).toBeDefined();
      expect(secondMarkerLine).toBeDefined();
      expect(child2Line).toBeDefined();

      // First marker: visual depth 0
      expect(getIndentLength(firstMarkerLine!)).toBe(0);

      // TodoList: visual depth 1 (child of first marker)
      expect(getIndentLength(todoListLine!)).toBe(2);

      // Child1: visual depth 2 (child of TodoList, original level 7 > 6)
      expect(getIndentLength(child1Line!)).toBe(4);

      // Second marker at level 6 after Child1 at level 7:
      // Going UP by 1 level, so visual depth: 2 - 1 = 1
      expect(getIndentLength(secondMarkerLine!)).toBe(2);

      // Child2: visual depth 2 (child of second marker)
      expect(getIndentLength(child2Line!)).toBe(4);
    });
  });

  describe("Scenario 4: No filtering (no markers present)", () => {
    it("should render with visual depth equal to original depth", () => {
      const nodes: readonly TreeNode[] = [
        createReconciledNode(0, "Provider"),
        createReconciledNode(1, "Theme"),
        createRenderingNode(2, "TodoList"),
      ];

      const logs = captureConsoleLogs(() => {
        renderTree(nodes);
      });

      const output = logs.filter((line) => line.trim().length > 0);

      // Find component lines
      const providerLine = output.find((line) => line.includes("[Provider]"));
      const themeLine = output.find((line) => line.includes("[Theme]"));
      const todoListLine = output.find((line) => line.includes("[TodoList]"));

      expect(providerLine).toBeDefined();
      expect(themeLine).toBeDefined();
      expect(todoListLine).toBeDefined();

      // Visual depth should equal original depth
      // Provider: depth 0 = 0 spaces
      expect(getIndentLength(providerLine!)).toBe(0);

      // Theme: depth 1 = 2 spaces
      expect(getIndentLength(themeLine!)).toBe(2);

      // TodoList: depth 2 = 4 spaces
      expect(getIndentLength(todoListLine!)).toBe(4);
    });
  });

  describe("Edge case: Marker followed immediately by another marker", () => {
    it("should handle consecutive markers at same visual depth", () => {
      const nodes: readonly TreeNode[] = [
        createMarkerNode(1, 5),
        createMarkerNode(6, 3),
        createRenderingNode(9, "TodoList"),
      ];

      const logs = captureConsoleLogs(() => {
        renderTree(nodes);
      });

      const output = logs.filter((line) => line.trim().length > 0);

      const firstMarkerLine = output.find((line) =>
        line.includes("5 empty level")
      );
      const secondMarkerLine = output.find((line) =>
        line.includes("3 empty level")
      );
      const todoListLine = output.find((line) => line.includes("[TodoList]"));

      expect(firstMarkerLine).toBeDefined();
      expect(secondMarkerLine).toBeDefined();
      expect(todoListLine).toBeDefined();

      // First marker: visual depth 0
      expect(getIndentLength(firstMarkerLine!)).toBe(0);

      // Second marker: visual depth 0 (sibling to first marker)
      // Markers after markers are siblings (both represent collapsed space)
      expect(getIndentLength(secondMarkerLine!)).toBe(0);

      // TodoList: visual depth 1 (child of second marker)
      expect(getIndentLength(todoListLine!)).toBe(2);
    });
  });
});
