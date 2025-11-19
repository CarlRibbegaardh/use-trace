import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderNodeDetails } from "@src/lib/functions/treeProcessing/rendering/renderNodeDetails.js";
import { traceOptions } from "@src/lib/types/globalState.js";
import * as log from "@src/lib/functions/log.js";
import type { TreeNode } from "@src/lib/functions/treeProcessing/types/TreeNode.js";

vi.mock("@src/lib/functions/log.js");

describe("renderNodeDetails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    traceOptions.objectRenderingMode = undefined; // Default to copy-paste
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

  describe("Text Mode (copy-paste)", () => {
    beforeEach(() => {
      traceOptions.objectRenderingMode = "copy-paste";
    });

    it("logs state changes as formatted text", () => {
      const node: TreeNode = {
        ...mockNode,
        stateChanges: [
          {
            name: "count",
            value: 1,
            prevValue: 0,
            hook: {} as any,
            isIdenticalValueChange: false,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      expect(log.logStateChange).toHaveBeenCalledWith(
        "  ",
        "State change count: 0 → 1",
        false
      );
      expect(log.log).not.toHaveBeenCalled(); // Should not log objects separately
    });

    it("logs prop changes as formatted text", () => {
      const node: TreeNode = {
        ...mockNode,
        propChanges: [
          {
            name: "title",
            value: "B",
            prevValue: "A",
            isIdenticalValueChange: false,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      expect(log.logPropChange).toHaveBeenCalledWith(
        "  ",
        "Prop change title: A → B",
        false
      );
    });

    it("logs component logs with stringified args", () => {
      const node: TreeNode = {
        ...mockNode,
        componentLogs: [
          {
            message: "Hello",
            level: "log",
            args: [{ foo: "bar" }],
            timestamp: 0,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      expect(log.logLogStatement).toHaveBeenCalledWith(
        "  ",
        'Hello [{"foo":"bar"}]'
      );
    });
  });

  describe("Object Mode (devtools-json)", () => {
    beforeEach(() => {
      traceOptions.objectRenderingMode = "devtools-json";
    });

    it("logs initial state with value on same line", () => {
      const node: TreeNode = {
        ...mockNode,
        renderType: "Mount",
        stateChanges: [
          {
            name: "count",
            value: 42,
            prevValue: undefined,
            hook: {} as any,
            isIdenticalValueChange: false,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      // Initial state: message with colon-space, value on same line
      expect(log.logStateChange).toHaveBeenCalledWith(
        "  ",
        "Initial state count: ",
        true,
        42
      );
      expect(log.log).not.toHaveBeenCalled();
    });

    it("logs initial prop with value on same line", () => {
      const node: TreeNode = {
        ...mockNode,
        renderType: "Mount",
        propChanges: [
          {
            name: "title",
            value: { a: 1, b: 2 },
            prevValue: undefined,
            isIdenticalValueChange: false,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      // Initial prop: message with colon-space, value on same line
      expect(log.logPropChange).toHaveBeenCalledWith(
        "  ",
        "Initial prop title: ",
        true,
        { a: 1, b: 2 }
      );
      expect(log.log).not.toHaveBeenCalled();
    });

    it("logs simple state changes inline", () => {
      const node: TreeNode = {
        ...mockNode,
        stateChanges: [
          {
            name: "count",
            value: 1,
            prevValue: 0,
            hook: {} as any,
            isIdenticalValueChange: false,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      // Simple values (numbers) render inline with value as 4th arg
      expect(log.logStateChange).toHaveBeenCalledWith(
        "  ",
        "Changed state count:",
        false,
        "0 → 1"
      );
      // No separate Before/After logs for simple values
      expect(log.log).not.toHaveBeenCalled();
    });

    it("logs simple prop changes inline", () => {
      const node: TreeNode = {
        ...mockNode,
        propChanges: [
          {
            name: "title",
            value: "B",
            prevValue: "A",
            isIdenticalValueChange: false,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      // Simple values (strings) render inline with value as 4th arg
      expect(log.logPropChange).toHaveBeenCalledWith(
        "  ",
        "Changed prop title:",
        false,
        "A → B"
      );
      // No separate Before/After logs for simple values
      expect(log.log).not.toHaveBeenCalled();
    });

    it("logs complex object changes with Before/After", () => {
      const node: TreeNode = {
        ...mockNode,
        propChanges: [
          {
            name: "config",
            value: { a: 1, b: 2 },
            prevValue: { a: 0 },
            isIdenticalValueChange: false,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      // Complex values render with Before/After (note the extra indent: prefix + "  ")
      expect(log.logPropChange).toHaveBeenCalledWith(
        "  ",
        "Changed prop config:",
        false
      );
      expect(log.log).toHaveBeenCalledWith("    Before", { a: 0 });
      expect(log.log).toHaveBeenCalledWith("    After ", { a: 1, b: 2 });
    });

    it("logs component logs with interactive objects", () => {
      const argObj = { foo: "bar" };
      const node: TreeNode = {
        ...mockNode,
        componentLogs: [
          {
            message: "Hello",
            level: "log",
            args: [argObj],
            timestamp: 0,
          },
        ],
      };

      renderNodeDetails(node, "  ");

      expect(log.logLogStatement).toHaveBeenCalledWith("  ", "Hello", argObj);
      // Should log the object directly (snapshotValue might clone it, but here it's simple)
      expect(log.log).not.toHaveBeenCalled();
    });
  });
});
