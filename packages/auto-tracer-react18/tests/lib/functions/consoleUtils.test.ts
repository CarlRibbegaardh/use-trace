/**
 * Tests for consoleUtils.ts
 * Tests safe console wrapper utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  safeError,
  safeGroup,
  safeGroupEnd,
  safeLog,
  safeWarn,
} from "../../../src/lib/functions/consoleUtils.js";

describe("consoleUtils", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.restoreAllMocks();
  });

  describe("safeLog", () => {
    it("should call console.log when console is available", () => {
      const mockLog = vi.spyOn(console, "log").mockImplementation(() => {});

      safeLog("test message", 123);

      expect(mockLog).toHaveBeenCalledWith("test message", 123);
    });

    it("should handle console being undefined", () => {
      const originalConsole = globalThis.console;
      // @ts-expect-error - Testing edge case where console is undefined
      globalThis.console = undefined;

      expect(() => {
        safeLog("test");
      }).not.toThrow();

      globalThis.console = originalConsole;
    });

    it("should handle console.log being undefined", () => {
      const originalLog = console.log;
      // @ts-expect-error - Testing edge case where console.log is undefined
      console.log = undefined;

      expect(() => {
        safeLog("test");
      }).not.toThrow();

      console.log = originalLog;
    });

    it("should handle console.log throwing an error", () => {
      const mockLog = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Console error");
      });

      expect(() => {
        safeLog("test");
      }).not.toThrow();

      expect(mockLog).toHaveBeenCalled();
    });

    it("should handle multiple arguments", () => {
      const mockLog = vi.spyOn(console, "log").mockImplementation(() => {});

      safeLog("message", { key: "value" }, [1, 2, 3], null, undefined);

      expect(mockLog).toHaveBeenCalledWith(
        "message",
        { key: "value" },
        [1, 2, 3],
        null,
        undefined
      );
    });
  });

  describe("safeGroup", () => {
    it("should call console.group when console is available", () => {
      const mockGroup = vi.spyOn(console, "group").mockImplementation(() => {});

      safeGroup("group title");

      expect(mockGroup).toHaveBeenCalledWith("group title");
    });

    it("should handle console being undefined", () => {
      const originalConsole = globalThis.console;
      // @ts-expect-error - Testing edge case where console is undefined
      globalThis.console = undefined;

      expect(() => {
        safeGroup("test");
      }).not.toThrow();

      globalThis.console = originalConsole;
    });

    it("should handle console.group being undefined", () => {
      const originalGroup = console.group;
      // @ts-expect-error - Testing edge case where console.group is undefined
      console.group = undefined;

      expect(() => {
        safeGroup("test");
      }).not.toThrow();

      console.group = originalGroup;
    });

    it("should handle console.group throwing an error", () => {
      const mockGroup = vi.spyOn(console, "group").mockImplementation(() => {
        throw new Error("Console error");
      });

      expect(() => {
        safeGroup("test");
      }).not.toThrow();

      expect(mockGroup).toHaveBeenCalled();
    });
  });

  describe("safeGroupEnd", () => {
    it("should call console.groupEnd when console is available", () => {
      const mockGroupEnd = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

      safeGroupEnd();

      expect(mockGroupEnd).toHaveBeenCalled();
    });

    it("should handle console being undefined", () => {
      const originalConsole = globalThis.console;
      // @ts-expect-error - Testing edge case where console is undefined
      globalThis.console = undefined;

      expect(() => {
        safeGroupEnd();
      }).not.toThrow();

      globalThis.console = originalConsole;
    });

    it("should handle console.groupEnd being undefined", () => {
      const originalGroupEnd = console.groupEnd;
      // @ts-expect-error - Testing edge case where console.groupEnd is undefined
      console.groupEnd = undefined;

      expect(() => {
        safeGroupEnd();
      }).not.toThrow();

      console.groupEnd = originalGroupEnd;
    });

    it("should handle console.groupEnd throwing an error", () => {
      const mockGroupEnd = vi.spyOn(console, "groupEnd").mockImplementation(() => {
        throw new Error("Console error");
      });

      expect(() => {
        safeGroupEnd();
      }).not.toThrow();

      expect(mockGroupEnd).toHaveBeenCalled();
    });
  });

  describe("safeWarn", () => {
    it("should call console.warn when console is available", () => {
      const mockWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

      safeWarn("warning message", { details: "info" });

      expect(mockWarn).toHaveBeenCalledWith("warning message", { details: "info" });
    });

    it("should handle console being undefined", () => {
      const originalConsole = globalThis.console;
      // @ts-expect-error - Testing edge case where console is undefined
      globalThis.console = undefined;

      expect(() => {
        safeWarn("test");
      }).not.toThrow();

      globalThis.console = originalConsole;
    });

    it("should handle console.warn being undefined", () => {
      const originalWarn = console.warn;
      // @ts-expect-error - Testing edge case where console.warn is undefined
      console.warn = undefined;

      expect(() => {
        safeWarn("test");
      }).not.toThrow();

      console.warn = originalWarn;
    });

    it("should handle console.warn throwing an error", () => {
      const mockWarn = vi.spyOn(console, "warn").mockImplementation(() => {
        throw new Error("Console error");
      });

      expect(() => {
        safeWarn("test");
      }).not.toThrow();

      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("safeError", () => {
    it("should call console.error when console is available", () => {
      const mockError = vi.spyOn(console, "error").mockImplementation(() => {});

      safeError("error message", new Error("test error"));

      expect(mockError).toHaveBeenCalledWith("error message", new Error("test error"));
    });

    it("should handle console being undefined", () => {
      const originalConsole = globalThis.console;
      // @ts-expect-error - Testing edge case where console is undefined
      globalThis.console = undefined;

      expect(() => {
        safeError("test");
      }).not.toThrow();

      globalThis.console = originalConsole;
    });

    it("should handle console.error being undefined", () => {
      const originalError = console.error;
      // @ts-expect-error - Testing edge case where console.error is undefined
      console.error = undefined;

      expect(() => {
        safeError("test");
      }).not.toThrow();

      console.error = originalError;
    });

    it("should handle console.error throwing an error", () => {
      const mockError = vi.spyOn(console, "error").mockImplementation(() => {
        throw new Error("Console error");
      });

      expect(() => {
        safeError("test");
      }).not.toThrow();

      expect(mockError).toHaveBeenCalled();
    });
  });
});
