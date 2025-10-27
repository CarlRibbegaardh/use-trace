/**
 * Tests for styledLogger.ts
 * Tests styled logging functions with dependency injection
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type StyledLoggerOptions,
  logDefinitive,
  logLogStatement,
  logPropChange,
  logReconciled,
  logSkipped,
  logStateChange,
  logStyled,
} from "../../../../../src/lib/features/autoTracer/functions/styledLogger.js";

// Mock console utilities
vi.mock("../../../../../src/lib/features/autoTracer/functions/consoleUtils.js", () => {
  return {
    safeLog: vi.fn(),
  };
});

// Mock theme manager
vi.mock("../../../../../src/lib/features/autoTracer/functions/themeManager.js", () => {
  return {
    getThemeOptions: vi.fn().mockReturnValue({ text: "#333", bold: true }),
    buildStyle: vi.fn().mockReturnValue("color: #333; font-weight: bold;"),
  };
});

import { safeLog } from "../../../../../src/lib/features/autoTracer/functions/consoleUtils.js";
import { buildStyle, getThemeOptions } from "../../../../../src/lib/features/autoTracer/functions/themeManager.js";

const mockSafeLog = vi.mocked(safeLog);
const mockGetThemeOptions = vi.mocked(getThemeOptions);
const mockBuildStyle = vi.mocked(buildStyle);

describe("styledLogger", () => {
  let options: StyledLoggerOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    options = {
      themeManager: {
        isDarkMode: () => {
          return false;
        },
      },
      getColors: () => {
        return {
          definitiveRender: {
            icon: "⚡",
            lightMode: { text: "#00aa00", bold: true }
          },
          propChange: {
            icon: "📝",
            lightMode: { text: "#0066cc", italic: true }
          },
          propInitial: {
            icon: "📝",
            lightMode: { text: "#666666" }
          },
          stateChange: {
            icon: "📊",
            lightMode: { text: "#cc6600", bold: true }
          },
          stateInitial: {
            icon: "📊",
            lightMode: { text: "#999999" }
          },
          logStatements: {
            icon: "📝",
            lightMode: { text: "#333333" }
          },
          reconciled: {
            icon: "♻️",
            lightMode: { text: "#009900" }
          },
          skipped: {
            icon: "⏭️",
            lightMode: { text: "#cccccc" }
          },
        };
      },
    };
  });

  describe("logDefinitive", () => {
    it("should log with definitive render colors and icon", () => {
      logDefinitive("  │   ", "[Component] Rendering", options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().definitiveRender,
        options.themeManager
      );
      expect(mockBuildStyle).toHaveBeenCalled();
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c[Component] Rendering ⚡",
        "color: #333; font-weight: bold;"
      );
    });

    it("should log without icon when not provided", () => {
      const noIconOptions = {
        ...options,
        getColors: () => {
          return {
            definitiveRender: {
              lightMode: { text: "#00aa00", bold: true }
            },
          };
        },
      };

      logDefinitive("  │   ", "[Component] Rendering", noIconOptions);

      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c[Component] Rendering",
        "color: #333; font-weight: bold;"
      );
    });
  });

  describe("logPropChange", () => {
    it("should log initial prop change with initial colors", () => {
      logPropChange("  │   ", "Initial prop: value", true, options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().propInitial,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c📝 Initial prop: value",
        "color: #333; font-weight: bold;"
      );
    });

    it("should log prop change with change colors", () => {
      logPropChange("  │   ", "Prop changed: old → new", false, options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().propChange,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c📝 Prop changed: old → new",
        "color: #333; font-weight: bold;"
      );
    });

    it("should handle missing prop colors", () => {
      const noColorOptions = {
        ...options,
        getColors: () => {
          return {};
        },
      };

      logPropChange("  │   ", "Prop: value", false, noColorOptions);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(undefined, options.themeManager);
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %cProp: value",
        "color: #333; font-weight: bold;"
      );
    });
  });

  describe("logStateChange", () => {
    it("should log initial state with initial colors", () => {
      logStateChange("  │   ", "Initial state: 1", true, options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().stateInitial,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c📊 Initial state: 1",
        "color: #333; font-weight: bold;"
      );
    });

    it("should log state change with change colors", () => {
      logStateChange("  │   ", "State change: 1 → 2", false, options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().stateChange,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c📊 State change: 1 → 2",
        "color: #333; font-weight: bold;"
      );
    });
  });

  describe("logLogStatement", () => {
    it("should log with log statement colors", () => {
      logLogStatement("  │   ", "Custom log message", options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().logStatements,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c📝 Custom log message",
        "color: #333; font-weight: bold;"
      );
    });
  });

  describe("logReconciled", () => {
    it("should log reconciled component with colors and icon", () => {
      logReconciled("  │   ", "[Component] Reconciled", options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().reconciled,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c[Component] Reconciled ♻️",
        "color: #333; font-weight: bold;"
      );
    });
  });

  describe("logSkipped", () => {
    it("should log skipped component with colors and icon", () => {
      logSkipped("  │   ", "[Component] Skipped", options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().skipped,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c[Component] Skipped ⏭️",
        "color: #333; font-weight: bold;"
      );
    });
  });

  describe("logStyled", () => {
    it("should use logDefinitive when isDefinitive is true", () => {
      logStyled("  │   ", "[Component] Rendering", true, options);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().definitiveRender,
        options.themeManager
      );
      expect(mockSafeLog).toHaveBeenCalledWith(
        "  │   %c[Component] Rendering ⚡",
        "color: #333; font-weight: bold;"
      );
    });

    it("should use plain logging when isDefinitive is false", () => {
      logStyled("  │   ", "[Component] Plain", false, options);

      expect(mockSafeLog).toHaveBeenCalledWith("  │   [Component] Plain");
      expect(mockGetThemeOptions).not.toHaveBeenCalled();
      expect(mockBuildStyle).not.toHaveBeenCalled();
    });
  });

  describe("color options handling", () => {
    it("should handle undefined color options", () => {
      const undefinedColorOptions = {
        ...options,
        getColors: () => {
          return {
            definitiveRender: undefined,
          };
        },
      };

      logDefinitive("  │   ", "Test", undefinedColorOptions);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(undefined, options.themeManager);
    });

    it("should handle empty color options", () => {
      const emptyColorOptions = {
        ...options,
        getColors: () => {
          return {};
        },
      };

      logDefinitive("  │   ", "Test", emptyColorOptions);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(undefined, options.themeManager);
    });
  });

  describe("dependency injection", () => {
    it("should use injected theme manager", () => {
      const customThemeManager = {
        isDarkMode: () => {
          return true;
        }
      };
      const customOptions = {
        ...options,
        themeManager: customThemeManager,
      };

      logDefinitive("  │   ", "Test", customOptions);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        options.getColors().definitiveRender,
        customThemeManager
      );
    });

    it("should use injected color provider", () => {
      const customColors = {
        definitiveRender: { icon: "🔥", lightMode: { text: "#ff0000" } },
      };
      const customOptions = {
        ...options,
        getColors: () => {
          return customColors;
        },
      };

      logDefinitive("  │   ", "Test", customOptions);

      expect(mockGetThemeOptions).toHaveBeenCalledWith(
        customColors.definitiveRender,
        options.themeManager
      );
    });
  });
});
