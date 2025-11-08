import { describe, expect, it } from "vitest";
import { deepMergeOptions } from "@src/lib/functions/deepMerge.js";
import type { AutoTracerOptions } from "@src/lib/interfaces/AutoTracerOptions.js";

describe("deepMergeOptions", () => {
  const defaultOptions: AutoTracerOptions = {
    includeReconciled: false,
    includeSkipped: false,
    showFlags: false,
    enabled: true,
    enableAutoTracerInternalsLogging: false,
    maxFiberDepth: 10,
    skipNonTrackedBranches: true,
    skippedObjectProps: [],
    colors: {
      definitiveRender: {
        lightMode: {
          background: "#E3F2FD",
          text: "#2196F3",
          bold: true,
        },
      },
      propChange: {
        lightMode: {
          background: "#FFF3E0",
          text: "#FF9800",
        },
      },
      stateChange: {
        lightMode: {
          background: "#E8F5E8",
          text: "#4CAF50",
        },
      },
    },
  };

  describe("shallow properties", () => {
    it("should merge shallow boolean properties", () => {
      const result = deepMergeOptions(defaultOptions, {
        includeReconciled: true,
        includeSkipped: true,
      });

      expect(result.includeReconciled).toBe(true);
      expect(result.includeSkipped).toBe(true);
      expect(result.showFlags).toBe(false); // unchanged
    });

    it("should merge shallow numeric properties", () => {
      const result = deepMergeOptions(defaultOptions, {
        maxFiberDepth: 20,
      });

      expect(result.maxFiberDepth).toBe(20);
    });

    it("should merge array properties", () => {
      const skippedProps = [{ objectName: "Component", propNames: ["test"] }];
      const result = deepMergeOptions(defaultOptions, {
        skippedObjectProps: skippedProps,
      });

      expect(result.skippedObjectProps).toBe(skippedProps);
    });

    it("should preserve unchanged properties", () => {
      const result = deepMergeOptions(defaultOptions, {
        enabled: false,
      });

      expect(result.enabled).toBe(false);
      expect(result.includeReconciled).toBe(defaultOptions.includeReconciled);
      expect(result.maxFiberDepth).toBe(defaultOptions.maxFiberDepth);
    });
  });

  describe("nested colors object", () => {
    it("should merge partial color configurations", () => {
      const result = deepMergeOptions(defaultOptions, {
        colors: {
          definitiveRender: {
            lightMode: {
              text: "#FF0000",
            },
          },
        },
      });

      expect(result.colors?.definitiveRender?.lightMode?.text).toBe("#FF0000");
      expect(result.colors?.definitiveRender?.lightMode?.background).toBe(
        "#E3F2FD"
      ); // preserved
      expect(result.colors?.propChange?.lightMode?.text).toBe("#FF9800"); // unchanged
    });

    it("should merge complete color configurations", () => {
      const newColors = {
        definitiveRender: {
          lightMode: {
            text: "#FF0000",
            background: "#FFEEEE",
            bold: true,
          },
        },
        propChange: {
          lightMode: {
            text: "#00FF00",
            background: "#EEFFEE",
          },
        },
      };

      const result = deepMergeOptions(defaultOptions, {
        colors: newColors,
      });

      expect(result.colors?.definitiveRender?.lightMode).toEqual(
        newColors.definitiveRender.lightMode
      );
      expect(result.colors?.propChange?.lightMode).toEqual(
        newColors.propChange.lightMode
      );
      expect(result.colors?.stateChange?.lightMode).toEqual(
        defaultOptions.colors?.stateChange?.lightMode
      ); // preserved
    });

    it("should handle missing nested color properties", () => {
      const optionsWithoutColors: AutoTracerOptions = {
        ...defaultOptions,
        colors: undefined,
      };

      const result = deepMergeOptions(optionsWithoutColors, {
        colors: {
          definitiveRender: {
            lightMode: {
              text: "#FF0000",
            },
          },
        },
      });

      expect(result.colors?.definitiveRender?.lightMode?.text).toBe("#FF0000");
    });

    it("should preserve all nested color configurations when merging", () => {
      const customColors = {
        definitiveRender: {
          lightMode: {
            text: "#CUSTOM1",
            background: "#CUSTOMBG1",
          },
        },
        propChange: {
          lightMode: {
            text: "#CUSTOM2",
            background: "#CUSTOMBG2",
          },
        },
        stateChange: {
          lightMode: {
            text: "#CUSTOM3",
            background: "#CUSTOMBG3",
          },
        },
      };

      const optionsWithCustomColors: AutoTracerOptions = {
        ...defaultOptions,
        colors: customColors,
      };

      const result = deepMergeOptions(optionsWithCustomColors, {
        colors: {
          definitiveRender: {
            lightMode: {
              text: "#UPDATED",
            },
          },
        },
      });

      expect(result.colors?.definitiveRender?.lightMode?.text).toBe("#UPDATED");
      expect(result.colors?.definitiveRender?.lightMode?.background).toBe(
        "#CUSTOMBG1"
      );
      expect(result.colors?.propChange?.lightMode).toEqual(
        customColors.propChange.lightMode
      );
      expect(result.colors?.stateChange?.lightMode).toEqual(
        customColors.stateChange.lightMode
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty source object", () => {
      const result = deepMergeOptions(defaultOptions, {});

      expect(result).toEqual(defaultOptions);
      expect(result).not.toBe(defaultOptions); // should be a new object
    });

    it("should handle undefined values in source", () => {
      const result = deepMergeOptions(defaultOptions, {
        enabled: undefined,
        maxFiberDepth: 15,
        colors: undefined,
      });

      expect(result.enabled).toBe(defaultOptions.enabled); // unchanged
      expect(result.maxFiberDepth).toBe(15);
      expect(result.colors).toEqual(defaultOptions.colors); // unchanged
    });

    it("should create a new object reference", () => {
      const result = deepMergeOptions(defaultOptions, {
        enabled: true,
        colors: {
          definitiveRender: {
            lightMode: {
              text: "#000000",
            },
          },
        },
      });

      expect(result).not.toBe(defaultOptions);
      expect(result.colors).not.toBe(defaultOptions.colors);
    });

    it("should handle falsy values correctly", () => {
      const result = deepMergeOptions(defaultOptions, {
        enabled: false,
        includeReconciled: false,
        maxFiberDepth: 0,
      });

      expect(result.enabled).toBe(false);
      expect(result.includeReconciled).toBe(false);
      expect(result.maxFiberDepth).toBe(0);
    });
  });
});
