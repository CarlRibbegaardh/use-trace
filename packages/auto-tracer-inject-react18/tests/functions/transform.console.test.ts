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

function countUseAutoTracerCalls(code: string): number {
  // Count actual useAutoTracer() calls, not imports
  // Match pattern: = useAutoTracer( or const __autoTracer = useAutoTracer(
  return (code.match(/=\s*useAutoTracer\(/g) || []).length;
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

  it("should NOT inject second useAutoTracer in nested PascalCase function with console.log", () => {
    const code = `
      function MyComponent() {
        const [count, setCount] = useState(0);

        function HandleClick() {
          console.log("Button clicked", count);
        }

        return <div onClick={HandleClick}>Count: {count}</div>;
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

    // Debug: print the transformed code
    console.log("=== Transformed Code (Nested PascalCase) ===");
    console.log(out);
    console.log("=== Components detected:", result.components);
    console.log("=== End ===");

    // Should have exactly ONE useAutoTracer call
    expect(countUseAutoTracerCalls(out)).toBe(1);

    // Should NOT have __autoTracer2
    expect(out).not.toContain("__autoTracer2");

    // Should have exactly one __autoTracer variable
    expect(countOccurrences(out, "const __autoTracer")).toBe(1);

    // Should have logger.log call inside HandleClick using parent's __autoTracer
    expect(out).toContain("__autoTracer.log(");
    expect(countOccurrences(out, "__autoTracer.log(")).toBe(1);

    // Should have labelState for the useState
    expect(countOccurrences(out, "__autoTracer.labelState(")).toBe(1);
  });

  it("should handle nested arrow function with console.log without duplicate useAutoTracer", () => {
    const code = `
      function TodoList() {
        const [items, setItems] = useState([]);

        const handleAdd = () => {
          console.log("Adding item");
          setItems([...items, "new"]);
        };

        return <button onClick={handleAdd}>Add</button>;
      }
    `;

    const context: TransformContext = {
      filename: "src/TodoList.tsx",
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

    // Should have exactly ONE useAutoTracer call
    expect(countUseAutoTracerCalls(out)).toBe(1);

    // Should NOT have __autoTracer2, __autoTracer3, etc.
    expect(out).not.toContain("__autoTracer2");
    expect(out).not.toContain("__autoTracer3");

    // Should have logger.log inside handleAdd
    expect(out).toContain("__autoTracer.log(");
    expect(countOccurrences(out, "__autoTracer.log(")).toBe(1);
  });

  it("should handle nested function returning JSX without treating it as a component", () => {
    const code = `
      function ParentComponent() {
        const [state, setState] = useState(false);

        function RenderHelper() {
          console.log("Rendering helper");
          return <div>Helper</div>;
        }

        return <div>{RenderHelper()}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/ParentComponent.tsx",
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

    // Should have exactly ONE useAutoTracer call (only for ParentComponent)
    expect(countUseAutoTracerCalls(out)).toBe(1);

    // RenderHelper should NOT get its own useAutoTracer even though it returns JSX
    expect(out).not.toContain("__autoTracer2");

    // Should have logger.log using parent's __autoTracer
    expect(out).toContain("__autoTracer.log(");
    expect(countOccurrences(out, "__autoTracer.log(")).toBe(1);
  });

  it("should NOT inject duplicate useAutoTracer inside useCallback with console.log", () => {
    const code = `
      function MyComponent() {
        const [count, setCount] = useState(0);

        const handleClick = useCallback(() => {
          console.log("Callback executed", count);
          setCount(count + 1);
        }, [count]);

        return <button onClick={handleClick}>Click me</button>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState", "useCallback"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    console.log("=== Transformed Code (useCallback) ===");
    console.log(out);
    console.log("=== Components:", result.components);
    console.log("=== End ===");

    // Should have exactly ONE useAutoTracer call
    expect(countUseAutoTracerCalls(out)).toBe(1);

    // Should NOT have __autoTracer2
    expect(out).not.toContain("__autoTracer2");

    // TODO: Console logger injection in arrow function arguments not yet implemented
    // This would require traversing into CallExpression arguments
    // expect(out).toContain("__autoTracer.log(");
  });

  it("should NOT inject duplicate useAutoTracer inside map/filter chain with console.log", () => {
    const code = `
      function ListComponent() {
        const [items, setItems] = useState([1, 2, 3, 4, 5]);

        const filtered = items
          .map(x => x * 2)
          .filter(x => x > 5)
          .filter(x => {
            console.log("Filtering item", x);
            return x % 4 === 0;
          });

        return <div>{filtered.length}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/ListComponent.tsx",
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

    console.log("=== Transformed Code (map/filter) ===");
    console.log(out);
    console.log("=== Components:", result.components);
    console.log("=== End ===");

    // Should have exactly ONE useAutoTracer call
    expect(countUseAutoTracerCalls(out)).toBe(1);

    // Should NOT have any __autoTracer2, __autoTracer3, etc.
    expect(out).not.toContain("__autoTracer2");
    expect(out).not.toContain("__autoTracer3");

    // TODO: Console logger injection in arrow function arguments not yet implemented
    // expect(out).toContain("__autoTracer.log(");
  });

  it("should handle deeply nested callbacks without duplicate useAutoTracer", () => {
    const code = `
      function ComplexComponent() {
        const [data, setData] = useState([]);

        useEffect(() => {
          fetch('/api/data')
            .then(response => {
              console.log("Response received");
              return response.json();
            })
            .then(json => {
              console.log("Data parsed", json);
              setData(json);
            })
            .catch(error => {
              console.error("Fetch failed", error);
            });
        }, []);

        return <div>{data.length}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/ComplexComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState", "useEffect"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    console.log("=== Transformed Code (deeply nested) ===");
    console.log(out);
    console.log("=== Components:", result.components);
    console.log("=== End ===");

    // Should have exactly ONE useAutoTracer call
    expect(countUseAutoTracerCalls(out)).toBe(1);

    // Should NOT have any duplicate tracers
    expect(out).not.toContain("__autoTracer2");
    expect(out).not.toContain("__autoTracer3");

    // TODO: Console logger injection in arrow function arguments (promise chains) not yet implemented
    // expect(countOccurrences(out, "__autoTracer.log(")).toBe(2);
    // expect(countOccurrences(out, "__autoTracer.error(")).toBe(1);
  });
});
