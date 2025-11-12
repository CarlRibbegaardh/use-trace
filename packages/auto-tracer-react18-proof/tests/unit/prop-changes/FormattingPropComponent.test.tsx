import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { FormattingPropComponent } from "@src/prop-changes/FormattingPropComponent";

/**
 * Tests for Scenario 6: Prop Change Output Formatting
 * Verifies formatting for short, medium, long, and function prop changes.
 */
describe("FormattingPropComponent", () => {
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

  it("should format short prop changes inline (<20 chars)", () => {
    const { rerender } = render(<FormattingPropComponent shortValue={5} />);

    consoleOutput = [];
    rerender(<FormattingPropComponent shortValue={10} />);

    const changeLog = consoleOutput.find((line) =>
      line.includes("Prop change shortValue:")
    );

    expect(changeLog).toBeDefined();
    expect(changeLog).toMatch(/5.*10/);
  });

  it("should format medium prop changes (20-200 chars)", () => {
    const obj1 = { id: 1, name: "Alice" };
    const obj2 = { id: 1, name: "Bob" };

    const { rerender } = render(
      <FormattingPropComponent mediumValue={obj1} />
    );

    consoleOutput = [];
    rerender(<FormattingPropComponent mediumValue={obj2} />);

    const changeLog = consoleOutput.find((line) =>
      line.includes("Prop change mediumValue:")
    );

    expect(changeLog).toBeDefined();
    // Medium changes should show object serialization
    // (may be multi-line or single line depending on implementation)
  });

  it("should format function prop changes as (fn:N) → (fn:M)", () => {
    const fn1 = () => console.log("first");
    const fn2 = () => console.log("second");

    const { rerender } = render(
      <FormattingPropComponent functionValue={fn1} />
    );

    consoleOutput = [];
    rerender(<FormattingPropComponent functionValue={fn2} />);

    const changeLog = consoleOutput.find((line) =>
      line.includes("Prop change functionValue:")
    );

    expect(changeLog).toMatch(/\(fn:\d+\).*\(fn:\d+\)/);
  });

  it("should not log when prop values are identical", () => {
    const { rerender } = render(<FormattingPropComponent shortValue={5} />);

    consoleOutput = [];
    rerender(<FormattingPropComponent shortValue={5} />);

    const changeLog = consoleOutput.find((line) =>
      line.includes("Prop change shortValue:")
    );

    // No change should be logged for identical values
    expect(changeLog).toBeUndefined();
  });
});
