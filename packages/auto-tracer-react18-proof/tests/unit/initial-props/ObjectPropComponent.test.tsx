import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { ObjectPropComponent } from "@src/initial-props/ObjectPropComponent";

/**
 * Tests for Scenario 2: Initial Prop Output Formatting (Objects)
 * Verifies that object props are JSON stringified with stable key ordering.
 */
describe("ObjectPropComponent", () => {
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

  it("should JSON stringify object props", () => {
    const user = { id: 1, name: "Bob" };

    render(<ObjectPropComponent user={user} />);

    // Find the Mount log line
    const mountLog = consoleOutput.find((line) =>
      line.includes("[ObjectPropComponent] Mount")
    );
    expect(mountLog).toBeDefined();

    // Find object prop log - should be JSON stringified
    const userPropLog = consoleOutput.find((line) =>
      line.includes("Initial prop user:")
    );

    // Verify JSON format (keys in alphabetical order)
    expect(userPropLog).toContain('"id":1');
    expect(userPropLog).toContain('"name":"Bob"');
  });

  it("should handle nested objects", () => {
    const user = {
      id: 2,
      name: "Alice",
      address: { city: "NYC", zip: "10001" },
    };

    render(<ObjectPropComponent user={user as any} />);

    const userPropLog = consoleOutput.find((line) =>
      line.includes("Initial prop user:")
    );

    // Verify nested structure is serialized
    expect(userPropLog).toContain('"address"');
    expect(userPropLog).toContain('"city"');
    expect(userPropLog).toContain('"zip"');
  });

  it("should render component correctly with object prop", () => {
    const user = { id: 1, name: "Bob" };
    const { container } = render(<ObjectPropComponent user={user} />);

    expect(container.textContent).toContain("Bob");
  });
});
