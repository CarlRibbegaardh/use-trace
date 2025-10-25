import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractPropChanges } from "@src/lib/features/autoTracer/functions/extractPropChanges.js";

// Mock dependencies
vi.mock("@src/lib/features/autoTracer/functions/isReactInternal.js", () => {
  return {
    isReactInternal: vi.fn(),
  };
});

vi.mock("@src/lib/features/autoTracer/functions/getSkippedProps.js", () => {
  return {
    getSkippedProps: vi.fn(),
  };
});

describe("extractPropChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when current props are missing", () => {
    const fiberNode = {
      alternate: {
        memoizedProps: { prop1: "value1" },
      },
    };

    const changes = extractPropChanges(fiberNode);
    expect(changes).toEqual([]);
  });

  it("should return empty array when previous props are missing", () => {
    const fiberNode = {
      memoizedProps: { prop1: "value1" },
    };

    const changes = extractPropChanges(fiberNode);
    expect(changes).toEqual([]);
  });

  it("should return empty array when both current and previous props are missing", () => {
    const fiberNode = {};

    const changes = extractPropChanges(fiberNode);
    expect(changes).toEqual([]);
  });

  it("should detect simple prop changes", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockReturnValue(false);
    getSkippedProps.mockReturnValue(new Set());

    const fiberNode = {
      memoizedProps: {
        prop1: "newValue",
        prop2: "unchanged",
      },
      alternate: {
        memoizedProps: {
          prop1: "oldValue",
          prop2: "unchanged",
        },
      },
    };

    const changes = extractPropChanges(fiberNode);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      name: "prop1",
      value: "newValue",
      prevValue: "oldValue",
    });
  });

  it("should ignore unchanged props", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockReturnValue(false);
    getSkippedProps.mockReturnValue(new Set());

    const fiberNode = {
      memoizedProps: {
        prop1: "sameValue",
        prop2: "anotherSameValue",
      },
      alternate: {
        memoizedProps: {
          prop1: "sameValue",
          prop2: "anotherSameValue",
        },
      },
    };

    const changes = extractPropChanges(fiberNode);
    expect(changes).toEqual([]);
  });

  it("should skip React internal props", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockImplementation((prop) => {
      return prop === "key" || prop === "ref";
    });
    getSkippedProps.mockReturnValue(new Set());

    const fiberNode = {
      memoizedProps: {
        key: "newKey",
        ref: "newRef",
        normalProp: "newValue",
      },
      alternate: {
        memoizedProps: {
          key: "oldKey",
          ref: "oldRef",
          normalProp: "oldValue",
        },
      },
    };

    const changes = extractPropChanges(fiberNode);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      name: "normalProp",
      value: "newValue",
      prevValue: "oldValue",
    });
  });

  it("should skip children prop", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockReturnValue(false);
    getSkippedProps.mockReturnValue(new Set());

    const fiberNode = {
      memoizedProps: {
        children: "newChildren",
        normalProp: "newValue",
      },
      alternate: {
        memoizedProps: {
          children: "oldChildren",
          normalProp: "oldValue",
        },
      },
    };

    const changes = extractPropChanges(fiberNode);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      name: "normalProp",
      value: "newValue",
      prevValue: "oldValue",
    });
  });

  it("should skip configured skipped props for component", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockReturnValue(false);
    getSkippedProps.mockReturnValue(new Set(["skippedProp"]));

    const fiberNode = {
      memoizedProps: {
        skippedProp: "newValue",
        normalProp: "newValue",
      },
      alternate: {
        memoizedProps: {
          skippedProp: "oldValue",
          normalProp: "oldValue",
        },
      },
    };

    const componentName = "TestComponent";
    const changes = extractPropChanges(fiberNode, componentName);

    expect(getSkippedProps).toHaveBeenCalledWith(componentName);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      name: "normalProp",
      value: "newValue",
      prevValue: "oldValue",
    });
  });

  it("should handle complex prop value types", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockReturnValue(false);
    getSkippedProps.mockReturnValue(new Set());

    const newObject = { nested: "newValue" };
    const oldObject = { nested: "oldValue" };
    const newArray = [1, 2, 3];
    const oldArray = [1, 2];

    const fiberNode = {
      memoizedProps: {
        objectProp: newObject,
        arrayProp: newArray,
        numberProp: 42,
        booleanProp: true,
        nullProp: null,
        undefinedProp: undefined,
      },
      alternate: {
        memoizedProps: {
          objectProp: oldObject,
          arrayProp: oldArray,
          numberProp: 24,
          booleanProp: false,
          nullProp: "notNull",
          undefinedProp: "defined",
        },
      },
    };

    const changes = extractPropChanges(fiberNode);

    expect(changes).toHaveLength(6);

    const changesByName = changes.reduce((acc, change) => {
      acc[change.name] = change;
      return acc;
    }, {} as Record<string, { name: string; value: unknown; prevValue: unknown }>);

    expect(changesByName.objectProp).toEqual({
      name: "objectProp",
      value: newObject,
      prevValue: oldObject,
    });

    expect(changesByName.arrayProp).toEqual({
      name: "arrayProp",
      value: newArray,
      prevValue: oldArray,
    });

    expect(changesByName.numberProp).toEqual({
      name: "numberProp",
      value: 42,
      prevValue: 24,
    });

    expect(changesByName.booleanProp).toEqual({
      name: "booleanProp",
      value: true,
      prevValue: false,
    });

    expect(changesByName.nullProp).toEqual({
      name: "nullProp",
      value: null,
      prevValue: "notNull",
    });

    expect(changesByName.undefinedProp).toEqual({
      name: "undefinedProp",
      value: undefined,
      prevValue: "defined",
    });
  });

  it("should use pendingProps when memoizedProps is not available", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockReturnValue(false);
    getSkippedProps.mockReturnValue(new Set());

    const fiberNode = {
      pendingProps: {
        prop1: "newValue",
      },
      alternate: {
        memoizedProps: {
          prop1: "oldValue",
        },
      },
    };

    const changes = extractPropChanges(fiberNode);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      name: "prop1",
      value: "newValue",
      prevValue: "oldValue",
    });
  });

  it("should handle errors gracefully and return empty array", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );

    // Make isReactInternal throw an error
    isReactInternal.mockImplementation(() => {
      throw new Error("Test error");
    });

    const fiberNode = {
      memoizedProps: { prop1: "newValue" },
      alternate: { memoizedProps: { prop1: "oldValue" } },
    };

    const changes = extractPropChanges(fiberNode);
    expect(changes).toEqual([]);
  });

  it("should handle prop that exists in current but not in previous", async () => {
    const { isReactInternal } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/isReactInternal.js")
    );
    const { getSkippedProps } = vi.mocked(
      await import("@src/lib/features/autoTracer/functions/getSkippedProps.js")
    );

    isReactInternal.mockReturnValue(false);
    getSkippedProps.mockReturnValue(new Set());

    const fiberNode = {
      memoizedProps: {
        existingProp: "value",
        newProp: "newValue",
      },
      alternate: {
        memoizedProps: {
          existingProp: "value",
          // newProp doesn't exist in previous
        },
      },
    };

    const changes = extractPropChanges(fiberNode);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      name: "newProp",
      value: "newValue",
      prevValue: undefined,
    });
  });
});
