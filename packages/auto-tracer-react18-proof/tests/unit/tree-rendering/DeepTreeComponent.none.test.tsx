import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { DeepTreeComponent } from "@src/tree-rendering/DeepTreeComponent";
import { updateAutoTracerOptions } from "@auto-tracer/react18";

/**
 * Tests for Filter Mode: none
 * Verifies that no filtering is applied and all nodes appear in the tree.
 */
describe("DeepTreeComponent - Filter Mode: none", () => {
  let consoleOutput: string[] = [];
  let originalLog: typeof console.log;

  beforeEach(() => {
    // Configure filter mode to 'none'
    updateAutoTracerOptions({
      filterEmptyNodes: "none",
      includeReconciled: true,
      includeSkipped: true,
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: false, // Show non-tracked nodes but don't filter them
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

  it("should display all nodes without filtering when mode is 'none'", () => {
    render(<DeepTreeComponent />);

    // Debug output
    console.log = originalLog;
    console.log(
      "DEBUG: Filter mode 'none' - Total lines:",
      consoleOutput.length
    );
    consoleOutput.forEach((line, i) => {
      console.log(`Line ${i}:`, line);
    });

    const output = consoleOutput.join("\n");

    // Should have TrackedComponent mounts
    expect(output).toContain("[TrackedComponent] Mount");

    // Should have all wrapper divs (empty nodes)
    expect(output).toContain("[div] Mount");

    // Should NOT have any collapse markers (no filtering)
    expect(output).not.toContain("levels collapsed");
    expect(output).not.toContain("Filtered nodes:");

    // Should show complete tree structure with all nodes
    expect(consoleOutput.length).toBeGreaterThan(10);
  });

  it("should show all empty nodes individually with no markers", () => {
    render(<DeepTreeComponent />);

    const output = consoleOutput.join("\n");

    // Verify no marker text exists
    expect(output).not.toMatch(/\.\.\. \(\d+ levels collapsed\)/);
    expect(output).not.toMatch(/\.\.\. \(Level: \d+, Filtered nodes: \d+\)/);

    // Should see multiple [div] Mount entries (empty wrappers)
    const divMountCount = consoleOutput.filter((line) =>
      line.includes("[div] Mount")
    ).length;
    expect(divMountCount).toBeGreaterThan(3);
  });

  it("should render components correctly with filter mode none", () => {
    const { container } = render(<DeepTreeComponent />);

    // Verify DOM structure exists (nested divs from EmptyWrapper components)
    const divs = container.querySelectorAll("div");
    expect(divs.length).toBeGreaterThan(5);

    // Verify tracked components rendered
    expect(container.textContent).toContain("Count: 0");
  });
});
