import { describe, it, expect } from "vitest";
import { transform } from "../../src/functions/transform/transform.js";
import type { TransformContext } from "../../src/interfaces/TransformContext.js";

function countOccurrences(haystack: string, needle: string): number {
  return (
    haystack.match(
      new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    ) || []
  ).length;
}

describe("Console log injection", () => {
  it("should inject logger.log() after console.log()", () => {
    const code = `
      function MyComponent() {
        console.log("Hello world", { test: 123 });
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should keep original console.log
    expect(out).toContain('console.log("Hello world", { test: 123 })');

    // Should inject logger.log with same arguments
    expect(out).toMatch(
      /__autoTracer\.log\(['"]Hello world['"],\s*{\s*test:\s*123\s*}\)/
    );

    // Should have exactly one logger.log call
    expect(countOccurrences(out, "__autoTracer.log(")).toBe(1);
  });

  it("should inject logger.warn() after console.warn()", () => {
    const code = `
      function MyComponent() {
        const [title, setTitle] = useState("");
        if (title.length > 50) {
          console.warn("Title is too long", { length: title.length });
        }
        return <div>{title}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should keep original console.warn
    expect(out).toContain('console.warn("Title is too long"');

    // Should inject logger.warn with same arguments
    expect(out).toMatch(/__autoTracer\.warn\(['"]Title is too long['"]/);

    // Should have exactly one logger.warn call
    expect(countOccurrences(out, "__autoTracer.warn(")).toBe(1);
  });

  it("should inject logger.error() after console.error()", () => {
    const code = `
      function MyComponent() {
        try {
          doSomething();
        } catch (error) {
          console.error("Operation failed", error);
        }
        return <div>Test</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: [],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should keep original console.error
    expect(out).toContain('console.error("Operation failed", error)');

    // Should inject logger.error with same arguments
    expect(out).toMatch(
      /__autoTracer\.error\(['"]Operation failed['"],\s*error\)/
    );

    // Should have exactly one logger.error call
    expect(countOccurrences(out, "__autoTracer.error(")).toBe(1);
  });

  it("should inject all three logger methods when all console methods are present", () => {
    const code = `
      function MyComponent() {
        console.log("Component rendering");
        const [count, setCount] = useState(0);

        if (count > 50) {
          console.warn("Count is high", { count });
        }

        if (count > 100) {
          console.error("Count exceeded maximum!", { count });
        }

        return <div>{count}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should have all three logger method calls
    expect(countOccurrences(out, "__autoTracer.log(")).toBe(1);
    expect(countOccurrences(out, "__autoTracer.warn(")).toBe(1);
    expect(countOccurrences(out, "__autoTracer.error(")).toBe(1);

    // Should also have labelState for the useState
    expect(countOccurrences(out, "__autoTracer.labelState(")).toBe(1);
  });

  it("should inject logger calls even when there are no hooks to label", () => {
    const code = `
      function MyComponent() {
        console.log("No hooks here");
        console.warn("Just logging");
        return <div>Static component</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: [],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should inject logger calls even without hooks
    expect(countOccurrences(out, "__autoTracer.log(")).toBe(1);
    expect(countOccurrences(out, "__autoTracer.warn(")).toBe(1);

    // Should NOT have labelState calls
    expect(countOccurrences(out, "__autoTracer.labelState(")).toBe(0);
  });

  it("should handle multiple console calls of the same type", () => {
    const code = `
      function MyComponent() {
        console.log("First log");
        console.log("Second log");
        console.log("Third log");
        return <div>Test</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: [],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should inject logger.log() for each console.log()
    expect(countOccurrences(out, "__autoTracer.log(")).toBe(3);

    // Should preserve all original console.log calls
    expect(countOccurrences(out, 'console.log("First log")')).toBe(1);
    expect(countOccurrences(out, 'console.log("Second log")')).toBe(1);
    expect(countOccurrences(out, 'console.log("Third log")')).toBe(1);
  });
});
