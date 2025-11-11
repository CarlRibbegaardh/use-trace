import { describe, it, expect } from "vitest";
import { normalizeValue } from "../../src/lib/functions/normalizeValue.js";
import { stringify } from "../../src/lib/functions/stringify.js";

describe("normalizeValue and stringify - custom hook objects", () => {
  it("should produce DIFFERENT strings for objects with same structure but different values", () => {
    const obj1 = { value: "pattern-custom", setValue: () => {} };
    const obj2 = { value: "nested-custom", setValue: () => {} };

    const norm1 = normalizeValue(obj1);
    const norm2 = normalizeValue(obj2);

    const str1 = stringify(norm1);
    const str2 = stringify(norm2);

    console.log("obj1 normalized:", norm1);
    console.log("obj2 normalized:", norm2);
    console.log("obj1 stringified:", str1);
    console.log("obj2 stringified:", str2);

    // These should be DIFFERENT because the "value" property has different strings
    expect(str1).not.toBe(str2);
    expect(str1).toContain("pattern-custom");
    expect(str2).toContain("nested-custom");
  });
});
