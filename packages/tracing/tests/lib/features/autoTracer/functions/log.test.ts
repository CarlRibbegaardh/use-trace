import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock global state for theme detection
vi.mock("@src/lib/features/autoTracer/types/globalState.js", () => {
  return {
    isDarkMode: vi.fn(() => {
      return false;
    }),
    traceOptions: {
      colors: {
        definitiveRender: {
          icon: "⚡",
          lightMode: { text: "#0044ff", bold: true },
          darkMode: { text: "#4fd6ff", bold: true },
        },
        propChange: {
          icon: undefined,
          lightMode: { text: "#c900bf" },
          darkMode: { text: "#ff77e8" },
        },
        propInitial: {
          icon: undefined,
          lightMode: { text: "#c900bf", italic: true },
          darkMode: { text: "#ff77e8", italic: true },
        },
        stateChange: {
          icon: undefined,
          lightMode: { text: "#df7f02" },
          darkMode: { text: "#ffcf33" },
        },
        stateInitial: {
          icon: undefined,
          lightMode: { text: "#df7f02", italic: true },
          darkMode: { text: "#ffcf33", italic: true },
        },
        logStatements: {
          icon: undefined,
          lightMode: { text: "#00aa00" },
          darkMode: { text: "#4ade80" },
        },
        reconciled: {
          icon: undefined,
          lightMode: { text: "#9ca3af" },
          darkMode: { text: "#9ca3af" },
        },
        skipped: {
          icon: undefined,
          lightMode: { text: "#8e8e8e" },
          darkMode: { text: "#9ca3af" },
        },
      },
    },
  };
});

