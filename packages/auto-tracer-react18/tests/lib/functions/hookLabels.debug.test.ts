/**
 * Debug test to understand ordinal disambiguation failure
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  addLabelForGuid,
  clearLabelsForGuid,
  resolveHookLabel,
  getLabelsForGuid,
} from "../../../src/lib/functions/hookLabels.js";
import { normalizeValue } from "../../../src/lib/functions/normalizeValue.js";
import { stringify } from "../../../src/lib/functions/stringify.js";

describe("hookLabels - ordinal debug", () => {
  beforeEach(() => {
    // Clear any existing labels
    clearLabelsForGuid("debug-guid");
  });

  it("should debug two hooks with identical structure", () => {
    const guid = "debug-guid";

    // Register two hooks with identical normalized structure
    const emailForm = {
      value: "user@example.com",
      setValue: () => {},
      error: null,
    };

    const passwordForm = {
      value: "password123",
      setValue: () => {},
      error: null,
    };

    addLabelForGuid(guid, {
      index: 0,
      label: "emailForm",
      value: emailForm,
    });

    addLabelForGuid(guid, {
      index: 1,
      label: "passwordForm",
      value: passwordForm,
    });

    console.log("\n=== STORED LABELS ===");
    const storedLabels = getLabelsForGuid(guid);
    storedLabels.forEach((label: any, i: number) => {
      console.log(`Label ${i}:`, {
        label: label.label,
        index: label.index,
        valueType: typeof label.value,
        value: label.value,
        normalized: normalizeValue(label.value),
        comparable: stringify(normalizeValue(label.value)),
      });
    });

    // Second render: both values change
    const emailForm2 = {
      value: "new@example.com",
      setValue: () => {},
      error: null,
    };

    const passwordForm2 = {
      value: "newpassword",
      setValue: () => {},
      error: null,
    };

    const allFiberAnchors = [
      { index: 0, value: emailForm2 },
      { index: 1, value: passwordForm2 },
    ];

    console.log("\n=== CURRENT ANCHORS ===");
    allFiberAnchors.forEach((anchor, i) => {
      console.log(`Anchor ${i}:`, {
        index: anchor.index,
        valueType: typeof anchor.value,
        value: anchor.value,
        normalized: normalizeValue(anchor.value),
        comparable: stringify(normalizeValue(anchor.value)),
      });
    });

    console.log("\n=== RESOLUTION ===");

    // Resolve first hook
    console.log("\nResolving anchor index 0:");
    const resolved1 = resolveHookLabel(guid, 0, emailForm2, allFiberAnchors);
    console.log("Resolved to:", resolved1);

    // Resolve second hook
    console.log("\nResolving anchor index 1:");
    const resolved2 = resolveHookLabel(guid, 1, passwordForm2, allFiberAnchors);
    console.log("Resolved to:", resolved2);

    console.log("\n=== RESULTS ===");
    console.log("resolved1:", resolved1, "expected: emailForm");
    console.log("resolved2:", resolved2, "expected: passwordForm");

    expect(resolved1).toBe("emailForm");
    expect(resolved2).toBe("passwordForm");
  });

  it("should debug structure change detection (Bug 1)", () => {
    const guid = "debug-guid-bug1";

    // Register hook with 2 properties
    const state1 = {
      value: "test",
      setValue: () => {},
    };

    addLabelForGuid(guid, {
      index: 0,
      label: "simpleState",
      value: state1,
    });

    console.log("\n=== BUG 1: STRUCTURE CHANGE ===");
    console.log("Stored label:");
    const storedLabels = getLabelsForGuid(guid);
    storedLabels.forEach((label: any) => {
      console.log({
        label: label.label,
        index: label.index,
        value: label.value,
        valueKeys: typeof label.value === 'object' && label.value ? Object.keys(label.value) : null,
        comparable: stringify(normalizeValue(label.value)),
      });
    });

    // Second render: object with 3 properties (structure changed!)
    const state2 = {
      value: "test",
      setValue: () => {},
      reset: () => {}, // NEW PROPERTY
    };

    console.log("\nCurrent anchor:");
    console.log({
      value: state2,
      valueKeys: Object.keys(state2),
      normalized: normalizeValue(state2),
      normalizedKeys: Object.keys(normalizeValue(state2) as any),
      comparable: stringify(normalizeValue(state2)),
    });

    const allFiberAnchors = [{ index: 0, value: state2 }];
    const resolved = resolveHookLabel(guid, 0, state2, allFiberAnchors);

    console.log("\nResolved to:", resolved);
    console.log("Expected: unknown");
    console.log("Actual:", resolved);

    // Should NOT match - structure is different
    expect(resolved).toBe("unknown");
  });

  it("should debug key order change detection (Bug 2)", () => {
    const guid = "debug-guid-bug2";

    // Register hook with keys in order [value, setValue]
    const state1 = {
      value: "test",
      setValue: () => {},
    };

    addLabelForGuid(guid, {
      index: 0,
      label: "orderedState",
      value: state1,
    });

    console.log("\n=== BUG 2: KEY ORDER CHANGE ===");
    console.log("Stored label:");
    const storedLabels = getLabelsForGuid(guid);
    storedLabels.forEach((label: any) => {
      console.log({
        label: label.label,
        index: label.index,
        value: label.value,
        valueKeys: typeof label.value === 'object' && label.value ? Object.keys(label.value) : null,
        comparable: stringify(normalizeValue(label.value)),
      });
    });

    // Second render: same keys but different order [setValue, value]
    const state2 = {
      setValue: () => {},
      value: "test",
    };

    console.log("\nCurrent anchor:");
    console.log({
      value: state2,
      valueKeys: Object.keys(state2),
      normalized: normalizeValue(state2),
      normalizedKeys: Object.keys(normalizeValue(state2) as any),
      comparable: stringify(normalizeValue(state2)),
    });

    const allFiberAnchors = [{ index: 0, value: state2 }];
    const resolved = resolveHookLabel(guid, 0, state2, allFiberAnchors);

    console.log("\nResolved to:", resolved);
    console.log("Expected: unknown");
    console.log("Actual:", resolved);

    // Should NOT match - key order is different
    expect(resolved).toBe("unknown");
  });
});
