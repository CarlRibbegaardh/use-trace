/**
 * @file Tests for reconstructObjectFromFiber function.
 */

import { describe, it, expect } from "vitest";
import {
  reconstructObjectFromFiber,
  type FiberHook,
  type ReconstructionResult,
} from "../../src/lib/functions/reconstructObjectFromFiber.js";
import { FUNCTION_PLACEHOLDER } from "../../src/lib/functions/normalizeValue.js";
import type { PropertyMetadata } from "../../src/lib/functions/classifyObjectProperties.js";

describe("reconstructObjectFromFiber", () => {
  describe("mixed pattern (common custom hooks)", () => {
    it("should reconstruct single state value with setter", () => {
      const metadata: PropertyMetadata = {
        names: ["value", "setValue"],
        types: ["value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "test" },
        { index: 1, value: "other" }, // Not consumed
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        value: "test",
        setValue: FUNCTION_PLACEHOLDER,
      });
      expect(result.error).toBeUndefined();
    });

    it("should reconstruct multiple state values with setters", () => {
      const metadata: PropertyMetadata = {
        names: ["name", "setName", "email", "setEmail"],
        types: ["value", "function", "value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "John" },
        { index: 1, value: "john@example.com" },
        { index: 2, value: "other" }, // Not consumed
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        name: "John",
        setName: FUNCTION_PLACEHOLDER,
        email: "john@example.com",
        setEmail: FUNCTION_PLACEHOLDER,
      });
    });

    it("should handle various primitive types", () => {
      const metadata: PropertyMetadata = {
        names: ["str", "num", "bool", "nul", "undef", "setter"],
        types: ["value", "value", "value", "value", "value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "test" },
        { index: 1, value: 42 },
        { index: 2, value: true },
        { index: 3, value: null },
        { index: 4, value: undefined },
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        str: "test",
        num: 42,
        bool: true,
        nul: null,
        undef: undefined,
        setter: FUNCTION_PLACEHOLDER,
      });
    });

    it("should handle nested objects as state values", () => {
      const metadata: PropertyMetadata = {
        names: ["settings", "updateSettings"],
        types: ["value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: { theme: "dark", lang: "en" } },
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        settings: { theme: "dark", lang: "en" },
        updateSettings: FUNCTION_PLACEHOLDER,
      });
    });
  });

  describe("all-functions pattern (function-valued state)", () => {
    it("should reconstruct all functions as state values", () => {
      const fn1 = () => {};
      const fn2 = () => {};
      const fn3 = () => {};

      const metadata: PropertyMetadata = {
        names: ["onClick", "onSubmit", "onCancel"],
        types: ["value", "value", "value"], // All classified as "value"
      };
      const hooks: FiberHook[] = [
        { index: 0, value: fn1 },
        { index: 1, value: fn2 },
        { index: 2, value: fn3 },
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        onClick: fn1,
        onSubmit: fn2,
        onCancel: fn3,
      });
    });

    it("should reconstruct single function-valued state", () => {
      const fn = () => {};

      const metadata: PropertyMetadata = {
        names: ["callback"],
        types: ["value"],
      };
      const hooks: FiberHook[] = [{ index: 0, value: fn }];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        callback: fn,
      });
    });
  });

  describe("non-zero start index", () => {
    it("should reconstruct from middle of hook chain", () => {
      const metadata: PropertyMetadata = {
        names: ["value", "setValue"],
        types: ["value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "other1" }, // Not consumed
        { index: 1, value: "other2" }, // Not consumed
        { index: 2, value: "target" }, // This should be consumed
        { index: 3, value: "other3" }, // Not consumed
      ];

      const result = reconstructObjectFromFiber(2, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        value: "target",
        setValue: FUNCTION_PLACEHOLDER,
      });
    });

    it("should consume sequential hooks from start index", () => {
      const metadata: PropertyMetadata = {
        names: ["a", "setA", "b", "setB"],
        types: ["value", "function", "value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "skip" },
        { index: 1, value: "first" }, // Consumed (index 1 + 0)
        { index: 2, value: "second" }, // Consumed (index 1 + 1)
      ];

      const result = reconstructObjectFromFiber(1, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        a: "first",
        setA: FUNCTION_PLACEHOLDER,
        b: "second",
        setB: FUNCTION_PLACEHOLDER,
      });
    });
  });

  describe("insufficient hooks error", () => {
    it("should fail when not enough hooks available", () => {
      const metadata: PropertyMetadata = {
        names: ["a", "setA", "b", "setB"],
        types: ["value", "function", "value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "first" },
        // Missing second hook!
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("insufficient-hooks");
    });

    it("should fail when start index out of range", () => {
      const metadata: PropertyMetadata = {
        names: ["value", "setValue"],
        types: ["value", "function"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "test" },
      ];

      // Trying to start at index 5, but only have index 0
      const result = reconstructObjectFromFiber(5, metadata, hooks);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("insufficient-hooks");
    });
  });

  describe("invalid metadata error", () => {
    it("should fail when names and types length mismatch", () => {
      const metadata: PropertyMetadata = {
        names: ["a", "b"],
        types: ["value"], // Length mismatch!
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "test" },
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("invalid-metadata");
    });

    it("should handle empty metadata", () => {
      const metadata: PropertyMetadata = {
        names: [],
        types: [],
      };
      const hooks: FiberHook[] = [];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({});
    });
  });

  describe("property order preservation", () => {
    it("should preserve metadata property order", () => {
      const metadata: PropertyMetadata = {
        names: ["z", "a", "setValue", "m"],
        types: ["value", "value", "function", "value"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: "last" },
        { index: 1, value: "first" },
        { index: 2, value: "middle" },
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      const keys = Object.keys(result.value!);
      expect(keys).toEqual(["z", "a", "setValue", "m"]);
    });
  });

  describe("edge cases", () => {
    it("should handle only non-function properties", () => {
      const metadata: PropertyMetadata = {
        names: ["a", "b", "c"],
        types: ["value", "value", "value"],
      };
      const hooks: FiberHook[] = [
        { index: 0, value: 1 },
        { index: 1, value: "test" },
        { index: 2, value: true },
      ];

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        a: 1,
        b: "test",
        c: true,
      });
    });

    it("should handle only function properties", () => {
      const metadata: PropertyMetadata = {
        names: ["fn1", "fn2", "fn3"],
        types: ["function", "function", "function"],
      };
      const hooks: FiberHook[] = []; // No hooks needed!

      const result = reconstructObjectFromFiber(0, metadata, hooks);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        fn1: FUNCTION_PLACEHOLDER,
        fn2: FUNCTION_PLACEHOLDER,
        fn3: FUNCTION_PLACEHOLDER,
      });
    });
  });
});
