/**
 * @file Tests for normalizeValue function.
 */

import { describe, it, expect } from "vitest";
import { normalizeValue, FUNCTION_PLACEHOLDER } from "../../src/lib/functions/normalizeValue.js";

describe("normalizeValue", () => {
  describe("primitives pass through unchanged", () => {
    it("should return string unchanged", () => {
      expect(normalizeValue("test")).toBe("test");
    });

    it("should return number unchanged", () => {
      expect(normalizeValue(42)).toBe(42);
    });

    it("should return boolean unchanged", () => {
      expect(normalizeValue(true)).toBe(true);
    });

    it("should return null unchanged", () => {
      expect(normalizeValue(null)).toBe(null);
    });

    it("should return undefined unchanged", () => {
      expect(normalizeValue(undefined)).toBe(undefined);
    });
  });

  describe("arrays pass through unchanged", () => {
    it("should return array unchanged", () => {
      const arr = [1, 2, 3];
      expect(normalizeValue(arr)).toBe(arr);
    });

    it("should return empty array unchanged", () => {
      const arr: unknown[] = [];
      expect(normalizeValue(arr)).toBe(arr);
    });
  });

  describe("objects with mixed properties", () => {
    it("should normalize single function property", () => {
      const fn = () => {};
      const input = { value: "test", setValue: fn };
      const result = normalizeValue(input);

      expect(result).toEqual({
        value: "test",
        setValue: FUNCTION_PLACEHOLDER,
      });
    });

    it("should normalize multiple function properties", () => {
      const fn1 = () => {};
      const fn2 = () => {};
      const input = { name: "John", setName: fn1, email: "j@e.com", setEmail: fn2 };
      const result = normalizeValue(input);

      expect(result).toEqual({
        name: "John",
        setName: FUNCTION_PLACEHOLDER,
        email: "j@e.com",
        setEmail: FUNCTION_PLACEHOLDER,
      });
    });

    it("should preserve primitive values exactly", () => {
      const fn = () => {};
      const input = {
        str: "test",
        num: 42,
        bool: true,
        nul: null,
        undef: undefined,
        setter: fn,
      };
      const result = normalizeValue(input);

      expect(result).toEqual({
        str: "test",
        num: 42,
        bool: true,
        nul: null,
        undef: undefined,
        setter: FUNCTION_PLACEHOLDER,
      });
    });
  });

  describe("objects with all functions", () => {
    it("should normalize all function properties", () => {
      const fn1 = () => {};
      const fn2 = () => {};
      const fn3 = () => {};
      const input = { onClick: fn1, onSubmit: fn2, onCancel: fn3 };
      const result = normalizeValue(input);

      expect(result).toEqual({
        onClick: FUNCTION_PLACEHOLDER,
        onSubmit: FUNCTION_PLACEHOLDER,
        onCancel: FUNCTION_PLACEHOLDER,
      });
    });

    it("should normalize single function property object", () => {
      const fn = () => {};
      const input = { callback: fn };
      const result = normalizeValue(input);

      expect(result).toEqual({
        callback: FUNCTION_PLACEHOLDER,
      });
    });
  });

  describe("nested objects (one-level limitation)", () => {
    it("should not normalize nested object properties", () => {
      const fn = () => {};
      const input = {
        settings: { theme: "dark", lang: "en" },
        updateSettings: fn,
      };
      const result = normalizeValue(input);

      expect(result).toEqual({
        settings: { theme: "dark", lang: "en" }, // Nested object unchanged
        updateSettings: FUNCTION_PLACEHOLDER,
      });
    });

    it("should not normalize nested arrays", () => {
      const fn = () => {};
      const input = {
        items: [1, 2, 3],
        setItems: fn,
      };
      const result = normalizeValue(input);

      expect(result).toEqual({
        items: [1, 2, 3], // Nested array unchanged
        setItems: FUNCTION_PLACEHOLDER,
      });
    });
  });

  describe("empty objects", () => {
    it("should return empty object for empty input", () => {
      const input = {};
      const result = normalizeValue(input);

      expect(result).toEqual({});
    });
  });

  describe("property order preservation", () => {
    it("should preserve insertion order of properties", () => {
      const fn = () => {};
      const input = { z: "last", a: "first", setValue: fn, m: "middle" };
      const result = normalizeValue(input) as Record<string, unknown>;

      const keys = Object.keys(result);
      expect(keys).toEqual(["z", "a", "setValue", "m"]);
    });
  });
});
