import { describe, expect, it } from "vitest";
import { getRealComponentName } from "@src/lib/functions/getRealComponentName.js";

describe("getRealComponentName", () => {
  it("should return forwardRef render function name", () => {
    const fiberNode = {
      type: {
        render: {
          name: "ForwardedComponent",
        },
      },
    };

    expect(getRealComponentName(fiberNode)).toBe("ForwardedComponent");
  });

  it("should return memo component function name", () => {
    const mockFunction = function MemoizedComponent() {};

    const fiberNode = {
      type: {
        type: mockFunction,
      },
    };

    expect(getRealComponentName(fiberNode)).toBe("MemoizedComponent");
  });

  it("should return 'Unknown' for memo component without name", () => {
    // Create a proper anonymous function
    const anonymousFunc = (() => {
      return function() {};
    })();

    const fiberNode = {
      type: {
        type: anonymousFunc,
      },
    };

    const result = getRealComponentName(fiberNode);
    // For anonymous functions, name is "" (empty string), so should return "Unknown"
    expect(result).toBe("Unknown");
  });

  it("should return regular component name from elementType", () => {
    const mockFunction = function RegularComponent() {};

    const fiberNode = {
      elementType: mockFunction,
    };

    expect(getRealComponentName(fiberNode)).toBe("RegularComponent");
  });

  it("should return regular component name from type when elementType is not available", () => {
    const mockFunction = function ComponentFromType() {};

    const fiberNode = {
      type: mockFunction,
    };

    expect(getRealComponentName(fiberNode)).toBe("ComponentFromType");
  });

  it("should return 'Unknown' when component has no name", () => {
    // Create a proper anonymous function
    const anonymousFunc = (() => {
      return function() {};
    })();

    const fiberNode = {
      elementType: anonymousFunc,
    };

    const result = getRealComponentName(fiberNode);
    expect(result).toBe("Unknown");
  });

  it("should return 'Unknown' when no type information is available", () => {
    const fiberNode = {};

    expect(getRealComponentName(fiberNode)).toBe("Unknown");
  });

  it("should handle null elementType and type", () => {
    const fiberNode = {
      elementType: null,
      type: null,
    };

    expect(getRealComponentName(fiberNode)).toBe("Unknown");
  });

  it("should handle undefined elementType and type", () => {
    const fiberNode = {
      elementType: undefined,
      type: undefined,
    };

    expect(getRealComponentName(fiberNode)).toBe("Unknown");
  });

  it("should prioritize forwardRef name over elementType", () => {
    const mockFunction = function ElementTypeComponent() {};

    const fiberNode = {
      type: {
        render: {
          name: "ForwardRefComponent",
        },
      },
      elementType: mockFunction,
    };

    expect(getRealComponentName(fiberNode)).toBe("ForwardRefComponent");
  });

  it("should prioritize memo component name over elementType", () => {
    const mockMemoFunction = function MemoComponent() {};
    const mockElementFunction = function ElementComponent() {};

    const fiberNode = {
      type: {
        type: mockMemoFunction,
      },
      elementType: mockElementFunction,
    };

    expect(getRealComponentName(fiberNode)).toBe("MemoComponent");
  });

  it("should handle forwardRef without render name", () => {
    const mockFunction = function ElementComponent() {};

    const fiberNode = {
      type: {
        render: {},
      },
      elementType: mockFunction,
    };

    expect(getRealComponentName(fiberNode)).toBe("ElementComponent");
  });

  it("should handle memo component with non-function type", () => {
    const mockFunction = function ElementComponent() {};

    const fiberNode = {
      type: {
        type: "not-a-function",
      },
      elementType: mockFunction,
    };

    expect(getRealComponentName(fiberNode)).toBe("ElementComponent");
  });

  it("should handle complex nested component structures", () => {
    const fiberNode = {
      type: {
        render: {
          name: "",  // Empty name should fall through
        },
        type: {
          name: "ShouldNotUseThis"
        }
      },
      elementType: function FallbackComponent() {},
    };

    expect(getRealComponentName(fiberNode)).toBe("FallbackComponent");
  });
});
