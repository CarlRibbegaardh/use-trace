import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { DeepTreeComponent } from "@src/tree-rendering/DeepTreeComponent";
import { updateAutoTracerOptions } from "@auto-tracer/react18";

/**
 * Tests for Collapse Marker Calculation
 * Verifies marker text format in standard mode vs debug mode.
 *
 * Standard mode: "... (N levels collapsed)" - shows depth difference
 * Debug mode: "... (Level: N, Filtered nodes: M)" - shows absolute depth and node count
 */
describe("DeepTreeComponent - Marker Calculation", () => {
  let consoleOutput: string[] = [];
  let originalLog: typeof console.log;

  beforeEach(() => {
    consoleOutput = [];
    originalLog = console.log;
    console.log = (...args: any[]) => {
      consoleOutput.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("should show depth difference in standard mode (N levels collapsed)", () => {
    // Configure standard mode
    updateAutoTracerOptions({
      filterEmptyNodes: "all",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Debug output
    console.log = originalLog;
    console.log("DEBUG: Standard mode markers:");
    consoleOutput.forEach((line) => {
      if (line.includes("levels collapsed")) {
        console.log(line);
      }
    });

    // Should use depth difference format: "... (N levels collapsed)"
    expect(output).toMatch(/\.\.\. \(\d+ levels collapsed\)/);

    // Should NOT use debug format
    expect(output).not.toMatch(/\.\.\. \(Level: \d+, Filtered nodes: \d+\)/);
  });

  it("should show absolute depth and filtered node count in debug mode", () => {
    // Configure debug mode
    updateAutoTracerOptions({
      filterEmptyNodes: "all",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: true, // Enable debug mode
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Debug output
    console.log = originalLog;
    console.log("DEBUG: Debug mode markers:");
    consoleOutput.forEach((line) => {
      if (line.includes("Level:") && line.includes("Filtered nodes:")) {
        console.log(line);
      }
    });

    // Should use debug format: "... (Level: N, Filtered nodes: M)"
    expect(output).toMatch(/\.\.\. \(Level: \d+, Filtered nodes: \d+\)/);

    // Extract depth and node count values
    const debugMatches = [...output.matchAll(/\.\.\. \(Level: (\d+), Filtered nodes: (\d+)\)/g)];
    expect(debugMatches.length).toBeGreaterThan(0);

    // Values should be non-negative integers
    debugMatches.forEach((match) => {
      const level = parseInt(match[1]);
      const filteredNodes = parseInt(match[2]);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(filteredNodes).toBeGreaterThanOrEqual(0);
    });
  });

  it("should always use plural 'levels' in standard mode", () => {
    updateAutoTracerOptions({
      filterEmptyNodes: "all",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Find all marker texts
    const markerRegex = /\.\.\. \((\d+) levels collapsed\)/g;
    const matches = [...output.matchAll(markerRegex)];

    expect(matches.length).toBeGreaterThan(0);

    // All should use "levels" (plural), regardless of count
    matches.forEach((match) => {
      const count = parseInt(match[1]);
      expect(count).toBeGreaterThanOrEqual(1);
      // The format is always "N levels collapsed" (always plural)
      expect(match[0]).toMatch(/\d+ levels collapsed/);
    });
  });

  it("should maintain visual depth consistency with markers", () => {
    updateAutoTracerOptions({
      filterEmptyNodes: "all",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    render(<DeepTreeComponent />);

    // Debug output
    console.log = originalLog;
    console.log("DEBUG: Visual depth analysis:");
    consoleOutput.forEach((line, i) => {
      const indent = line.match(/^(\s*)/)![1].length;
      console.log(`Line ${i} (indent=${indent}):`, line);
    });

    // Verify that markers appear and subsequent lines have proper indentation
    const markerIndices = consoleOutput
      .map((line, i) => (line.includes("levels collapsed") ? i : -1))
      .filter((i) => i >= 0);

    expect(markerIndices.length).toBeGreaterThan(0);

    // Each marker should be followed by content (tracked components)
    markerIndices.forEach((markerIndex) => {
      if (markerIndex + 1 < consoleOutput.length) {
        const markerLine = consoleOutput[markerIndex];
        const nextLine = consoleOutput[markerIndex + 1];

        // Marker should have the correct format
        expect(markerLine).toMatch(/\.\.\. \(\d+ levels collapsed\)/);

        // Next line after marker should be indented (content following the marker)
        expect(nextLine.trim()).not.toBe(nextLine);
      }
    });
  });
});
