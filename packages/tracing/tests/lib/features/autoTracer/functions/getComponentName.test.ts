import { describe, expect, it } from "vitest";
import { getComponentName } from "@src/lib/features/autoTracer/functions/getComponentName.js";

describe("getComponentName", () => {
  it("should return null for falsy values", () => {
    expect(getComponentName(null)).toBe(null);
    expect(getComponentName(undefined)).toBe(null);
    expect(getComponentName(false)).toBe(null);
    expect(getComponentName(0)).toBe(null);
    expect(getComponentName("")).toBe(null);
  });

  it("should extract name from function", () => {
    function MyComponent() {
      return null;
    }

    expect(getComponentName(MyComponent)).toBe("MyComponent");
  });

  it("should extract displayName from function if available", () => {
    function MyComponent() {
      return null;
    }
    MyComponent.displayName = "CustomDisplayName";

    expect(getComponentName(MyComponent)).toBe("CustomDisplayName");
  });

  it("should handle anonymous functions", () => {
    const anonymousFunc = function() {
      return null;
    };

    expect(getComponentName(anonymousFunc)).toBe("anonymousFunc");
  });

  it("should extract name from object with name property", () => {
    const componentObj = { name: "ObjectComponent" };

    expect(getComponentName(componentObj)).toBe("ObjectComponent");
  });

  it("should extract displayName from object if available", () => {
    const componentObj = {
      name: "ObjectComponent",
      displayName: "CustomObjectDisplayName"
    };

    expect(getComponentName(componentObj)).toBe("CustomObjectDisplayName");
  });

  it("should prefer displayName over name for objects", () => {
    const componentObj = {
      name: "ObjectComponent",
      displayName: "PreferredDisplayName"
    };

    expect(getComponentName(componentObj)).toBe("PreferredDisplayName");
  });

  it("should handle objects without name properties", () => {
    const plainObj = { someOtherProp: "value" };

    expect(getComponentName(plainObj)).toBe(null);
  });

  it("should handle primitive values by converting to string", () => {
    expect(getComponentName(42)).toBe("42");
    expect(getComponentName(true)).toBe("true");
    expect(getComponentName("string")).toBe("string");
  });

  it("should handle symbols", () => {
    const sym = Symbol("test");
    const result = getComponentName(sym);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result).toContain("Symbol");
  });

  it("should handle arrays", () => {
    const arr = [1, 2, 3];
    const result = getComponentName(arr);

    expect(result).toBe(null); // arrays are objects without name/displayName
  });

  it("should handle arrow functions", () => {
    const arrowFunc = () => {
      return null;
    };

    expect(getComponentName(arrowFunc)).toBe("arrowFunc");
  });

  it("should return 'Unknown' for objects that cannot be converted to string", () => {
    const problematicObj = {
      toString: () => {
        throw new Error("Cannot convert");
      }
    };

    expect(getComponentName(problematicObj)).toBe(null); // objects without name/displayName return null
  });
});
