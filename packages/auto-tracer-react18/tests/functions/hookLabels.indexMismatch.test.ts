import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { addLabelForGuid, clearAllHookLabels, resolveHookLabel } from "../../src/lib/functions/hookLabels.js";

/**
 * Unit test for the index mismatch bug when custom hooks have internal state.
 *
 * Scenario:
 * - Component has: useState, useReducer, useCustomHook, useCustomHook2 (which calls useCustomHook internally)
 * - labelState indexes: 0, 1, 2, 3 (counting component-level calls)
 * - Fiber hook indexes: 0 (tracking), 1 (description), 2 (counter), 3 (custom's internal useState), 4 (nested's internal useState via useCustomHook)
 * - The label indexes don't match the fiber indexes for custom hooks!
 *
 * Expected behavior:
 * - Label index 2 (customHookResult) should resolve hook at fiber index 3
 * - Label index 3 (nestedHookResult) should resolve hook at fiber index 4
 *
 * Current bug:
 * - resolveHookLabel uses anchorIndex (fiber index) to match against label.index (labelState index)
 * - These don't align when custom hooks have internal state
 */

describe("hookLabels - index mismatch with custom hooks containing internal state", () => {
  beforeEach(() => {
    clearAllHookLabels();
  });

  afterEach(() => {
    clearAllHookLabels();
  });

  it("should fail to resolve when label indexes don't match fiber indexes", () => {
    const guid = "test-index-mismatch-guid";

    // Objects returned by custom hooks (identical structure)
    const customHookValue = { value: "pattern-custom", setValue: () => {} };
    const nestedHookValue = { value: "nested-custom", setValue: () => {} };

    // Labels registered with component-level indexes (0, 1, 2, 3)
    addLabelForGuid(guid, { label: "description", index: 0, value: "pattern-test" });
    addLabelForGuid(guid, { label: "counter", index: 1, value: 10 });
    addLabelForGuid(guid, { label: "customHookResult", index: 2, value: customHookValue });
    addLabelForGuid(guid, { label: "nestedHookResult", index: 3, value: nestedHookValue });

    // Fiber hooks with DIFFERENT indexes due to nested custom hook internals
    // Index 0: tracking ref (not in allFiberAnchors, it's filtered out)
    // Index 1: description useState
    // Index 2: counter useReducer
    // Index 3: customHookResult's internal useState (returns customHookValue)
    // Index 4: nestedHookResult's internal useState (returns nestedHookValue via useCustomHook)
    const allFiberAnchors = [
      { index: 1, value: "pattern-test" },      // Fiber index 1 → label index 0
      { index: 2, value: 10 },                  // Fiber index 2 → label index 1
      { index: 3, value: customHookValue },     // Fiber index 3 → label index 2
      { index: 4, value: nestedHookValue },     // Fiber index 4 → label index 3
    ];

    // Try to resolve with fiber indexes
    const resolvedDesc = resolveHookLabel(guid, 1, "pattern-test", allFiberAnchors);
    const resolvedCounter = resolveHookLabel(guid, 2, 10, allFiberAnchors);
    const resolvedCustom = resolveHookLabel(guid, 3, customHookValue, allFiberAnchors);
    const resolvedNested = resolveHookLabel(guid, 4, nestedHookValue, allFiberAnchors);

    // THIS WILL FAIL because the resolver compares anchorIndex (fiber index) with label.index (labelState index)
    console.log("resolvedDesc:", resolvedDesc);
    console.log("resolvedCounter:", resolvedCounter);
    console.log("resolvedCustom:", resolvedCustom);
    console.log("resolvedNested:", resolvedNested);

    // These assertions will likely fail due to index mismatch
    expect(resolvedDesc).toBe("description"); // May fail: looking for fiber index 1 in labels with index 0
    expect(resolvedCounter).toBe("counter");   // May fail: looking for fiber index 2 in labels with index 1
    expect(resolvedCustom).toBe("customHookResult"); // May fail: looking for fiber index 3 in labels with index 2
    expect(resolvedNested).toBe("nestedHookResult"); // May fail: looking for fiber index 4 in labels with index 3
  });
});
