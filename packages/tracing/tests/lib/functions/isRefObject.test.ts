import { describe, expect, it } from "vitest";
import { isRefObject } from "../../../src/lib/functions/isRefObject.js";

describe("isRefObject", () => {
  it("should return true for valid ref objects", () => {
    const refObj = { current: null };
    expect(isRefObject(refObj)).toBe(true);
  });

  it("should return true for ref objects with non-null current", () => {
    const refObj = { current: "some value" };
    expect(isRefObject(refObj)).toBe(true);
  });

  it("should return true for ref objects with object current", () => {
    const refObj = { current: { nested: "value" } };
    expect(isRefObject(refObj)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isRefObject(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isRefObject(undefined)).toBe(false);
  });

  it("should return false for primitive values", () => {
    expect(isRefObject("string")).toBe(false);
    expect(isRefObject(123)).toBe(false);
    expect(isRefObject(true)).toBe(false);
  });

  it("should return false for objects with multiple properties", () => {
    const obj = { current: "value", other: "prop" };
    expect(isRefObject(obj)).toBe(false);
  });

  it("should return false for objects without current property", () => {
    const obj = { notCurrent: "value" };
    expect(isRefObject(obj)).toBe(false);
  });

  it("should return false for empty objects", () => {
    const obj = {};
    expect(isRefObject(obj)).toBe(false);
  });

  it("should return false for arrays", () => {
    const arr = ["current"];
    expect(isRefObject(arr)).toBe(false);
  });

  it("should return false for arrays with current property", () => {
    const arr = ["value"] as unknown[];
    (arr as unknown as Record<string, unknown>).current = "test";
    expect(isRefObject(arr)).toBe(false);
  });
});
