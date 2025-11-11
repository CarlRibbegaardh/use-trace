import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { addLabelForGuid, clearAllHookLabels, resolveHookLabel } from "../../src/lib/functions/hookLabels.js";

/**
 * Unit test for wrapper object vs primitive value matching.
 *
 * Bug: labelState() registers { value: "...", setValue: fn }, but fiber has primitive "..."
 * Fix: When label is object and fiber value is primitive, check if primitive matches any property value
 */

describe("hookLabels - wrapper object vs primitive value matching", () => {
  beforeEach(() => {
    clearAllHookLabels();
  });

  afterEach(() => {
    clearAllHookLabels();
  });

  it("should match primitive fiber value with object label containing that value", () => {
    const guid = "test-wrapper-primitive-guid";

    // Wrapper objects (what labelState receives)
    const customWrapper = { value: "pattern-custom", setValue: () => {} };
    const nestedWrapper = { value: "nested-custom", setValue: () => {} };

    // Register labels with wrapper objects
    addLabelForGuid(guid, { label: "description", index: 0, value: "pattern-test" });
    addLabelForGuid(guid, { label: "counter", index: 1, value: 10 });
    addLabelForGuid(guid, { label: "customHookResult", index: 2, value: customWrapper });
    addLabelForGuid(guid, { label: "nestedHookResult", index: 3, value: nestedWrapper });

    // Fiber anchors (what's actually in the fiber - primitives from internal useState)
    const allFiberAnchors = [
      { index: 0, value: "pattern-test" },      // description
      { index: 1, value: 10 },                  // counter
      { index: 2, value: "pattern-custom" },    // customHook's internal useState value (STRING)
      { index: 3, value: "nested-custom" },     // nestedHook's internal useState value (STRING)
    ];

    // Resolve each hook
    const resolvedDesc = resolveHookLabel(guid, 0, "pattern-test", allFiberAnchors);
    const resolvedCounter = resolveHookLabel(guid, 1, 10, allFiberAnchors);
    const resolvedCustom = resolveHookLabel(guid, 2, "pattern-custom", allFiberAnchors);
    const resolvedNested = resolveHookLabel(guid, 3, "nested-custom", allFiberAnchors);

    console.log("resolvedDesc:", resolvedDesc);
    console.log("resolvedCounter:", resolvedCounter);
    console.log("resolvedCustom:", resolvedCustom);
    console.log("resolvedNested:", resolvedNested);

    // All should resolve correctly
    expect(resolvedDesc).toBe("description");
    expect(resolvedCounter).toBe("counter");

    // FIX: These should now match via primitive-property-value matching
    expect(resolvedCustom).toBe("customHookResult");
    expect(resolvedNested).toBe("nestedHookResult");
  });

  it("should distinguish two custom hooks with same structure but different primitive values", () => {
    const guid = "test-two-wrappers-guid";

    const wrapper1 = { value: "first", setValue: () => {} };
    const wrapper2 = { value: "second", setValue: () => {} };

    addLabelForGuid(guid, { label: "hook1", index: 0, value: wrapper1 });
    addLabelForGuid(guid, { label: "hook2", index: 1, value: wrapper2 });

    const allFiberAnchors = [
      { index: 0, value: "first" },   // Primitive from hook1's internal useState
      { index: 1, value: "second" },  // Primitive from hook2's internal useState
    ];

    const resolved1 = resolveHookLabel(guid, 0, "first", allFiberAnchors);
    const resolved2 = resolveHookLabel(guid, 1, "second", allFiberAnchors);

    expect(resolved1).toBe("hook1");
    expect(resolved2).toBe("hook2");
  });
});
