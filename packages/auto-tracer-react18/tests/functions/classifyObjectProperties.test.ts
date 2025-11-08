/**
 * @file Tests for classifyObjectProperties function.
 */

import { describe, it, expect } from "vitest";
import {
  classifyObjectProperties,
  type PropertyMetadata,
} from "../../src/lib/functions/classifyObjectProperties.js";

describe("classifyObjectProperties", () => {
  describe("non-objects return null", () => {
    it("should return null for primitives", () => {
      expect(classifyObjectProperties("test")).toBeNull();
      expect(classifyObjectProperties(42)).toBeNull();
      expect(classifyObjectProperties(true)).toBeNull();
      expect(classifyObjectProperties(null)).toBeNull();
      expect(classifyObjectProperties(undefined)).toBeNull();
    });

    it("should return null for arrays", () => {
      expect(classifyObjectProperties([1, 2, 3])).toBeNull();
      expect(classifyObjectProperties([])).toBeNull();
    });
  });

  describe("empty objects", () => {
    it("should return empty metadata for empty object", () => {
      const result = classifyObjectProperties({});

      expect(result).toEqual({
        names: [],
        types: [],
      });
    });
  });

  describe("mixed pattern (common custom hooks)", () => {
    it("should classify single state value with setter", () => {
      const fn = () => {};
      const input = { value: "test", setValue: fn };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["value", "setValue"],
        types: ["value", "function"],
      } satisfies PropertyMetadata);
    });

    it("should classify multiple state values with setters", () => {
      const fn1 = () => {};
      const fn2 = () => {};
      const input = {
        name: "John",
        setName: fn1,
        email: "j@e.com",
        setEmail: fn2,
      };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["name", "setName", "email", "setEmail"],
        types: ["value", "function", "value", "function"],
      } satisfies PropertyMetadata);
    });

    it("should handle various primitive types as state", () => {
      const fn = () => {};
      const input = {
        str: "test",
        num: 42,
        bool: true,
        nul: null,
        undef: undefined,
        setter: fn,
      };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["str", "num", "bool", "nul", "undef", "setter"],
        types: ["value", "value", "value", "value", "value", "function"],
      } satisfies PropertyMetadata);
    });

    it("should handle nested objects as state values", () => {
      const fn = () => {};
      const input = {
        settings: { theme: "dark" },
        updateSettings: fn,
      };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["settings", "updateSettings"],
        types: ["value", "function"],
      } satisfies PropertyMetadata);
    });
  });

  describe("all-functions pattern (function-valued state)", () => {
    it("should classify all functions as state values", () => {
      const fn1 = () => {};
      const fn2 = () => {};
      const fn3 = () => {};
      const input = { onClick: fn1, onSubmit: fn2, onCancel: fn3 };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["onClick", "onSubmit", "onCancel"],
        types: ["value", "value", "value"], // All "value" because all are functions
      } satisfies PropertyMetadata);
    });

    it("should classify single function as state value", () => {
      const fn = () => {};
      const input = { callback: fn };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["callback"],
        types: ["value"],
      } satisfies PropertyMetadata);
    });

    it("should handle two functions as both state values", () => {
      const fn1 = () => {};
      const fn2 = () => {};
      const input = { handler1: fn1, handler2: fn2 };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["handler1", "handler2"],
        types: ["value", "value"],
      } satisfies PropertyMetadata);
    });
  });

  describe("property order preservation", () => {
    it("should preserve insertion order of property names", () => {
      const fn = () => {};
      const input = {
        z: "last",
        a: "first",
        setValue: fn,
        m: "middle",
      };
      const result = classifyObjectProperties(input);

      expect(result?.names).toEqual(["z", "a", "setValue", "m"]);
      expect(result?.types).toEqual(["value", "value", "function", "value"]);
    });
  });

  describe("edge cases", () => {
    it("should handle object with only non-function properties", () => {
      const input = { a: 1, b: "test", c: true };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["a", "b", "c"],
        types: ["value", "value", "value"],
      } satisfies PropertyMetadata);
    });

    it("should handle object with nested arrays", () => {
      const fn = () => {};
      const input = {
        items: [1, 2, 3],
        setItems: fn,
      };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["items", "setItems"],
        types: ["value", "function"],
      } satisfies PropertyMetadata);
    });
  });

  describe("deterministic classification rule", () => {
    it("should classify based on structure not property names", () => {
      const fn = () => {};

      // Even though "update" doesn't match typical "set*" pattern,
      // it's still classified as a function setter
      const input = { data: "test", update: fn };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["data", "update"],
        types: ["value", "function"],
      } satisfies PropertyMetadata);
    });

    it("should not be influenced by property naming conventions", () => {
      const fn1 = () => {};
      const fn2 = () => {};

      // All functions → all classified as "value" regardless of names
      const input = { setValue: fn1, setData: fn2 };
      const result = classifyObjectProperties(input);

      expect(result).toEqual({
        names: ["setValue", "setData"],
        types: ["value", "value"], // Both "value" because ALL are functions
      } satisfies PropertyMetadata);
    });
  });
});
