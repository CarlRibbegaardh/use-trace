/**
 * Tests for function identity tracking in stringify
 *
 * Function identity tracking assigns unique numeric IDs to function instances,
 * enabling detection of inline function anti-patterns in React components.
 */

import { describe, expect, it } from "vitest";
import { stringify } from "@src/lib/functions/stringify.js";

describe("stringify - Function Identity Tracking", () => {
  describe("same function reference", () => {
    it("should assign same ID to same function reference across multiple calls", () => {
      const fn = () => console.log("test");

      const result1 = stringify(fn);
      const result2 = stringify(fn);
      const result3 = stringify(fn);

      // Format should be "(fn:123)" where 123 is a numeric ID
      expect(result1).toMatch(/^\(fn:\d+\)$/);

      // Same function reference should get same ID
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it("should maintain same ID for function reference in objects", () => {
      const onClick = () => console.log("click");

      const obj1 = { handler: onClick };
      const obj2 = { handler: onClick };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      // Same function reference should produce same stringified result
      expect(result1).toBe(result2);
    });

    it("should maintain same ID for function reference in arrays", () => {
      const fn1 = () => 1;
      const fn2 = () => 2;

      const arr1 = [fn1, fn2];
      const arr2 = [fn1, fn2];

      const result1 = stringify(arr1);
      const result2 = stringify(arr2);

      // Same function references in same order should produce same result
      expect(result1).toBe(result2);
    });
  });

  describe("different function instances", () => {
    it("should assign different IDs to different function instances", () => {
      const fn1 = () => console.log("test");
      const fn2 = () => console.log("test"); // Same source code, different instance

      const result1 = stringify(fn1);
      const result2 = stringify(fn2);

      // Both should be in (fn:N) format
      expect(result1).toMatch(/^\(fn:\d+\)$/);
      expect(result2).toMatch(/^\(fn:\d+\)$/);

      // Different instances should get different IDs
      expect(result1).not.toBe(result2);
    });

    it("should assign different IDs to functions in objects with different instances", () => {
      const onClick1 = () => console.log("click");
      const onClick2 = () => console.log("click"); // Different instance

      const obj1 = { handler: onClick1 };
      const obj2 = { handler: onClick2 };

      const result1 = stringify(obj1);
      const result2 = stringify(obj2);

      // Different function instances should produce different results
      expect(result1).not.toBe(result2);

      // Both should contain function ID markers
      expect(result1).toContain("(fn:");
      expect(result2).toContain("(fn:");
    });

    it("should track multiple different functions", () => {
      const fn1 = () => 1;
      const fn2 = () => 2;
      const fn3 = () => 3;

      const result1 = stringify(fn1);
      const result2 = stringify(fn2);
      const result3 = stringify(fn3);

      // All should have unique IDs
      expect(new Set([result1, result2, result3]).size).toBe(3);
    });
  });

  describe("function ID format", () => {
    it("should return unquoted function ID at root level", () => {
      const fn = () => console.log("test");

      const result = stringify(fn);

      // Should be "(fn:123)" not "\"(fn:123)\""
      expect(result).toMatch(/^\(fn:\d+\)$/);
      expect(result).not.toMatch(/^"/); // Should not start with quote
    });

    it("should return function ID as string in objects", () => {
      const fn = () => console.log("test");
      const obj = { handler: fn };

      const result = stringify(obj);

      // Should contain the function ID
      expect(result).toContain("(fn:");

      // Result should be valid JSON-like string
      expect(result).toContain("{");
      expect(result).toContain("}");
    });
  });

  describe("edge cases", () => {
    it("should handle objects with multiple function properties", () => {
      const fn1 = () => 1;
      const fn2 = () => 2;

      const obj = {
        onClick: fn1,
        onHover: fn2,
      };

      const result = stringify(obj);

      // Should contain both function IDs
      const matches = result.match(/\(fn:\d+\)/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(2);
    });

    it("should handle arrays of functions", () => {
      const fn1 = () => 1;
      const fn2 = () => 2;

      const arr = [fn1, fn2];

      const result = stringify(arr);

      // Should contain both function IDs
      const matches = result.match(/\(fn:\d+\)/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(2);
    });

    it("should handle nested objects with functions", () => {
      const fn = () => console.log("nested");

      const obj = {
        level1: {
          level2: {
            handler: fn,
          },
        },
      };

      const result = stringify(obj);

      // Should contain the function ID deep in structure
      expect(result).toContain("(fn:");
    });

    it("should handle mixed primitives and functions", () => {
      const fn = () => console.log("test");

      const obj = {
        name: "test",
        count: 42,
        active: true,
        handler: fn,
        empty: null,
      };

      const result = stringify(obj);

      // Should contain all values
      expect(result).toContain("test");
      expect(result).toContain("42");
      expect(result).toContain("true");
      expect(result).toContain("(fn:");
      expect(result).toContain("null");
    });
  });
});
