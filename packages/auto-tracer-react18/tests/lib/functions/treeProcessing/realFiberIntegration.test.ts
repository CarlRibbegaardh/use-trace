import { beforeEach, describe, expect, it } from "vitest";
import { detectUpdatedComponents } from "../../../../src/lib/functions/detectUpdatedComponents.js";
import { traceOptions } from "../../../../src/lib/types/globalState.js";
import type { AutoTracerOptions } from "../../../../src/lib/interfaces/AutoTracerOptions.js";
import { parse } from "flatted";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Integration tests using REAL fiber fixtures.
 *
 * These tests verify the complete pipeline works with actual React fiber structures.
 */

/**
 * Captures console.log calls during test execution
 */
function captureConsoleLogs(fn: () => void): string[] {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalGroup = console.group;
  const originalGroupEnd = console.groupEnd;

  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(" "));
  };
  console.group = (...args: unknown[]) => {
    logs.push(`[GROUP] ${args.map((arg) => String(arg)).join(" ")}`);
  };
  console.groupEnd = () => {
    logs.push("[GROUP_END]");
  };

  try {
    fn();
  } finally {
    console.log = originalLog;
    console.group = originalGroup;
    console.groupEnd = originalGroupEnd;
  }

  return logs;
}

describe("filterEmptyNodes - Real Fiber Integration", () => {
  // Load real fiber fixture
  const loadFiberFixture = () => {
    const fixtureData = fs.readFileSync(
      path.join(
        __dirname,
        "../../../fixtures/todoListFiberWithDispatch.fixture.flatted"
      ),
      "utf8"
    );
    return parse(fixtureData);
  };

  beforeEach(() => {
    // Reset to default settings
    Object.assign(traceOptions, {
      filterEmptyNodes: "none",
      includeReconciled: "never" as const,
      includeSkipped: "never" as const,
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: true,
    } satisfies Partial<AutoTracerOptions>);
  });

  it("should process real fiber with filterEmptyNodes: none", () => {
    const fiber = loadFiberFixture();
    traceOptions.filterEmptyNodes = "none";

    const logs = captureConsoleLogs(() => {
      detectUpdatedComponents({ current: fiber });
    });

    // Verify we got output
    expect(logs.length).toBeGreaterThan(2); // At least GROUP, content, GROUP_END

    const output = logs.join("\n");
    console.log("\n=== OUTPUT (none) ===\n" + output);

    // Should have component render cycle group
    expect(output).toContain("Component render cycle");

    // Should have at least one component (the TodoList itself)
    expect(output).toMatch(/\[.*\]/); // Component name in brackets
  });

  it("should process real fiber with filterEmptyNodes: first", () => {
    const fiber = loadFiberFixture();
    traceOptions.filterEmptyNodes = "first";

    const logs = captureConsoleLogs(() => {
      detectUpdatedComponents({ current: fiber });
    });

    const output = logs.join("\n");
    console.log("\n=== OUTPUT (first) ===\n" + output);

    // Verify we got output
    expect(logs.length).toBeGreaterThan(0);

    // Should have component render cycle group
    expect(output).toContain("Component render cycle");
  });

  it("should process real fiber with filterEmptyNodes: all", () => {
    const fiber = loadFiberFixture();
    traceOptions.filterEmptyNodes = "all";

    const logs = captureConsoleLogs(() => {
      detectUpdatedComponents({ current: fiber });
    });

    const output = logs.join("\n");
    console.log("\n=== OUTPUT (all) ===\n" + output);

    // Verify we got output
    expect(logs.length).toBeGreaterThan(0);

    // Should have component render cycle group
    expect(output).toContain("Component render cycle");
  });

  it("should show depth indicators when enabled", () => {
    const fiber = loadFiberFixture();
    traceOptions.enableAutoTracerInternalsLogging = true;
    traceOptions.filterEmptyNodes = "none";

    const logs = captureConsoleLogs(() => {
      detectUpdatedComponents({ current: fiber });
    });

    const output = logs.join("\n");
    console.log("\n=== OUTPUT (with depth) ===\n" + output);

    // If there are any depth transitions, should show Level indicators
    if (output.includes("└─┐")) {
      expect(output).toContain("Level:");
    }
  });
});
