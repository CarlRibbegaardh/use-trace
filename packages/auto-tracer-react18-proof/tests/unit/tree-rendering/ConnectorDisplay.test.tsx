import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { DeepTreeComponent } from "@src/tree-rendering/DeepTreeComponent";
import { updateAutoTracerOptions } from "@auto-tracer/react18";

/**
 * Tests for Connector Display Logic
 * Verifies that tree connectors (├─, └─┐) are displayed correctly with markers.
 */
describe("DeepTreeComponent - Connector Display", () => {
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

  it("should show tree connectors with filter mode none", () => {
    updateAutoTracerOptions({
      filterEmptyNodes: "none",
      includeReconciled: true,
      includeSkipped: true,
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Show non-tracked nodes
    });

    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Debug output
    console.log = originalLog;
    console.log("DEBUG: Tree structure (none mode):");
    consoleOutput.forEach((line) => {
      console.log(line);
    });

    // Should have tree connectors
    expect(output).toMatch(/[├└]─/); // Branch connectors
    expect(output).toMatch(/└─┐/); // Depth transition connector
  });

  it("should skip intermediate connectors when marker is present", () => {
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
    console.log("DEBUG: Tree structure (all mode with markers):");
    consoleOutput.forEach((line) => {
      console.log(line);
    });

    // Should have markers
    expect(output).toContain("levels collapsed");

    // Should have connectors before/after markers but not redundantly between
    expect(output).toMatch(/└─┐.*levels collapsed/); // Connector before marker
  });

  it("should maintain depth transitions with proper connectors", () => {
    updateAutoTracerOptions({
      filterEmptyNodes: "first",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    render(<DeepTreeComponent />);

    // Debug output
    console.log = originalLog;
    console.log("DEBUG: Depth transitions:");
    consoleOutput.forEach((line, i) => {
      if (line.includes("┐") || line.includes("TrackedComponent")) {
        console.log(`Line ${i}:`, line);
      }
    });

    // Find lines with depth transitions (└─┐)
    const transitionLines = consoleOutput.filter((line) =>
      line.includes("└─┐")
    );
    expect(transitionLines.length).toBeGreaterThan(0);

    // Verify transitions appear near tracked components or markers
    const trackedComponentLines = consoleOutput
      .map((line, i) => (line.includes("TrackedComponent") ? i : -1))
      .filter((i) => i >= 0);

    // At least one transition should be near a tracked component
    const hasTransitionNearTracked = trackedComponentLines.some(
      (trackedIndex) => {
        // Check lines before the tracked component
        for (let i = Math.max(0, trackedIndex - 3); i < trackedIndex; i++) {
          if (consoleOutput[i].includes("└─┐")) {
            return true;
          }
        }
        return false;
      }
    );

    expect(hasTransitionNearTracked).toBe(true);
  });

  it("should show consistent connector patterns in debug mode", () => {
    updateAutoTracerOptions({
      filterEmptyNodes: "all",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: true, // Debug mode
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Debug output
    console.log = originalLog;
    console.log("DEBUG: Debug mode connectors:");
    consoleOutput.forEach((line) => {
      console.log(line);
    });

    // Should have Level markers with filtered node count in debug mode
    expect(output).toMatch(/\.\.\. \(Level: \d+, Filtered nodes: \d+\)/);

    // Should still have tree structure connectors
    expect(output).toMatch(/[├└]─/);
  });

  it("should handle multiple tracked components with proper spacing", () => {
    updateAutoTracerOptions({
      filterEmptyNodes: "all",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    render(<DeepTreeComponent />);

    // Find all TrackedComponent mount lines
    const trackedMounts = consoleOutput.filter((line) =>
      line.includes("[TrackedComponent] Mount")
    );

    // Should have 2 TrackedComponents in the tree
    expect(trackedMounts.length).toBe(2);

    // Debug output
    console.log = originalLog;
    console.log("DEBUG: Multiple tracked components:");
    trackedMounts.forEach((line) => {
      console.log(line);
    });

    // Both should have proper tree structure around them
    trackedMounts.forEach((line) => {
      // Each tracked component line should have indentation/connectors
      expect(line.trim().length).toBeLessThan(line.length);
    });
  });
});
