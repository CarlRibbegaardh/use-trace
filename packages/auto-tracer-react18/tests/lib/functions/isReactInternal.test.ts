import { describe, expect, it } from "vitest";
import { isReactInternal } from "@src/lib/functions/isReactInternal.js";

describe("isReactInternal", () => {
  it("should return true for React fiber props", () => {
    const reactFiberProps = [
      "selfBaseDuration",
      "treeBaseDuration",
      "actualDuration",
      "actualStartTime",
      "flags",
      "subtreeFlags",
      "lanes",
      "childLanes",
      "mode",
      "index",
      "key",
      "ref",
      "type",
      "elementType",
      "pendingProps",
      "memoizedProps",
      "memoizedState",
      "updateQueue",
      "alternate",
      "return",
      "child",
      "sibling",
      "stateNode",
      "tag",
      "dependencies",
    ];

    reactFiberProps.forEach((prop) => {
      expect(isReactInternal(prop)).toBe(true);
    });
  });

  it("should return true for props starting with underscore", () => {
    expect(isReactInternal("_internalProp")).toBe(true);
    expect(isReactInternal("_")).toBe(true);
    expect(isReactInternal("_secret")).toBe(true);
    expect(isReactInternal("__proto__")).toBe(true);
  });

  it("should return true for props containing 'react'", () => {
    expect(isReactInternal("reactComponent")).toBe(true);
    expect(isReactInternal("isreactprop")).toBe(true);
    expect(isReactInternal("somereactfield")).toBe(true);
  });

  it("should return true for props containing 'React'", () => {
    expect(isReactInternal("ReactElement")).toBe(true);
    expect(isReactInternal("someReactProp")).toBe(true);
    expect(isReactInternal("isReactComponent")).toBe(true);
  });

  it("should return true for props containing 'Fiber'", () => {
    expect(isReactInternal("FiberNode")).toBe(true);
    expect(isReactInternal("someFiberProp")).toBe(true);
    expect(isReactInternal("isFiberNode")).toBe(true);
  });

  it("should return false for regular user props", () => {
    const userProps = [
      "className",
      "onClick",
      "value",
      "disabled",
      "style",
      "id",
      "title",
      "data-testid",
      "aria-label",
      "onSubmit",
      "placeholder",
      "name",
      "src",
      "alt",
      "href",
      "target",
    ];

    userProps.forEach((prop) => {
      expect(isReactInternal(prop)).toBe(false);
    });
  });

  it("should return false for empty string", () => {
    expect(isReactInternal("")).toBe(false);
  });

  it("should return false for props that don't match any criteria", () => {
    expect(isReactInternal("customProp")).toBe(false);
    expect(isReactInternal("someValue")).toBe(false);
    expect(isReactInternal("handler")).toBe(false);
    expect(isReactInternal("myComponent")).toBe(false);
  });

  it("should handle case-sensitive matching correctly", () => {
    // 'react' and 'React' should match
    expect(isReactInternal("react")).toBe(true);
    expect(isReactInternal("React")).toBe(true);

    // But not other cases
    expect(isReactInternal("REACT")).toBe(false);
    expect(isReactInternal("Fiber")).toBe(true);
    expect(isReactInternal("FIBER")).toBe(false);
    expect(isReactInternal("fiber")).toBe(false);
  });

  it("should match substring patterns correctly", () => {
    expect(isReactInternal("prefixreactsuffix")).toBe(true);
    expect(isReactInternal("prefixReactsuffix")).toBe(true);
    expect(isReactInternal("prefixFibersuffix")).toBe(true);
  });
});
