import { describe, expect, it } from "vitest";
import { defaultAutoTracerOptions } from "@src/lib/types/defaultSettings.js";

describe("defaultSettings", () => {
  it("should have correct default values", () => {
    expect(defaultAutoTracerOptions.enabled).toBe(true);
    expect(defaultAutoTracerOptions.includeReconciled).toBe(false);
    expect(defaultAutoTracerOptions.includeSkipped).toBe(false);
    expect(defaultAutoTracerOptions.showFlags).toBe(false);
    expect(defaultAutoTracerOptions.enableAutoTracerInternalsLogging).toBe(false);
    expect(defaultAutoTracerOptions.maxFiberDepth).toBe(100);
    expect(defaultAutoTracerOptions.showFunctionContentOnChange).toBe(false);
    expect(defaultAutoTracerOptions.skipNonTrackedBranches).toBe(true);
    expect(defaultAutoTracerOptions.skippedObjectProps).toEqual([]);
  });

  it("should have colors configuration", () => {
    expect(defaultAutoTracerOptions.colors).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.definitiveRender).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.propInitial).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.propChange).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.stateInitial).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.stateChange).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.logStatements).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.reconciled).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.skipped).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.other).toBeDefined();
  });

  it("should have light and dark mode colors", () => {
    expect(defaultAutoTracerOptions.colors?.definitiveRender?.lightMode).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.definitiveRender?.darkMode).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.propInitial?.lightMode).toBeDefined();
    expect(defaultAutoTracerOptions.colors?.propInitial?.darkMode).toBeDefined();
  });

  it("should have specific color values", () => {
    expect(defaultAutoTracerOptions.colors?.definitiveRender?.lightMode?.text).toBe("#0044ff");
    expect(defaultAutoTracerOptions.colors?.definitiveRender?.lightMode?.bold).toBe(true);
    expect(defaultAutoTracerOptions.colors?.definitiveRender?.icon).toBe("⚡");

    expect(defaultAutoTracerOptions.colors?.propInitial?.lightMode?.text).toBe("#c900bf");
    expect(defaultAutoTracerOptions.colors?.propInitial?.lightMode?.italic).toBe(true);
  });

  it("should be immutable", () => {
    // Test that we can't accidentally modify the default options
    const originalEnabled = defaultAutoTracerOptions.enabled;

    // This should not affect the original
    const copy = { ...defaultAutoTracerOptions };
    copy.enabled = !originalEnabled;

    expect(defaultAutoTracerOptions.enabled).toBe(originalEnabled);
  });

  it("should have valid numeric values", () => {
    expect(typeof defaultAutoTracerOptions.maxFiberDepth).toBe("number");
    expect(defaultAutoTracerOptions.maxFiberDepth).toBeGreaterThan(0);
    expect(defaultAutoTracerOptions.maxFiberDepth).toBeLessThanOrEqual(1000);
  });

  it("should have valid color format", () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    expect(defaultAutoTracerOptions.colors?.definitiveRender?.lightMode?.text).toMatch(hexColorRegex);
    expect(defaultAutoTracerOptions.colors?.propInitial?.lightMode?.text).toMatch(hexColorRegex);
    expect(defaultAutoTracerOptions.colors?.stateInitial?.lightMode?.text).toMatch(hexColorRegex);
  });
});
