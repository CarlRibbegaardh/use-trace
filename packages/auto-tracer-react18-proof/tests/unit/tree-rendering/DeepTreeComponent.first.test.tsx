import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { DeepTreeComponent } from "@src/tree-rendering/DeepTreeComponent";
import { updateAutoTracerOptions } from "@auto-tracer/react18";

/**
 * Tests for Filter Mode: first
 * Verifies that only the initial sequence of empty nodes is collapsed.
 */
describe("DeepTreeComponent - Filter Mode: first", () => {
  let consoleOutput: string[] = [];
  let originalLog: typeof console.log;

  beforeEach(() => {
    // Configure filter mode to 'first'
    updateAutoTracerOptions({
      filterEmptyNodes: "first",
      includeReconciled: false,
      includeSkipped: false,
      includeMount: false, // Filter out Mount nodes without tracking
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Exclude non-tracked branches to enable filtering
    });

    consoleOutput = [];
    originalLog = console.log;
    console.log = (...args: any[]) => {
      consoleOutput.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("should collapse only the initial sequence of empty nodes", () => {
    render(<DeepTreeComponent />);

    // Debug output
    console.log = originalLog;
    console.log(
      "DEBUG: Filter mode 'first' - Total lines:",
      consoleOutput.length
    );
    consoleOutput.forEach((line, i) => {
      console.log(`Line ${i}:`, line);
    });

    const output = consoleOutput.join("\n");

    // Should have a collapse marker for the first sequence
    expect(output).toMatch(/\.\.\. \(\d+ levels collapsed\)/);

    // Should have TrackedComponent mounts
    expect(output).toContain("[TrackedComponent] Mount");

    // After first tracked component, empty nodes should reappear
    const lines = consoleOutput;
    const firstTrackedIndex = lines.findIndex((line) =>
      line.includes("[TrackedComponent] Mount")
    );
    expect(firstTrackedIndex).toBeGreaterThan(-1);

    // Lines after first tracked component should include [div] Mount (empty nodes)
    const linesAfterFirstTracked = lines.slice(firstTrackedIndex + 1);
    const hasEmptyNodesAfter = linesAfterFirstTracked.some((line) =>
      line.includes("[div] Mount")
    );
    expect(hasEmptyNodesAfter).toBe(true);
  });

  it("should show marker with correct depth difference format", () => {
    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Should match format: "... (N levels collapsed)" (always plural)
    const markerRegex = /\.\.\. \((\d+) levels collapsed\)/;
    const match = output.match(markerRegex);

    expect(match).toBeTruthy();
    if (match) {
      const depthDifference = parseInt(match[1]);
      expect(depthDifference).toBeGreaterThan(0);
      // Format always uses "levels" (plural)
      expect(match[0]).toContain("levels collapsed");
    }
  });

  it("should reduce output lines compared to 'none' mode", () => {
    const { unmount } = render(<DeepTreeComponent />);
    const firstModeLines = consoleOutput.length;
    unmount();

    // Reset and test with 'none' mode
    consoleOutput = [];
    updateAutoTracerOptions({ filterEmptyNodes: "none" });
    render(<DeepTreeComponent />);
    const noneModeLines = consoleOutput.length;

    // 'first' mode should have fewer lines due to collapsing
    expect(firstModeLines).toBeLessThan(noneModeLines);
  });

  it("should render components correctly with filter mode first", () => {
    const { container } = render(<DeepTreeComponent />);

    // Verify DOM structure exists (nested divs from EmptyWrapper components)
    const divs = container.querySelectorAll("div");
    expect(divs.length).toBeGreaterThan(5);

    // Verify tracked components rendered
    expect(container.textContent).toContain("Count: 0");
  });
});
