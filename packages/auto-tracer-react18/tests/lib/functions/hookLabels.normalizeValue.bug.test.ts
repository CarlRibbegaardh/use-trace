import { describe, it, expect, beforeEach } from "vitest";
import {
  addLabelForGuid,
  clearAllHookLabels,
  getLabelsForGuid,
} from "@src/lib/functions/hookLabels.js";
import { stringify } from "@src/lib/functions/stringify.js";

/**
 * BUG REPRODUCTION TEST
 *
 * This test demonstrates the bug where normalize Value converts functions to literal "(fn)" strings,
 * which then prevents stringify from applying function identity tracking when the normalized
 * values are later stringified for comparison or display.
 *
 * Expected behavior: Functions should always be displayed as (fn:1), (fn:2), etc.
 * Actual behavior: When normalized values are stored and later stringified, they show as "(fn)"
 */
describe("hookLabels normalizeValue bug", () => {
  beforeEach(() => {
    clearAllHookLabels();
  });

  it("BUG: normalized function values lose identity tracking", () => {
    const guid = "test-component-guid";

    // Simulate useTrace return value with 3 distinct functions
    const traceFn1 = () => console.log("exit");
    const traceFn2 = () => console.log("log");
    const traceFn3 = () => console.log("state");

    const traceObject = {
      exit: traceFn1,
      log: traceFn2,
      state: traceFn3,
    };

    // Add label (this internally calls normalizeValue and stores the normalized version)
    addLabelForGuid(guid, {
      index: 0,
      label: "trace",
      value: traceObject,
    });

    // Retrieve the stored label
    const labels = getLabelsForGuid(guid);
    expect(labels.length).toBe(1);

    const storedValue = labels[0]!.value;

    // BUG: The stored value has been normalized to literal "(fn)" strings
    // When we stringify this, we get the wrong output
    const stringified = stringify(storedValue);

    console.log("Stored value:", storedValue);
    console.log("Stringified:", stringified);

    // EXPECTED BEHAVIOR: Functions should have unique IDs like (fn:1), (fn:2), (fn:3)
    expect(stringified).toMatch(/\(fn:\d+\)/); // SHOULD pass but currently FAILS
    expect(stringified).not.toContain('"(fn)"'); // SHOULD pass but currently FAILS

    // What we currently see (the bug):
    // expect(stringified).toContain('"(fn)"'); // This would pass (shows the bug)
  });

  it("CONTRAST: fresh function objects get proper identity tracking", () => {
    // When we stringify fresh function objects directly, it works correctly
    const traceFn1 = () => console.log("exit");
    const traceFn2 = () => console.log("log");
    const traceFn3 = () => console.log("state");

    const traceObject = {
      exit: traceFn1,
      log: traceFn2,
      state: traceFn3,
    };

    const stringified = stringify(traceObject);

    console.log("Fresh object stringified:", stringified);

    // This works correctly - functions get unique IDs
    expect(stringified).toMatch(/\(fn:\d+\)/);
    expect(stringified).not.toContain('"(fn)"');
  });

  it("demonstrates the comparison bug: stored vs fresh values", () => {
    const guid = "test-component-guid";

    // First render: store the trace object
    const traceFn1 = () => console.log("exit");
    const traceFn2 = () => console.log("log");
    const traceFn3 = () => console.log("state");

    const traceObject = {
      exit: traceFn1,
      log: traceFn2,
      state: traceFn3,
    };

    addLabelForGuid(guid, {
      index: 0,
      label: "trace",
      value: traceObject,
    });

    // Second render: same functions (stable references via useCallback/useMemo in real code)
    // In real scenario, resolveHookLabel would stringify both the stored label and the fresh fiber value

    const labels = getLabelsForGuid(guid);
    const storedValue = labels[0]!.value;

    // This is what happens in resolveHookLabel - it stringifies BOTH values for comparison
    const storedStringified = stringify(storedValue); // Will be {"exit":"(fn)","log":"(fn)","state":"(fn)"}
    const freshStringified = stringify(traceObject); // Will be {"exit":"(fn:1)","log":"(fn:2)","state":"(fn:3)"}

    console.log("Stored stringified:", storedStringified);
    console.log("Fresh stringified:", freshStringified);

    // EXPECTED: Both should have function IDs and should be equal
    // (assuming same function references, which is true in this test)
    expect(storedStringified).toMatch(/\(fn:\d+\)/); // SHOULD pass but currently FAILS
    expect(freshStringified).toMatch(/\(fn:\d+\)/); // This passes (fresh objects work)

    // The stored value should NOT have literal "(fn)" strings
    expect(storedStringified).not.toContain('"(fn)"'); // SHOULD pass but currently FAILS

    // What we currently see (the bug):
    // storedStringified: {"exit":"(fn)","log":"(fn)","state":"(fn)"}
    // freshStringified: {"exit":"(fn:4)","log":"(fn:5)","state":"(fn:6)"}
  });
});
