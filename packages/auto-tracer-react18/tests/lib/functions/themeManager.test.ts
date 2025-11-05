import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ThemeManagerOptions,
  buildStyle,
  detectDarkMode,
  getThemeOptions,
} from "@src/lib/functions/themeManager.js";
import type { ColorOptions, ThemeOptions } from "@src/lib/interfaces/AutoTracerOptions.js";

describe("themeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getThemeOptions", () => {
    it("should return empty object when colorOptions is undefined", () => {
      const options: ThemeManagerOptions = {
        isDarkMode: () => {
          return false;
        },
      };

      const result = getThemeOptions(undefined, options);
      expect(result).toEqual({});
    });

    it("should return light mode theme when isDarkMode returns false", () => {
      const colorOptions: ColorOptions = {
        lightMode: { text: "black", background: "white" },
        darkMode: { text: "white", background: "black" },
      };
      const options: ThemeManagerOptions = {
        isDarkMode: () => {
          return false;
        },
      };

      const result = getThemeOptions(colorOptions, options);
      expect(result).toEqual({ text: "black", background: "white" });
    });

    it("should return dark mode theme when isDarkMode returns true", () => {
      const colorOptions: ColorOptions = {
        lightMode: { text: "black", background: "white" },
        darkMode: { text: "white", background: "black" },
      };
      const options: ThemeManagerOptions = {
        isDarkMode: () => {
          return true;
        },
      };

      const result = getThemeOptions(colorOptions, options);
      expect(result).toEqual({ text: "white", background: "black" });
    });

    it("should handle missing lightMode", () => {
      const colorOptions: ColorOptions = {
        darkMode: { text: "white", background: "black" },
      };
      const options: ThemeManagerOptions = {
        isDarkMode: () => {
          return false;
        },
      };

      const result = getThemeOptions(colorOptions, options);
      expect(result).toEqual({});
    });

    it("should handle missing darkMode", () => {
      const colorOptions: ColorOptions = {
        lightMode: { text: "black", background: "white" },
      };
      const options: ThemeManagerOptions = {
        isDarkMode: () => {
          return true;
        },
      };

      const result = getThemeOptions(colorOptions, options);
      expect(result).toEqual({});
    });
  });

  describe("buildStyle", () => {
    it("should build empty string for empty theme options", () => {
      const result = buildStyle({});
      expect(result).toBe("");
    });

    it("should build style with text color", () => {
      const themeOptions: ThemeOptions = { text: "red" };
      const result = buildStyle(themeOptions);
      expect(result).toBe("color: red");
    });

    it("should build style with background color", () => {
      const themeOptions: ThemeOptions = { background: "blue" };
      const result = buildStyle(themeOptions);
      expect(result).toBe("background: blue");
    });

    it("should build style with bold flag", () => {
      const themeOptions: ThemeOptions = { bold: true };
      const result = buildStyle(themeOptions);
      expect(result).toBe("font-weight: bold");
    });

    it("should build style with italic flag", () => {
      const themeOptions: ThemeOptions = { italic: true };
      const result = buildStyle(themeOptions);
      expect(result).toBe("font-style: italic");
    });

    it("should ignore false boolean flags", () => {
      const themeOptions: ThemeOptions = { bold: false, italic: false };
      const result = buildStyle(themeOptions);
      expect(result).toBe("");
    });

    it("should build complete style with all properties", () => {
      const themeOptions: ThemeOptions = {
        text: "red",
        background: "blue",
        bold: true,
        italic: true,
      };
      const result = buildStyle(themeOptions);
      expect(result).toBe("color: red; background: blue; font-weight: bold; font-style: italic");
    });

    it("should handle mixed properties", () => {
      const themeOptions: ThemeOptions = {
        text: "green",
        bold: false,
        italic: true,
      };
      const result = buildStyle(themeOptions);
      expect(result).toBe("color: green; font-style: italic");
    });
  });

  describe("detectDarkMode", () => {
    beforeEach(() => {
      // Reset global mocks
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });
    });

    it("should return false when window is undefined", () => {
      const result = detectDarkMode();
      expect(result).toBe(false);
    });

    it("should return false when matchMedia is not available", () => {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
      });

      const result = detectDarkMode();
      expect(result).toBe(false);
    });

    it("should return true when prefers-color-scheme is dark", () => {
      const mockMatchMedia = vi.fn();
      mockMatchMedia.mockReturnValue({ matches: true });

      Object.defineProperty(globalThis, "window", {
        value: { matchMedia: mockMatchMedia },
        writable: true,
      });

      const result = detectDarkMode();
      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("should return false when prefers-color-scheme is light", () => {
      const mockMatchMedia = vi.fn();
      mockMatchMedia.mockReturnValue({ matches: false });

      Object.defineProperty(globalThis, "window", {
        value: { matchMedia: mockMatchMedia },
        writable: true,
      });

      const result = detectDarkMode();
      expect(result).toBe(false);
      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });
  });
});
