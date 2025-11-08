/**
 * Tests for stable key ordering in stringify
 *
 * Ensures that objects with identical content but different key orders
 * produce identical stringified output, preventing false positives in
 * identical value change detection.
 */

import { describe, expect, it } from "vitest";
import { stringify } from "@src/lib/functions/stringify.js";

describe("stringify - Stable Key Ordering", () => {
  describe("simple objects", () => {
    it("should produce identical output for objects with different key orders", () => {
      const obj1 = { b: 2, a: 1 };
      const obj2 = { a: 1, b: 2 };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      // Different key orders should produce same result
      expect(result1).toBe(result2);
    });

    it("should normalize keys for objects with many properties", () => {
      const obj1 = { z: 26, a: 1, m: 13, c: 3 };
      const obj2 = { a: 1, c: 3, m: 13, z: 26 };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      expect(result1).toBe(result2);
    });

    it("should handle empty objects consistently", () => {
      const obj1 = {};
      const obj2 = {};

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      expect(result1).toBe(result2);
      expect(result1).toBe("{}");
    });
  });

  describe("nested objects", () => {
    it("should normalize keys in nested structures", () => {
      const obj1 = {
        outer: { b: 2, a: 1 },
        value: "test",
      };

      const obj2 = {
        value: "test",
        outer: { a: 1, b: 2 },
      };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      expect(result1).toBe(result2);
    });

    it("should handle deeply nested objects", () => {
      const obj1 = {
        level1: {
          level2: {
            c: 3,
            b: 2,
            a: 1,
          },
        },
      };

      const obj2 = {
        level1: {
          level2: {
            a: 1,
            b: 2,
            c: 3,
          },
        },
      };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      expect(result1).toBe(result2);
    });
  });

  describe("objects with mixed types", () => {
    it("should normalize keys regardless of value types", () => {
      const obj1 = {
        string: "value",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
      };

      const obj2 = {
        array: [1, 2, 3],
        boolean: true,
        null: null,
        number: 42,
        string: "value",
      };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      expect(result1).toBe(result2);
    });

    it("should handle objects with function properties and stable key order", () => {
      const fn1 = () => 1;
      const fn2 = () => 2;

      const obj1 = {
        second: fn2,
        first: fn1,
        value: "test",
      };

      const obj2 = {
        first: fn1,
        value: "test",
        second: fn2,
      };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      // Same functions in same object structure should produce same result
      // regardless of property declaration order
      expect(result1).toBe(result2);
    });
  });

  describe("use case: detect identical value changes", () => {
    it("should detect identical objects with different key orders as identical", () => {
      // Simulating Redux selector returning same data with different key orders
      const state1 = { sortBy: "date", filter: "all" };
      const state2 = { filter: "all", sortBy: "date" };

      const result1 = stringify(state1);
      const result2 = stringify(state2);

      // Should be detected as identical (no false positive)
      expect(result1).toBe(result2);
    });

    it("should detect identical nested configs with different key orders", () => {
      const config1 = {
        theme: "dark",
        lang: "en",
        settings: {
          notifications: true,
          autoSave: false,
        },
      };

      const config2 = {
        settings: {
          autoSave: false,
          notifications: true,
        },
        lang: "en",
        theme: "dark",
      };

      const result1 = stringify(config1);
      const result2 = stringify(config2);

      expect(result1).toBe(result2);
    });
  });
});
