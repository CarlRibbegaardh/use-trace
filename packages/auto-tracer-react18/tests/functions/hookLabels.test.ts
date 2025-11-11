import { describe, it, expect, beforeEach } from "vitest";
import {
  addLabelForGuid,
  getLabelsForGuid,
  clearLabelsForGuid,
  clearAllHookLabels,
  resolveHookLabel,
  type LabelEntry,
} from "../../src/lib/functions/hookLabels.js";

/**
 * Tests for the hook labels registry with value-based matching.
 *
 * The implementation now stores labels with their values in an array,
 * enabling value-based matching with ordinal disambiguation.
 */
describe("hookLabels", () => {
  const testGuid = "test-component-guid-123";

  beforeEach(() => {
    clearAllHookLabels();
  });

  describe("value-based storage", () => {
    it("stores labels with index and value", () => {
      addLabelForGuid(testGuid, {
        label: "filteredTodos",
        index: 0,
        value: [],
      });
      addLabelForGuid(testGuid, { label: "loading", index: 1, value: false });

      const labels = getLabelsForGuid(testGuid);

      expect(labels).toHaveLength(2);
      expect(labels[0]).toEqual({
        label: "filteredTodos",
        index: 0,
        value: [],
      });
      expect(labels[1]).toEqual({ label: "loading", index: 1, value: false });
    });

    it("allows multiple labels with same value", () => {
      const emptyArray: unknown[] = [];
      addLabelForGuid(testGuid, {
        label: "filteredTodos",
        index: 0,
        value: emptyArray,
      });
      addLabelForGuid(testGuid, {
        label: "completedTodos",
        index: 1,
        value: emptyArray,
      });

      const labels = getLabelsForGuid(testGuid);

      expect(labels).toHaveLength(2);
      expect(labels[0]!.label).toBe("filteredTodos");
      expect(labels[1]!.label).toBe("completedTodos");
      expect(labels[0]!.value).toBe(labels[1]!.value); // Same reference
    });
  });

  describe("clearing labels", () => {
    it("clears labels for specific GUID", () => {
      const guid1 = "comp-1";
      const guid2 = "comp-2";

      addLabelForGuid(guid1, { label: "label1", index: 0, value: "value1" });
      addLabelForGuid(guid2, { label: "label2", index: 0, value: "value2" });

      clearLabelsForGuid(guid1);

      expect(getLabelsForGuid(guid1)).toEqual([]);
      expect(getLabelsForGuid(guid2)).toHaveLength(1);
    });

    it("clears all labels", () => {
      addLabelForGuid("comp-1", { label: "label1", index: 0, value: "value1" });
      addLabelForGuid("comp-2", { label: "label2", index: 0, value: "value2" });

      clearAllHookLabels();

      expect(getLabelsForGuid("comp-1")).toEqual([]);
      expect(getLabelsForGuid("comp-2")).toEqual([]);
    });

    it("can add labels after clearing", () => {
      addLabelForGuid(testGuid, { label: "first", index: 0, value: "val1" });
      addLabelForGuid(testGuid, { label: "second", index: 5, value: "val2" });
      clearLabelsForGuid(testGuid);

      // After clearing, there should be no labels
      expect(getLabelsForGuid(testGuid)).toEqual([]);

      // Can add new labels
      addLabelForGuid(testGuid, { label: "new", index: 0, value: "newval" });
      expect(getLabelsForGuid(testGuid)).toHaveLength(1);
    });
  });

  describe("resolveHookLabel - Scenario 1: Unique Values", () => {
    it("should match label by unique value", () => {
      const guid = "test-component-1";

      // Register labels
      const emptyArray: unknown[] = [];
      addLabelForGuid(guid, {
        label: "filteredTodos",
        index: 0,
        value: emptyArray,
      });
      addLabelForGuid(guid, { label: "loading", index: 1, value: false });

      // Fiber state (all unique values)
      const allAnchors = [
        { index: 0, value: emptyArray },
        { index: 1, value: false },
        { index: 2, value: 42 }, // unlabeled
      ];

      // Test resolution
      expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe(
        "filteredTodos"
      );
      expect(resolveHookLabel(guid, 1, false, allAnchors)).toBe("loading");
      expect(resolveHookLabel(guid, 2, 42, allAnchors)).toBe("unknown");
    });
  });

  describe("resolveHookLabel - Scenario 2: Duplicate Values, All Labeled", () => {
    it("should match by ordinal position when all occurrences are labeled", () => {
      const guid = "test-component-2";

      // Register labels (all with value [])
      const emptyArray: unknown[] = [];
      addLabelForGuid(guid, {
        label: "filteredTodos",
        index: 0,
        value: emptyArray,
      });
      addLabelForGuid(guid, {
        label: "completedTodos",
        index: 1,
        value: emptyArray,
      });
      addLabelForGuid(guid, {
        label: "archivedTodos",
        index: 2,
        value: emptyArray,
      });

      // Fiber state (all same value)
      const allAnchors = [
        { index: 0, value: emptyArray },
        { index: 1, value: emptyArray },
        { index: 2, value: emptyArray },
      ];

      // Test ordinal matching
      expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe(
        "filteredTodos"
      );
      expect(resolveHookLabel(guid, 1, emptyArray, allAnchors)).toBe(
        "completedTodos"
      );
      expect(resolveHookLabel(guid, 2, emptyArray, allAnchors)).toBe(
        "archivedTodos"
      );
    });
  });

  describe("resolveHookLabel - Scenario 3: Duplicate Values, Partial Labels", () => {
    it("should return union of possible labels based on ordinal constraints", () => {
      const guid = "test-component-3";

      // Register labels (only 2 out of 3 labeled)
      const emptyArray: unknown[] = [];
      addLabelForGuid(guid, {
        label: "filteredTodos",
        index: 0,
        value: emptyArray,
      });
      addLabelForGuid(guid, {
        label: "completedTodos",
        index: 2,
        value: emptyArray,
      });

      // Fiber state (3 hooks with same value, but only 2 labeled)
      const allAnchors = [
        { index: 0, value: emptyArray }, // could be filteredTodos or unknown
        { index: 1, value: emptyArray }, // could be any of the three
        { index: 2, value: emptyArray }, // could be completedTodos or unknown
      ];

      // Test: ordinal constraints narrow possibilities
      expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe(
        "filteredTodos | unknown"
      );
      expect(resolveHookLabel(guid, 1, emptyArray, allAnchors)).toBe(
        "filteredTodos | completedTodos | unknown"
      );
      expect(resolveHookLabel(guid, 2, emptyArray, allAnchors)).toBe(
        "completedTodos | unknown"
      );
    });
  });

  describe("resolveHookLabel - Multiple Unlabeled Hooks", () => {
    it("should return plain 'unknown' for each unlabeled hook (not a union)", () => {
      const guid = "test-component-6";

      // No labels registered for this component
      // Three unlabeled hooks all share the same value
      const emptyArray: unknown[] = [];
      const allAnchors = [
        { index: 0, value: emptyArray },
        { index: 1, value: emptyArray },
        { index: 2, value: emptyArray },
      ];

      // Each should resolve to plain "unknown", not "unknown | unknown | unknown"
      expect(resolveHookLabel(guid, 0, emptyArray, allAnchors)).toBe("unknown");
      expect(resolveHookLabel(guid, 1, emptyArray, allAnchors)).toBe("unknown");
      expect(resolveHookLabel(guid, 2, emptyArray, allAnchors)).toBe("unknown");
    });
  });

  describe("resolveHookLabel - Object-returning hooks with functions", () => {
    it("should resolve unique object via normalized direct compare (functions treated as (fn))", () => {
      const guid = "obj-direct-match";

      // Register a label for a custom hook returning an object with a function
      addLabelForGuid(guid, {
        label: "custom",
        index: 2,
        value: { value: "x", setValue: () => {} },
      });

      // Current anchors: same shape/value but different function identity
      const allAnchors = [
        { index: 0, value: "other" },
        { index: 1, value: 0 },
        { index: 2, value: { value: "x", setValue: function different() {} } },
      ];

      // Unique comparable value, should match after normalization
      expect(resolveHookLabel(guid, 2, allAnchors[2]!.value, allAnchors)).toBe(
        "custom"
      );
    });

    it("should resolve unique object via structural fallback when direct compare fails", () => {
      const guid = "obj-structural-fallback";

      // Stored label uses value: "x"
      addLabelForGuid(guid, {
        label: "custom",
        index: 2,
        value: { value: "x", setValue: () => {} },
      });

      // Current value uses a different inner value "y" so normalized compare won't match
      const allAnchors = [
        { index: 0, value: "other" },
        { index: 1, value: 0 },
        { index: 2, value: { value: "y", setValue: () => {} } },
      ];

      // Unique comparable; direct compare fails; structural match by keys should resolve
      expect(resolveHookLabel(guid, 2, allAnchors[2]!.value, allAnchors)).toBe(
        "custom"
      );
    });

    it("should perform ordinal mapping for duplicate objects using normalized compare", () => {
      const guid = "obj-duplicate-ordinal";

      // Register two labels with identical shapes/values
      addLabelForGuid(guid, {
        label: "firstCustom",
        index: 0,
        value: { value: "same", setValue: () => {} },
      });
      addLabelForGuid(guid, {
        label: "secondCustom",
        index: 1,
        value: { value: "same", setValue: () => {} },
      });

      // Fiber has two anchors with same object shape/value (different fn identities)
      const a0 = { value: "same", setValue: function a() {} };
      const a1 = { value: "same", setValue: function b() {} };
      const allAnchors = [
        { index: 0, value: a0 },
        { index: 1, value: a1 },
      ];

      // Expect ordinal mapping to assign labels by position
      expect(resolveHookLabel(guid, 0, a0, allAnchors)).toBe("firstCustom");
      expect(resolveHookLabel(guid, 1, a1, allAnchors)).toBe("secondCustom");
    });

    it("should resolve object label when current anchor value is primitive via reconstruction", () => {
      const guid = "obj-primitive-current";

      // Labels: description (primitive) and custom (object)
      addLabelForGuid(guid, { label: "description", index: 0, value: "pattern-test" });
      addLabelForGuid(guid, {
        label: "custom",
        index: 2,
        value: { value: "pattern-custom", setValue: () => {} },
      });

      // Fiber anchors: primitive string for custom hook current anchor (represents the value field)
      const allAnchors = [
        { index: 0, value: "pattern-test" },
        { index: 1, value: 10 },
        { index: 2, value: "pattern-custom" },
      ];

      // Even though the current anchor value is primitive, structural reconstruction should map it to 'custom'
      expect(resolveHookLabel(guid, 2, "pattern-custom", allAnchors)).toBe("custom");
    });
  });
});
