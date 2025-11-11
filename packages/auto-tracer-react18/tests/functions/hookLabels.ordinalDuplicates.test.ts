import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { addLabelForGuid, clearAllHookLabels, resolveHookLabel, getLabelsForGuid } from "../../src/lib/functions/hookLabels.js";

/**
 * Unit test for ordinal resolution edge case:
 * Two hooks with identical object structure should be distinguished by index.
 */

describe("hookLabels - ordinal resolution for identical object structures", () => {
  beforeEach(() => {
    clearAllHookLabels();
  });

  afterEach(() => {
    clearAllHookLabels();
  });

  it("should resolve two hooks with identical structure using ordinal position", () => {
    const guid = "test-ordinal-duplicate-guid";

    // Simulate two custom hooks with identical structure
    const customHookValue = { value: "pattern-custom", setValue: () => {} };
    const nestedHookValue = { value: "nested-custom", setValue: () => {} };

    // Register labels in source order
    addLabelForGuid(guid, { label: "description", index: 0, value: "pattern-test" });
    addLabelForGuid(guid, { label: "counter", index: 1, value: 10 });
    addLabelForGuid(guid, { label: "customHookResult", index: 2, value: customHookValue });
    addLabelForGuid(guid, { label: "nestedHookResult", index: 3, value: nestedHookValue });

    // Verify labels are registered correctly
    const labels = getLabelsForGuid(guid);
    expect(labels.length).toBe(4);
    expect(labels[0]!.label).toBe("description");
    expect(labels[1]!.label).toBe("counter");
    expect(labels[2]!.label).toBe("customHookResult");
    expect(labels[3]!.label).toBe("nestedHookResult");

    // Simulate fiber hooks (all 4 hooks present)
    const allFiberAnchors = [
      { index: 0, value: "pattern-test" },
      { index: 1, value: 10 },
      { index: 2, value: customHookValue },
      { index: 3, value: nestedHookValue },
    ];

    // Resolve each hook
    const resolvedDesc = resolveHookLabel(guid, 0, "pattern-test", allFiberAnchors);
    expect(resolvedDesc).toBe("description");

    const resolvedCounter = resolveHookLabel(guid, 1, 10, allFiberAnchors);
    expect(resolvedCounter).toBe("counter");

    // CRITICAL: Both hooks have same structure, should be distinguished by ordinal
    const resolvedCustom = resolveHookLabel(guid, 2, customHookValue, allFiberAnchors);
    expect(resolvedCustom).toBe("customHookResult");

    const resolvedNested = resolveHookLabel(guid, 3, nestedHookValue, allFiberAnchors);
    expect(resolvedNested).toBe("nestedHookResult");
  });

  it("should handle identical object values with different string properties", () => {
    const guid = "test-different-values-same-structure";

    // Two objects with same keys but different values
    const hook1 = { value: "first", setValue: () => {} };
    const hook2 = { value: "second", setValue: () => {} };

    addLabelForGuid(guid, { label: "hook1", index: 0, value: hook1 });
    addLabelForGuid(guid, { label: "hook2", index: 1, value: hook2 });

    const allFiberAnchors = [
      { index: 0, value: hook1 },
      { index: 1, value: hook2 },
    ];

    // These should be unique values (different "value" property strings)
    // So they should match directly without needing ordinal resolution
    const resolved1 = resolveHookLabel(guid, 0, hook1, allFiberAnchors);
    const resolved2 = resolveHookLabel(guid, 1, hook2, allFiberAnchors);

    expect(resolved1).toBe("hook1");
    expect(resolved2).toBe("hook2");
  });
});
