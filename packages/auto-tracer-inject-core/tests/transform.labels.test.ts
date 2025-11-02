import { describe, it, expect } from "vitest";
import { transform } from "../src/transform.js";
import type { TransformContext } from "../src/types.js";

function makeComponentSource(): string {
  return `
    function MyComponent() {
      const [title, setTitle] = useState('');
      const [count, dispatch] = useReducer((s, a) => s, 0);
      const todos = useSelector(selectTodos);
      const appTodos = useAppSelector(selectTodos);
      const custom = useCustomHook();
      const nested = useCustomHook2WithCustomHookInside(useCustomHook());
      return <div>{title}{count}{String(todos)}{String(appTodos)}{String(custom)}{String(nested)}</div>;
    }
  `;
}

function makeComponentWithAutoTracer(): string {
  return `
    function MyComponent() {
      const logger = useAutoTracer();
      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      return <div>{title}{description}</div>;
    }
  `;
}

function countOccurrences(haystack: string, needle: string): number {
  return (
    haystack.match(
      new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    ) || []
  ).length;
}

describe("labelHooks (list-based)", () => {
  it("labels useState/useReducer and configured selectors, but not custom hooks", () => {
    const code = makeComponentSource();
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "auto-tracer",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState", "useReducer", "useSelector", "useAppSelector"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should label built-ins
    expect(out).toMatch(/__autoTracer\.labelState\(['"]title['"],\s*0\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]count['"],\s*1\)/);

    // Should label configured selectors
    expect(out).toMatch(/__autoTracer\.labelState\(['"]todos['"],\s*2\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]appTodos['"],\s*3\)/);

    // Should NOT label custom hooks when only list is provided
    expect(out).not.toMatch(/__autoTracer\.labelState\(['"]custom['"]/);
    expect(out).not.toMatch(/__autoTracer\.labelState\(['"]nested['"]/);

    // Total labelState occurrences should be exactly 4
    expect(countOccurrences(out, "labelState")).toBe(4);
  });
});

describe("labelHooksPattern (regex-based)", () => {
  it("labels built-ins plus all hooks matching the pattern", () => {
    const code = makeComponentSource();
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "auto-tracer",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        // Intentionally leave list empty to rely on pattern
        labelHooks: [],
        labelHooksPattern: "^use[A-Z].*",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Built-ins (useState/useReducer) are always handled
    expect(out).toMatch(/__autoTracer\.labelState\(['"]title['"],\s*0\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]count['"],\s*1\)/);

    // Pattern should match selectors and custom hooks
    expect(out).toMatch(/__autoTracer\.labelState\(['"]todos['"],\s*2\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]appTodos['"],\s*3\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]custom['"],\s*4\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]nested['"],\s*5\)/);

    // Total labelState occurrences should be exactly 6
    expect(countOccurrences(out, "labelState")).toBe(6);
  });
});

describe("useAutoTracer exclusion", () => {
  it("should not label useAutoTracer hook", () => {
    const code = makeComponentWithAutoTracer();
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "auto-tracer",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z].*",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should label useState hooks
    expect(out).toMatch(/logger\.labelState\(['"]title['"],\s*0\)/);
    expect(out).toMatch(/logger\.labelState\(['"]description['"],\s*1\)/);

    // Should NOT label useAutoTracer
    expect(out).not.toMatch(/logger\.labelState\(['"]logger['"]/);

    // Total labelState occurrences should be exactly 2 (title, description only)
    expect(countOccurrences(out, "labelState")).toBe(2);
  });
});
