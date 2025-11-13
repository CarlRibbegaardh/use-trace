import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { DeepTreeComponent } from "@src/tree-rendering/DeepTreeComponent";
import { updateAutoTracerOptions } from "@auto-tracer/react18";

/**
 * Tests for Filter Mode: all
 * Verifies that all sequences of empty nodes throughout the tree are collapsed.
 */
describe("DeepTreeComponent - Filter Mode: all", () => {
  let consoleOutput: string[] = [];
  let originalLog: typeof console.log;

  beforeEach(() => {
    // Configure filter mode to 'all'
    updateAutoTracerOptions({
      filterEmptyNodes: "all",
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

  it("should collapse all sequences of empty nodes throughout the tree", () => {
    render(<DeepTreeComponent />);

    // Debug output
    console.log = originalLog;
    console.log(
      "DEBUG: Filter mode 'all' - Total lines:",
      consoleOutput.length
    );
    consoleOutput.forEach((line, i) => {
      console.log(`Line ${i}:`, line);
    });

    const output = consoleOutput.join("\n");

    // Should have multiple collapse markers
    const markerCount = (output.match(/\.\.\. \(\d+ levels collapsed\)/g) || [])
      .length;
    expect(markerCount).toBeGreaterThan(1);

    // Should have TrackedComponent mounts
    expect(output).toContain("[TrackedComponent] Mount");

    // Should NOT have individual [div] Mount entries (all collapsed)
    expect(output).not.toContain("[div] Mount");
  });

  it("should show multiple markers with correct depth difference format", () => {
    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Should have multiple markers
    const markerRegex = /\.\.\. \((\d+) levels collapsed\)/g;
    const matches = [...output.matchAll(markerRegex)];

    expect(matches.length).toBeGreaterThan(1);

    // Verify each marker has correct format (always uses "levels" plural)
    matches.forEach((match) => {
      const depthDifference = parseInt(match[1]);
      expect(depthDifference).toBeGreaterThan(0);
      expect(match[0]).toContain("levels collapsed");
    });
  });

  it("should have fewest output lines compared to other modes", () => {
    const { unmount } = render(<DeepTreeComponent />);
    const allModeLines = consoleOutput.length;
    unmount();

    // Test with 'first' mode
    consoleOutput = [];
    updateAutoTracerOptions({ filterEmptyNodes: "first" });
    const { unmount: unmount2 } = render(<DeepTreeComponent />);
    const firstModeLines = consoleOutput.length;
    unmount2();

    // Test with 'none' mode
    consoleOutput = [];
    updateAutoTracerOptions({ filterEmptyNodes: "none" });
    render(<DeepTreeComponent />);
    const noneModeLines = consoleOutput.length;

    // 'all' mode should have fewest lines
    expect(allModeLines).toBeLessThan(firstModeLines);
    expect(allModeLines).toBeLessThan(noneModeLines);
  });

  it("should provide maximum clarity by removing all noise", () => {
    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Should have compact output with only meaningful nodes
    expect(output).toContain("[TrackedComponent] Mount");
    expect(output).toContain("Initial state count: 0");

    // All wrapper noise should be collapsed
    expect(output).not.toContain("[EmptyWrapper]");
    expect(output).not.toContain("[div] Mount");
  });

  it("should render components correctly with filter mode all", () => {
    const { container } = render(<DeepTreeComponent />);

    // Verify DOM structure exists (nested divs from EmptyWrapper components)
    const divs = container.querySelectorAll("div");
    expect(divs.length).toBeGreaterThan(5);

    // Verify tracked components rendered
    expect(container.textContent).toContain("Count: 0");
  });
});
