/**
 * @file Tests for matchByStructure function.
 */

import { describe, it, expect } from "vitest";
import {
  matchByStructure,
  type StructuralMatchResult,
} from "../../src/lib/functions/matchByStructure.js";
import { FUNCTION_PLACEHOLDER } from "../../src/lib/functions/normalizeValue.js";

describe("matchByStructure", () => {
  describe("successful matching", () => {
    it("should match and update simple object with same keys", () => {
      const stored = { value: "old", setValue: FUNCTION_PLACEHOLDER };
      const current = { value: "new", setValue: FUNCTION_PLACEHOLDER };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({ value: "new", setValue: FUNCTION_PLACEHOLDER });
      expect(result.error).toBeUndefined();
    });

    it("should update all value properties from current object", () => {
      const stored = {
        name: "John",
        setName: FUNCTION_PLACEHOLDER,
        email: "john@old.com",
        setEmail: FUNCTION_PLACEHOLDER,
      };
      const current = {
        name: "Jane",
        setName: FUNCTION_PLACEHOLDER,
        email: "jane@new.com",
        setEmail: FUNCTION_PLACEHOLDER,
      };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        name: "Jane",
        setName: FUNCTION_PLACEHOLDER,
        email: "jane@new.com",
        setEmail: FUNCTION_PLACEHOLDER,
      });
    });

    it("should handle various primitive types", () => {
      const stored = {
        str: "old",
        num: 10,
        bool: false,
        nul: null,
        undef: undefined,
      };
      const current = {
        str: "new",
        num: 42,
        bool: true,
        nul: null,
        undef: undefined,
      };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value).toEqual(current);
    });

    it("should match empty objects", () => {
      const stored = {};
      const current = {};

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({});
    });

    it("should preserve property order from stored object", () => {
      const stored = { z: 1, a: 2, m: 3 };
      const current = { z: 10, a: 20, m: 30 };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      const keys = Object.keys(result.value!);
      expect(keys).toEqual(["z", "a", "m"]);
    });
  });

  describe("all-functions pattern", () => {
    it("should update function references in all-functions objects", () => {
      const fn1 = () => "old";
      const fn2 = () => "new";
      const stored = { callback: fn1 };
      const current = { callback: fn2 };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({ callback: fn2 });
      expect(result.value?.callback).toBe(fn2);
    });

    it("should update multiple function references", () => {
      const oldFn1 = () => {};
      const oldFn2 = () => {};
      const newFn1 = () => {};
      const newFn2 = () => {};
      const stored = { onClick: oldFn1, onSubmit: oldFn2 };
      const current = { onClick: newFn1, onSubmit: newFn2 };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value?.onClick).toBe(newFn1);
      expect(result.value?.onSubmit).toBe(newFn2);
    });
  });

  describe("nested objects (one-level deep)", () => {
    it("should update nested object reference as single value", () => {
      const oldNested = { theme: "light" };
      const newNested = { theme: "dark" };
      const stored = { settings: oldNested, setSetting: FUNCTION_PLACEHOLDER };
      const current = { settings: newNested, setSetting: FUNCTION_PLACEHOLDER };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value).toEqual({
        settings: newNested,
        setSetting: FUNCTION_PLACEHOLDER,
      });
      expect(result.value?.settings).toBe(newNested);
    });

    it("should update array reference as single value", () => {
      const oldArr = [1, 2];
      const newArr = [3, 4, 5];
      const stored = { items: oldArr };
      const current = { items: newArr };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value?.items).toBe(newArr);
    });
  });

  describe("structural mismatch errors", () => {
    it("should fail when current has extra keys", () => {
      const stored = { value: "test" };
      const current = { value: "test", extra: "key" };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("structure-mismatch");
    });

    it("should fail when current has fewer keys", () => {
      const stored = { value: "test", setValue: FUNCTION_PLACEHOLDER };
      const current = { value: "test" };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("structure-mismatch");
    });

    it("should fail when keys are different", () => {
      const stored = { name: "John" };
      const current = { email: "john@example.com" };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("structure-mismatch");
    });

    it("should fail when key order differs (strict structural comparison)", () => {
      const stored = { a: 1, b: 2 };
      const current = { b: 2, a: 1 };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("structure-mismatch");
    });
  });

  describe("invalid input handling", () => {
    it("should fail when stored is not an object", () => {
      const result = matchByStructure("not an object" as any, { key: "value" });

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("invalid-input");
    });

    it("should fail when current is not an object", () => {
      const result = matchByStructure({ key: "value" }, "not an object" as any);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("invalid-input");
    });

    it("should fail when stored is null", () => {
      const result = matchByStructure(null as any, { key: "value" });

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("invalid-input");
    });

    it("should fail when current is null", () => {
      const result = matchByStructure({ key: "value" }, null as any);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("invalid-input");
    });

    it("should fail when stored is array", () => {
      const result = matchByStructure([1, 2, 3] as any, { key: "value" });

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("invalid-input");
    });

    it("should fail when current is array", () => {
      const result = matchByStructure({ key: "value" }, [1, 2, 3] as any);

      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe("invalid-input");
    });
  });

  describe("real-world scenarios", () => {
    it("should match useForm pattern after state update", () => {
      const stored = {
        username: "john_doe",
        password: "old_password",
        email: "john@old.com",
        setUsername: FUNCTION_PLACEHOLDER,
        setPassword: FUNCTION_PLACEHOLDER,
        setEmail: FUNCTION_PLACEHOLDER,
      };
      const current = {
        username: "jane_smith",
        password: "new_password",
        email: "jane@new.com",
        setUsername: FUNCTION_PLACEHOLDER,
        setPassword: FUNCTION_PLACEHOLDER,
        setEmail: FUNCTION_PLACEHOLDER,
      };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value).toEqual(current);
    });

    it("should match microfrontend callback registry after registration", () => {
      const oldLogin = () => console.log("old login");
      const oldLogout = () => console.log("old logout");
      const newLogin = () => console.log("new login");
      const newLogout = () => console.log("new logout");

      const stored = {
        onUserLogin: oldLogin,
        onUserLogout: oldLogout,
      };
      const current = {
        onUserLogin: newLogin,
        onUserLogout: newLogout,
      };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(true);
      expect(result.value?.onUserLogin).toBe(newLogin);
      expect(result.value?.onUserLogout).toBe(newLogout);
    });

    it("should reject structural mismatch in custom hook evolution", () => {
      // Simulates custom hook changing from v1 to v2 with extra property
      const stored = { value: "test", setValue: FUNCTION_PLACEHOLDER };
      const current = {
        value: "test",
        setValue: FUNCTION_PLACEHOLDER,
        error: "new field",
      };

      const result = matchByStructure(stored, current);

      expect(result.success).toBe(false);
      expect(result.error).toBe("structure-mismatch");
    });
  });
});
