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

    it("logs state changes as objects", () => {
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
        "State change count:",
        false
      );
      expect(log.log).toHaveBeenCalledWith("     Before:", 0);
      expect(log.log).toHaveBeenCalledWith("     After: ", 1);
    });

    it("logs prop changes as objects", () => {
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
        "Prop change title:",
        false
      );
      expect(log.log).toHaveBeenCalledWith("     Before:", "A");
      expect(log.log).toHaveBeenCalledWith("     After: ", "B");
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
