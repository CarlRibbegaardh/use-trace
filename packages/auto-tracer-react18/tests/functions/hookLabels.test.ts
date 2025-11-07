import { describe, it, expect, beforeEach } from "vitest";
import {
  addLabelForGuid,
  getLabelsForGuid,
  clearLabelsForGuid,
  clearAllHookLabels,
} from "../../src/lib/functions/hookLabels.js";

/**
 * Tests for the hook labels registry.
 *
 * The implementation now stores labels in a Record<number, string> indexed
 * by the hook's position in _debugHookTypes. This allows correct mapping
 * even when some hooks don't have queues.
 */
describe("hookLabels", () => {
  const testGuid = "test-component-guid-123";

  beforeEach(() => {
    clearAllHookLabels();
  });

  describe("index-based storage (Babel plugin mode)", () => {
    it("stores labels by explicit index", () => {
      addLabelForGuid(testGuid, "dispatch", 0);
      addLabelForGuid(testGuid, "filteredTodos", 9);
      addLabelForGuid(testGuid, "loading", 18);

      const labels = getLabelsForGuid(testGuid);

      expect(labels).toEqual({
        0: "dispatch",
        9: "filteredTodos",
        18: "loading",
      });
      expect(labels[0]).toBe("dispatch");
      expect(labels[9]).toBe("filteredTodos");
      expect(labels[18]).toBe("loading");
    });

    it("allows sparse indices - hooks without queues don't need labels", () => {
      // Hook indices 0, 9, 18 correspond to stateful hooks
      // Indices 1-8, 10-17 are non-stateful hooks (useRef, useMemo, etc.)
      addLabelForGuid(testGuid, "dispatch", 0);
      addLabelForGuid(testGuid, "filteredTodos", 9);
      addLabelForGuid(testGuid, "loading", 18);

      const labels = getLabelsForGuid(testGuid);

      // Only the specified indices should have labels
      expect(Object.keys(labels).length).toBe(3);
      expect(labels[0]).toBe("dispatch");
      expect(labels[5]).toBeUndefined(); // No label for non-stateful hooks
      expect(labels[9]).toBe("filteredTodos");
    });
  });

  // Auto-index mode removed: labels must be provided with explicit indices.

  describe("clearing labels", () => {
    it("clears labels for specific GUID", () => {
      const guid1 = "comp-1";
      const guid2 = "comp-2";

      addLabelForGuid(guid1, "label1", 0);
      addLabelForGuid(guid2, "label2", 0);

      clearLabelsForGuid(guid1);

      expect(getLabelsForGuid(guid1)).toEqual({});
      expect(getLabelsForGuid(guid2)).toEqual({ 0: "label2" });
    });

    it("clears all labels", () => {
      addLabelForGuid("comp-1", "label1", 0);
      addLabelForGuid("comp-2", "label2", 0);

      clearAllHookLabels();

      expect(getLabelsForGuid("comp-1")).toEqual({});
      expect(getLabelsForGuid("comp-2")).toEqual({});
    });

    it("resets auto-index counter when clearing labels", () => {
      addLabelForGuid(testGuid, "first", 0);
      addLabelForGuid(testGuid, "second", 5);
      clearLabelsForGuid(testGuid);
      // After clearing, there should be no labels
      expect(getLabelsForGuid(testGuid)).toEqual({});
    });
  });
});
