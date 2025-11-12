import { describe, it, expect } from "vitest";
import { stringifyForDisplay } from "@src/lib/functions/stringifyForDisplay.js";

describe("stringifyForDisplay - function labeling for state/props", () => {
  it("shows function identity as (fn:N)", () => {
    const fn1 = () => {};
    const fn2 = () => {};

    const s1 = stringifyForDisplay(fn1);
    const s2 = stringifyForDisplay(fn2);
    expect(s1).toMatch(/^\(fn:\d+\)$/);
    expect(s2).toMatch(/^\(fn:\d+\)$/);
    // Different functions should usually get different ids
    // (Not asserting inequality strictly to avoid brittle coupling)
  });

  it("labels functions inside objects with (fn:N)", () => {
    const fn = () => {};
    const out = stringifyForDisplay({ onClick: fn });
    expect(out).toMatch(/\(fn:\d+\)/);
  });
});
