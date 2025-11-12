import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { SimplePropComponent } from "@src/initial-props/SimplePropComponent";

/**
 * Tests for Scenario 1: Initial Prop Detection (Mount)
 * Verifies that primitive props are detected and logged on component mount.
 */
describe("SimplePropComponent", () => {
  let consoleOutput: string[] = [];
  let originalLog: typeof console.log;

  beforeEach(() => {
    consoleOutput = [];
    originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      consoleOutput.push(args.map(String).join(" "));
    });
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("should detect and log initial primitive props on mount", () => {
    render(<SimplePropComponent name="Alice" count={5} />);

    // Debug: Print all captured console output
    console.log = originalLog; // Restore original to see debug output
    console.log("DEBUG: Total console lines captured:", consoleOutput.length);
    consoleOutput.forEach((line, i) => {
      console.log(`DEBUG Line ${i}:`, line);
    });

    // Find the Mount log line
    const mountLog = consoleOutput.find((line) =>
      line.includes("[SimplePropComponent] Mount")
    );
    expect(mountLog).toBeDefined();

    // Find prop logs
    const namePropLog = consoleOutput.find((line) =>
      line.includes("Initial prop name:")
    );
    const countPropLog = consoleOutput.find((line) =>
      line.includes("Initial prop count:")
    );

    expect(namePropLog).toContain("Alice");
    expect(countPropLog).toContain("5");
  });

  it("should skip React internal props", () => {
    render(<SimplePropComponent name="Bob" count={10} key="test-key" />);

    // Verify that 'key' is not logged
    const keyPropLog = consoleOutput.find((line) =>
      line.includes("Initial prop key:")
    );
    expect(keyPropLog).toBeUndefined();
  });

  it("should render component correctly with props", () => {
    const { container } = render(
      <SimplePropComponent name="Alice" count={5} />
    );

    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("5");
  });
});
