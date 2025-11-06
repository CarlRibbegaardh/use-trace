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
 * The current implementation stores labels in an array by push order.
 * This test documents the current behavior and will help us verify
 * if we need to change to index-based storage.
 */
describe("hookLabels", () => {
  const testGuid = "test-component-guid-123";

  beforeEach(() => {
    clearAllHookLabels();
  });

  describe("current behavior (array-based)", () => {
    it("stores labels in push order", () => {
      addLabelForGuid(testGuid, "dispatch");
      addLabelForGuid(testGuid, "filteredTodos");
      addLabelForGuid(testGuid, "loading");

      const labels = getLabelsForGuid(testGuid);

      expect(labels).toEqual(["dispatch", "filteredTodos", "loading"]);
      expect(labels[0]).toBe("dispatch");
      expect(labels[1]).toBe("filteredTodos");
      expect(labels[2]).toBe("loading");
    });

    it("does not store indices - labels are accessed by array position", () => {
      // This documents the current limitation:
      // Labels are stored in order they're added, not by their hook index
      addLabelForGuid(testGuid, "dispatch");    // Hook index 0 in source
      addLabelForGuid(testGuid, "filteredTodos"); // Hook index 1 in source
      addLabelForGuid(testGuid, "loading");     // Hook index 2 in source

      const labels = getLabelsForGuid(testGuid);

      // We can only access by array index, not by hook index
      // If hook 0 (dispatch) has no queue and isn't extracted,
      // then label[0] gets incorrectly matched to the first extracted hook
      expect(labels[0]).toBe("dispatch"); // Would be matched to first extracted hook
      expect(labels[1]).toBe("filteredTodos"); // Would be matched to second extracted hook
    });
  });

  describe("clearing labels", () => {
    it("clears labels for specific GUID", () => {
      const guid1 = "comp-1";
      const guid2 = "comp-2";

      addLabelForGuid(guid1, "label1");
      addLabelForGuid(guid2, "label2");

      clearLabelsForGuid(guid1);

      expect(getLabelsForGuid(guid1)).toEqual([]);
      expect(getLabelsForGuid(guid2)).toEqual(["label2"]);
    });

    it("clears all labels", () => {
      addLabelForGuid("comp-1", "label1");
      addLabelForGuid("comp-2", "label2");

      clearAllHookLabels();

      expect(getLabelsForGuid("comp-1")).toEqual([]);
      expect(getLabelsForGuid("comp-2")).toEqual([]);
    });
  });

  describe("expected behavior for index-based storage (future)", () => {
    it.skip("should store labels by absolute hook index", () => {
      // Future behavior: We want to store labels indexed by their
      // absolute position in the hook chain, not by push order

      // When build-time transform creates:
      // logger.labelState("dispatch", 0)
      // logger.labelState("filteredTodos", 1)
      // logger.labelState("loading", 2)

      // We should be able to retrieve by index:
      // getLabel(testGuid, 0) → "dispatch"
      // getLabel(testGuid, 1) → "filteredTodos"
      // getLabel(testGuid, 2) → "loading"

      // This would allow runtime to match labels even when some hooks
      // don't have queues and aren't extracted
    });
  });
});
