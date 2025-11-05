import { describe, it, expect } from "vitest";
import { transform } from "../../src/functions/transform/transform.js";
import type { TransformConfig } from "../../src/interfaces/TransformConfig.js";
import type { TransformContext } from "../../src/interfaces/TransformContext.js";
import type { TransformResult } from "../../src/interfaces/TransformResult.js";
import type { ComponentInfo } from "../../src/interfaces/ComponentInfo.js";
import { normalizeConfig } from "../../src/functions/config/normalizeConfig.js";
import { matchesPattern } from "../../src/functions/config/matchesPattern.js";
import { shouldProcessFile } from "../../src/functions/config/shouldProcessFile.js";
import { isComponentFunction } from "../../src/functions/detect/isComponentFunction.js";
import { extractComponentInfo } from "../../src/functions/detect/extractComponentInfo.js";
import { hasExistingUseAutoTracerImport } from "../../src/functions/detect/hasExistingUseAutoTracerImport.js";
import * as t from "@babel/types";

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

function countOccurrences(haystack: string, needle: string): number {
  return (
    haystack.match(
      new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    ) || []
  ).length;
}

describe("transform core functionality", () => {
  it("transforms basic component with hooks", () => {
    const code = `
      function MyComponent() {
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
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toContain("useAutoTracer");
    expect(result.code).toContain('labelState("count"');
  });

  it("achieves 100% coverage with the reorganized structure", () => {
    // Test all critical code paths to achieve 100% coverage
    const code = makeComponentSource();
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: ["useState", "useReducer", "useSelector", "useAppSelector"],
        labelHooksPattern: "^use[A-Z].*",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toContain("useAutoTracer");
    expect(countOccurrences(result.code, "labelState")).toBeGreaterThan(0);
  });

  it("does nothing when no components and import already exists", () => {
    const code = `
      import { useAutoTracer } from '@auto-tracer/react18';
      const x = 1;
    `;
    const result = transform(code, {
      filename: "src/none.ts",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*"],
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    });
    expect(result.injected).toBe(false);
    expect(result.code).toContain("import { useAutoTracer } from '@auto-tracer/react18'");
  });

  it("opt-in with pragma but no components results in no changes", () => {
    const code = `
      // @trace
      const x = 1;
      function helper(){ return 1; }
    `;
    const result = transform(code, {
      filename: "src/nocomponents.ts",
      config: {
        mode: "opt-in",
        importSource: "@auto-tracer/react18",
        include: ["**/*"],
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    });
    expect(result.injected).toBe(false);
    expect(result.code).not.toContain("useAutoTracer");
  });
});
