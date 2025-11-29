import { describe, expect, it } from "vitest";
import { areHookInputsEqual } from "../../../src/lib/functions/areHookInputsEqual.js";

describe("areHookInputsEqual", () => {
  it("should return equal: true for identical primitive arrays", () => {
    const deps1 = [1, 2, 3];
    const deps2 = [1, 2, 3];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should return equal: false for different primitive arrays", () => {
    const deps1 = [1, 2, 3];
    const deps2 = [1, 2, 4];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false);
    expect(result.diffIndex).toEqual([2]);
  });

  it("should return equal: false for arrays of different lengths", () => {
    const deps1 = [1, 2, 3];
    const deps2 = [1, 2];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false);
    expect(result.diffIndex).toEqual([-1]);
  });

  it("should handle empty arrays", () => {
    const deps1: unknown[] = [];
    const deps2: unknown[] = [];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should handle ref objects with same current values", () => {
    const ref1 = { current: "test" };
    const ref2 = { current: "test" };
    const deps1 = [ref1];
    const deps2 = [ref2];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should handle ref objects with different current values", () => {
    const ref1 = { current: "test1" };
    const ref2 = { current: "test2" };
    const deps1 = [ref1];
    const deps2 = [ref2];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false);
    expect(result.diffIndex).toEqual([0]);
  });

  it("should handle ref objects with null current values", () => {
    const ref1 = { current: null };
    const ref2 = { current: null };
    const deps1 = [ref1];
    const deps2 = [ref2];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should handle mixed ref objects and primitives", () => {
    const ref1 = { current: "test" };
    const ref2 = { current: "test" };
    const deps1 = [1, ref1, "string"];
    const deps2 = [1, ref2, "string"];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should handle undefined values", () => {
    const deps1 = [1, undefined, 3];
    const deps2 = [1, undefined, 3];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should detect differences with undefined values", () => {
    const deps1 = [1, undefined, 3];
    const deps2 = [1, 2, 3];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false);
    expect(result.diffIndex).toEqual([1]);
  });

  it("should detect multiple differences", () => {
    const deps1 = [1, 2, 3, 4];
    const deps2 = [1, 5, 3, 6];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false);
    expect(result.diffIndex).toEqual([1, 3]);
  });

  it("should handle object references", () => {
    const obj1 = { test: "value" };
    const obj2 = { test: "value" };
    const deps1 = [obj1];
    const deps2 = [obj2];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false);
    expect(result.diffIndex).toEqual([0]);
  });

  it("should handle same object references", () => {
    const obj = { test: "value" };
    const deps1 = [obj];
    const deps2 = [obj];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should handle NaN values", () => {
    const deps1 = [NaN];
    const deps2 = [NaN];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(true);
    expect(result.diffIndex).toEqual([]);
  });

  it("should handle +0 and -0", () => {
    const deps1 = [+0];
    const deps2 = [-0];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false); // Object.is treats +0 and -0 as different
    expect(result.diffIndex).toEqual([0]);
  });  it("should handle objects that are not ref objects", () => {
    const obj1 = { current: "test", other: "prop" };
    const obj2 = { current: "test", other: "prop" };
    const deps1 = [obj1];
    const deps2 = [obj2];
    const result = areHookInputsEqual(deps1, deps2);

    expect(result.equal).toBe(false);
    expect(result.diffIndex).toEqual([0]);
  });
});