describe("log functions", () => {
  let mockConsole: {
    log: ReturnType<typeof vi.fn>;
    group: ReturnType<typeof vi.fn>;
    groupEnd: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock console methods
    mockConsole = {
      log: vi.fn(),
      group: vi.fn(),
      groupEnd: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Spy on actual console methods
    vi.spyOn(console, "log").mockImplementation(mockConsole.log);
    vi.spyOn(console, "group").mockImplementation(mockConsole.group);
    vi.spyOn(console, "groupEnd").mockImplementation(mockConsole.groupEnd);
    vi.spyOn(console, "warn").mockImplementation(mockConsole.warn);
    vi.spyOn(console, "error").mockImplementation(mockConsole.error);

    // Reset isDarkMode mock
    const { isDarkMode } = vi.mocked(
      await import("@src/lib/features/autoTracer/types/globalState.js")
    );
    isDarkMode.mockReturnValue(false);
  });

  describe("log", () => {
    it("should call console.log with arguments", async () => {
      const { log } = await import("@src/lib/features/autoTracer/functions/log.js");

      log("test", "message", { data: "value" });

      expect(mockConsole.log).toHaveBeenCalledWith("test", "message", { data: "value" });
    });

    it("should handle no arguments", async () => {
      const { log } = await import("@src/lib/features/autoTracer/functions/log.js");

      log();

      expect(mockConsole.log).toHaveBeenCalledWith();
    });

    it("should handle console being undefined", async () => {
      const { log } = await import("@src/lib/features/autoTracer/functions/log.js");

      const originalConsole = globalThis.console;
      // @ts-expect-error - intentionally setting to undefined for testing
      globalThis.console = undefined;

      expect(() => {
        log("test message");
      }).not.toThrow();

      globalThis.console = originalConsole;
    });

    it("should handle console.log being undefined", async () => {
      const { log } = await import("@src/lib/features/autoTracer/functions/log.js");

      const originalLog = console.log;
      // @ts-expect-error - intentionally setting to undefined for testing
      console.log = undefined;

      expect(() => {
        log("test message");
      }).not.toThrow();

      console.log = originalLog;
    });

    it("should handle console.log throwing error", async () => {
      const { log } = await import("@src/lib/features/autoTracer/functions/log.js");

      vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Console error");
      });

      expect(() => {
        log("test message");
      }).not.toThrow();
    });
  });

  describe("logGroup", () => {
    it("should call console.group with arguments", async () => {
      const { logGroup } = await import("@src/lib/features/autoTracer/functions/log.js");

      logGroup("Group title", "extra");

      expect(mockConsole.group).toHaveBeenCalledWith("Group title", "extra");
    });

    it("should handle console.group being undefined", async () => {
      const { logGroup } = await import("@src/lib/features/autoTracer/functions/log.js");

      const originalGroup = console.group;
      // @ts-expect-error - intentionally setting to undefined for testing
      console.group = undefined;

      expect(() => {
        logGroup("test");
      }).not.toThrow();

      console.group = originalGroup;
    });

    it("should handle console.group throwing error", async () => {
      const { logGroup } = await import("@src/lib/features/autoTracer/functions/log.js");

      vi.spyOn(console, "group").mockImplementation(() => {
        throw new Error("Group error");
      });

      expect(() => {
        logGroup("test");
      }).not.toThrow();
    });
  });

  describe("logGroupEnd", () => {
    it("should call console.groupEnd", async () => {
      const { logGroupEnd } = await import("@src/lib/features/autoTracer/functions/log.js");

      logGroupEnd();

      expect(mockConsole.groupEnd).toHaveBeenCalledWith();
    });

    it("should handle console.groupEnd being undefined", async () => {
      const { logGroupEnd } = await import("@src/lib/features/autoTracer/functions/log.js");

      const originalGroupEnd = console.groupEnd;
      // @ts-expect-error - intentionally setting to undefined for testing
      console.groupEnd = undefined;

      expect(() => {
        logGroupEnd();
      }).not.toThrow();

      console.groupEnd = originalGroupEnd;
    });

    it("should handle console.groupEnd throwing error", async () => {
      const { logGroupEnd } = await import("@src/lib/features/autoTracer/functions/log.js");

      vi.spyOn(console, "groupEnd").mockImplementation(() => {
        throw new Error("GroupEnd error");
      });

      expect(() => {
        logGroupEnd();
      }).not.toThrow();
    });
  });

  describe("logWarn", () => {
    it("should call console.warn with arguments", async () => {
      const { logWarn } = await import("@src/lib/features/autoTracer/functions/log.js");

      logWarn("warning", "message");

      expect(mockConsole.warn).toHaveBeenCalledWith("warning", "message");
    });

    it("should handle console.warn being undefined", async () => {
      const { logWarn } = await import("@src/lib/features/autoTracer/functions/log.js");

      const originalWarn = console.warn;
      // @ts-expect-error - intentionally setting to undefined for testing
      console.warn = undefined;

      expect(() => {
        logWarn("warning message");
      }).not.toThrow();

      console.warn = originalWarn;
    });

    it("should handle console.warn throwing error", async () => {
      const { logWarn } = await import("@src/lib/features/autoTracer/functions/log.js");

      vi.spyOn(console, "warn").mockImplementation(() => {
        throw new Error("Console warn error");
      });

      expect(() => {
        logWarn("warning message");
      }).not.toThrow();
    });
  });

  describe("logError", () => {
    it("should call console.error with arguments", async () => {
      const { logError } = await import("@src/lib/features/autoTracer/functions/log.js");

      logError("Error message", new Error("test"));

      expect(mockConsole.error).toHaveBeenCalledWith("Error message", expect.any(Error));
    });

    it("should handle console.error being undefined", async () => {
      const { logError } = await import("@src/lib/features/autoTracer/functions/log.js");

      const originalError = console.error;
      // @ts-expect-error - intentionally setting to undefined for testing
      console.error = undefined;

      expect(() => {
        logError("error message");
      }).not.toThrow();

      console.error = originalError;
    });

    it("should handle console.error throwing error", async () => {
      const { logError } = await import("@src/lib/features/autoTracer/functions/log.js");

      vi.spyOn(console, "error").mockImplementation(() => {
        throw new Error("Console error error");
      });

      expect(() => {
        logError("error message");
      }).not.toThrow();
    });
  });

  describe("theme handling", () => {
    it("should use light mode colors when isDarkMode returns false", async () => {
      const { isDarkMode } = vi.mocked(
        await import("@src/lib/features/autoTracer/types/globalState.js")
      );
      const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

      isDarkMode.mockReturnValue(false);

      logDefinitive("prefix", "message");

      expect(mockConsole.log).toHaveBeenCalledWith(
        "prefix%cmessage ⚡",
        "color: #0044ff; font-weight: bold"
      );
    });

    it("should use dark mode colors when isDarkMode returns true", async () => {
      const { isDarkMode } = vi.mocked(
        await import("@src/lib/features/autoTracer/types/globalState.js")
      );
      const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

      isDarkMode.mockReturnValue(true);

      logDefinitive("prefix", "message");

      expect(mockConsole.log).toHaveBeenCalledWith(
        "prefix%cmessage ⚡",
        "color: #4fd6ff; font-weight: bold"
      );
    });

    it("should handle missing color options gracefully", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/features/autoTracer/types/globalState.js")
      );
      const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

      // Remove color options
      traceOptions.colors = {};

      logDefinitive("prefix", "message");

      expect(mockConsole.log).toHaveBeenCalledWith(
        "prefix%cmessage",
        ""
      );
    });
  });

  describe("styled logging functions", () => {
    describe("logDefinitive", () => {
      it("should log with definitive render styling", async () => {
        const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

        logDefinitive("  │   ", "[Component] Rendering");

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %c[Component] Rendering",
          ""
        );
      });

      it("should handle missing icon", async () => {
        const { traceOptions } = vi.mocked(
          await import("@src/lib/features/autoTracer/types/globalState.js")
        );
        const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

        traceOptions.colors = {
          definitiveRender: {
            lightMode: { text: "#00ff00" },
          },
        };

        logDefinitive("prefix", "message");

        expect(mockConsole.log).toHaveBeenCalledWith(
          "prefix%cmessage",
          "color: #00ff00"
        );
      });
    });

    describe("logPropChange", () => {
      it("should log prop changes with correct styling", async () => {
        const { logPropChange } = await import("@src/lib/features/autoTracer/functions/log.js");

        logPropChange("  │   ", "prop: old → new", false);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %cprop: old → new",
          ""
        );
      });

      it("should log initial props with different styling", async () => {
        const { logPropChange } = await import("@src/lib/features/autoTracer/functions/log.js");

        logPropChange("  │   ", "Initial prop: value", true);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %cInitial prop: value",
          ""
        );
      });

      it("should default to non-initial styling", async () => {
        const { logPropChange } = await import("@src/lib/features/autoTracer/functions/log.js");

        logPropChange("prefix", "message");

        expect(mockConsole.log).toHaveBeenCalledWith(
          "prefix%cmessage",
          ""
        );
      });
    });

    describe("logStateChange", () => {
      it("should log state changes with correct styling", async () => {
        const { logStateChange } = await import("@src/lib/features/autoTracer/functions/log.js");

        logStateChange("  │   ", "state: 1 → 2", false);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %cstate: 1 → 2",
          ""
        );
      });

      it("should log initial state with different styling", async () => {
        const { logStateChange } = await import("@src/lib/features/autoTracer/functions/log.js");

        logStateChange("  │   ", "Initial state: value", true);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %cInitial state: value",
          ""
        );
      });
    });

    describe("logLogStatement", () => {
      it("should log statements with correct styling", async () => {
        const { logLogStatement } = await import("@src/lib/features/autoTracer/functions/log.js");

        logLogStatement("  │   ", "Custom log message");

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %cCustom log message",
          ""
        );
      });
    });

    describe("logReconciled", () => {
      it("should log reconciled components with correct styling", async () => {
        const { logReconciled } = await import("@src/lib/features/autoTracer/functions/log.js");

        logReconciled("  │   ", "[Component] Reconciled");

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %c[Component] Reconciled",
          ""
        );
      });
    });

    describe("logSkipped", () => {
      it("should log skipped components with correct styling", async () => {
        const { logSkipped } = await import("@src/lib/features/autoTracer/functions/log.js");

        logSkipped("  │   ", "[Component] Skipped");

        expect(mockConsole.log).toHaveBeenCalledWith(
          "  │   %c[Component] Skipped",
          ""
        );
      });
    });

    describe("logStyled", () => {
      it("should use logDefinitive when isDefinitive is true", async () => {
        const { logStyled } = await import("@src/lib/features/autoTracer/functions/log.js");

        logStyled("prefix", "message", true);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "prefix%cmessage",
          "color: #00ff00"
        );
      });

      it("should use regular log when isDefinitive is false", async () => {
        const { logStyled } = await import("@src/lib/features/autoTracer/functions/log.js");

        logStyled("prefix", "message", false);

        expect(mockConsole.log).toHaveBeenCalledWith("prefixmessage");
      });

      it("should default to regular log when isDefinitive is not provided", async () => {
        const { logStyled } = await import("@src/lib/features/autoTracer/functions/log.js");

        logStyled("prefix", "message");

        expect(mockConsole.log).toHaveBeenCalledWith("prefixmessage");
      });
    });
  });

  describe("style building edge cases", () => {
    it("should build complete style string with all properties", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/features/autoTracer/types/globalState.js")
      );
      const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

      traceOptions.colors = {
        definitiveRender: {
          lightMode: {
            text: "#ff0000",
            background: "#f0f0f0",
            bold: true,
            italic: true,
          },
        },
      };

      logDefinitive("prefix", "message");

      expect(mockConsole.log).toHaveBeenCalledWith(
        "prefix%cmessage",
        "color: #ff0000; background: #f0f0f0; font-weight: bold; font-style: italic"
      );
    });

    it("should handle missing theme mode gracefully", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/features/autoTracer/types/globalState.js")
      );
      const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

      traceOptions.colors = {
        definitiveRender: {
          icon: "⚡",
          darkMode: { text: "#00aa00" },
        },
      };

      logDefinitive("prefix", "message");

      expect(mockConsole.log).toHaveBeenCalledWith(
        "prefix%cmessage ⚡",
        ""
      );
    });

    it("should handle boolean flags correctly", async () => {
      const { traceOptions } = vi.mocked(
        await import("@src/lib/features/autoTracer/types/globalState.js")
      );
      const { logDefinitive } = await import("@src/lib/features/autoTracer/functions/log.js");

      traceOptions.colors = {
        definitiveRender: {
          lightMode: {
            bold: true,
            italic: false, // Should not add italic
          },
        },
      };

      logDefinitive("prefix", "message");

      expect(mockConsole.log).toHaveBeenCalledWith(
        "prefix%cmessage",
        "font-weight: bold"
      );
    });
  });
});
