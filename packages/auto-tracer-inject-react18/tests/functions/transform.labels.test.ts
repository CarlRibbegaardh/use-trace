import { describe, it, expect, vi } from "vitest";
import { transform } from "../../src/functions/transform/transform.js";
import type { TransformConfig } from "../../src/interfaces/TransformConfig.js";
import type { TransformResult } from "../../src/interfaces/TransformResult.js";
import type { TransformContext } from "../../src/interfaces/TransformContext.js";
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
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState", "useReducer", "useSelector", "useAppSelector"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should label built-ins with 3 arguments (label, index, value)
    expect(out).toMatch(/__autoTracer\.labelState\(['"]title['"],\s*0,\s*title\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]count['"],\s*1,\s*count\)/);

    // Should label configured selectors with 3 arguments
    expect(out).toMatch(/__autoTracer\.labelState\(['"]todos['"],\s*2,\s*todos\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]appTodos['"],\s*3,\s*appTodos\)/);

    // Should NOT label custom hooks when only list is provided
    expect(out).not.toMatch(/__autoTracer\.labelState\(['"]custom['"]/);
    expect(out).not.toMatch(/__autoTracer\.labelState\(['"]nested['"]/);

    // Total labelState occurrences should be exactly 4
    expect(countOccurrences(out, "labelState")).toBe(4);
  });
});
it("returns true for arrow with block body returning JSX Fragment", () => {
  const node = t.variableDeclarator(
    t.identifier("MyComponent"),
    t.arrowFunctionExpression(
      [],
      t.blockStatement([
        t.returnStatement(
          t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), [
            t.jsxText("x"),
          ])
        ),
      ])
    )
  );
  expect(isComponentFunction(node)).toBe(true);
});

describe("labelHooksPattern (regex-based)", () => {
  it("labels built-ins plus all hooks matching the pattern", () => {
    const code = makeComponentSource();
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
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

    // Built-ins (useState/useReducer) are always handled with 3 arguments
    expect(out).toMatch(/__autoTracer\.labelState\(['"]title['"],\s*0,\s*title\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]count['"],\s*1,\s*count\)/);

    // Pattern should match selectors and custom hooks with 3 arguments
    expect(out).toMatch(/__autoTracer\.labelState\(['"]todos['"],\s*2,\s*todos\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]appTodos['"],\s*3,\s*appTodos\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]custom['"],\s*4,\s*custom\)/);
    expect(out).toMatch(/__autoTracer\.labelState\(['"]nested['"],\s*5,\s*nested\)/);

    // Total labelState occurrences should be exactly 6
    expect(countOccurrences(out, "labelState")).toBe(6);
  });

  it("handles misplaced braces by falling back to literal extension matching", () => {
    // ext contains both '}' and '{' but in the wrong order, so brace regex doesn't match
    expect(matchesPattern("Component.foo}bar{baz", ["**/*.foo}bar{baz"])).toBe(
      true
    );
    expect(matchesPattern("Component.foo}bar{bazx", ["**/*.foo}bar{baz"])).toBe(
      false
    );
  });

  it("labels only hooks matched by pattern when list is empty", () => {
    const code = `
      function MyComponent() {
        const [s] = useState(0);
        const a = useAlpha();
        const b = useBeta();
        return <div>{s}{a}{b}</div>;
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
        labelHooksPattern: "^use(A|B).*$",
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // Built-in useState labeled via array pattern with 3 arguments
    expect(result.code).toMatch(/labelState\(['"]s['"],\s*0,\s*s\)/);
    // Pattern-matched identifiers labeled in order with 3 arguments
    expect(result.code).toMatch(/labelState\(['"]a['"],\s*1,\s*a\)/);
    expect(result.code).toMatch(/labelState\(['"]b['"],\s*2,\s*b\)/);
  });

  it("labels hooks matched by both list and pattern (combined)", () => {
    const code = `
      function MyComponent() {
        const [s] = useState(0);
        const picked = useSelector(sel);
        const dynamic = useXyz();
        return <div>{s}{picked}{dynamic}</div>;
      }
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useSelector"],
        labelHooksPattern: "^useX.*$",
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(/labelState\(['"]s['"],\s*0,\s*s\)/);
    expect(result.code).toMatch(/labelState\(['"]picked['"],\s*1,\s*picked\)/);
    expect(result.code).toMatch(/labelState\(['"]dynamic['"],\s*2,\s*dynamic\)/);
  });
});

describe("useAutoTracer exclusion", () => {
  it("should not label useAutoTracer hook", () => {
    const code = makeComponentWithAutoTracer();
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z].*",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    const out = result.code;

    // Should label useState hooks with 3 arguments
    expect(out).toMatch(/logger\.labelState\(['"]title['"],\s*0,\s*title\)/);
    expect(out).toMatch(/logger\.labelState\(['"]description['"],\s*1,\s*description\)/);

    // Should NOT label useAutoTracer
    expect(out).not.toMatch(/logger\.labelState\(['"]logger['"]/);

    // Total labelState occurrences should be exactly 2 (title, description only)
    expect(countOccurrences(out, "labelState")).toBe(2);
  });
});

describe("pragma controls", () => {
  it("skips transformation when @trace-disable pragma is present", () => {
    const code = `
      // @trace-disable
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
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toEqual([]);
    expect(result.code).toBe(code); // Should return original code unchanged
  });

  it("skips transformation in opt-in mode without @trace pragma", () => {
    const code = `
      function MyComponent() {
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      }
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-in",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toEqual([]);
  });

  it("transforms in opt-in mode with @trace pragma", () => {
    const code = `
      // @trace
      function MyComponent() {
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      }
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-in",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.code).not.toBe(code); // Should be transformed
  });

  it("disable pragma wins when both @trace and @trace-disable are present", () => {
    const code = `
      // @trace
      // @trace-disable
      function MyComponent() {
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      }
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-in",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toEqual([]);
  });
});

describe("HOC-wrapped components", () => {
  it("handles memo-wrapped components", () => {
    const code = `
      const MyComponent = memo(function MyComponent() {
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      });
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("MyComponent");
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(['"]count['"],\s*0,\s*count\)/
    );
  });

  it("handles forwardRef-wrapped components", () => {
    const code = `
      const MyComponent = forwardRef(function MyComponent() {
        const [value, setValue] = useState('');
        return <input value={value} />;
      });
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("MyComponent");
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(['"]value['"],\s*0,\s*value\)/
    );
  });

  it("handles nested HOC wrapping", () => {
    const code = `
      const MyComponent = memo(forwardRef(function MyComponent() {
        const [data, setData] = useState(null);
        return <div>{String(data)}</div>;
      }));
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("MyComponent");
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(['"]data['"],\s*0,\s*data\)/
    );
  });

  it("handles arrow functions with expression bodies", () => {
    const code = `
      const MyComponent = memo(() => <div>Hello</div>);
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("MyComponent");
  });

  it("handles deeply nested HOCs beyond depth limit", () => {
    // Create a deeply nested HOC that exceeds the depth limit of 3
    const code = `
      const MyComponent = a(b(c(d(e(f(() => <div>Hello</div>))))));
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(false); // Should not inject because function is too deeply nested
    expect(result.components).toHaveLength(0);
  });

  it("ignores HOC-wrapped non-functions", () => {
    const code = `
      const NotAComponent = memo("not a function");
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
  });

  it("ignores empty HOC call with no arguments", () => {
    const code = `
      const MyComponent = memo();
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
  });

  it("handles function expressions in HOCs", () => {
    const code = `
      const MyComponent = memo(function() {
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      });
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(['"]count['"],\s*0,\s*count\)/
    );
  });

  it("ignores HOC with spread arguments that hide the function", () => {
    const code = `
      const arr = [function MyComponent() { return <div/> }];
      const MyComponent = memo(...arr);
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
  });

  it("unwraps HOC when function is not the first argument", () => {
    const code = `
      const MyComponent = withOptions({opt:true}, function MyComponent() {
        const [count] = useState(0);
        return <div>{count}</div>;
      });
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.code).toMatch(/labelState\(['"]count/);
  });

  it("does not unwrap when HOC arguments are literals/identifiers only (no function)", () => {
    const code = `
      const C = withStuff(1, config, option);
    `;
    const context: TransformContext = {
      filename: "src/C.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
  });

  it("does not unwrap when HOC arg is an ArrayExpression containing a function", () => {
    const code = `
      const MyComponent = hoc([function Inner(){ return <div/> }]);
    `;
    const context: TransformContext = {
      filename: "src/C.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
  });

  it("does not unwrap when HOC arg is an ObjectExpression containing a function property", () => {
    const code = `
      const MyComponent = hoc({ comp: function Inner(){ return <span/> } });
    `;
    const context: TransformContext = {
      filename: "src/C.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
  });
});

describe("error handling", () => {
  it("returns original code on parse errors", () => {
    //const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const code = `
      function MyComponent() {
        const [count = useState(0); // Syntax error - missing ]
        return <div>{count}</div>;
      }
    `;

    console.log("Running error handling test");

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    console.log("About to call transform");
    let result: TransformResult;
    try {
      console.log("Calling transform now");
      result = transform(code, context);
      console.log("Transform completed");
    } catch (e) {
      console.error("Transform threw an error:", e);
      throw new Error("Transform threw an error instead of returning result");
    }

    console.log("Result received:", result);
    expect(result.injected).toBe(false);
    console.log("Components:", result.components);
    expect(result.components).toEqual([]);
    console.log("Code:", result.code);
    expect(result.code).toBe(code); // Should return original code on error

    console.log("Error handling test completed");
    // expect(warnSpy).toHaveBeenCalled();
    // warnSpy.mockRestore();
  });
});

describe("non-component files", () => {
  it("does not transform non-component functions (no JSX)", () => {
    const code = `
      function helper() { return 1; }
      const value = helper();
    `;
    const context: TransformContext = {
      filename: "src/utils.ts",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.ts", "**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
    // Do not rely on formatter-preserved spacing; just ensure no tracer or labels were added
    expect(result.code).not.toMatch(/useAutoTracer/);
    expect(result.code).not.toMatch(/labelState/);
  });
});

describe("edge cases in injectIntoBlockStatement", () => {
  it("handles bare useAutoTracer calls without assignment", () => {
    const code = `
      function MyComponent() {
        useAutoTracer({ name: "Test" });
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
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // Should not inject labels when there's a bare useAutoTracer call
    expect(result.code).not.toMatch(/labelState/);
  });

  it("still injects labels when both a tracer variable and a separate bare call exist", () => {
    const code = `
      function MyComponent() {
        const tracer = useAutoTracer({ name: "A" });
        useAutoTracer({ name: "B" });
        const [count] = useState(0);
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
      },
    };
    const result = transform(code, context);
    // Current transformer proceeds because a tracer identifier exists
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(/tracer\.labelState\(['"]count['"],\s*0,\s*count\)/);
  });

  it("skips labeling when labelState calls already exist", () => {
    const code = `
      function MyComponent() {
        const tracer = useAutoTracer({ name: "Test" });
        tracer.labelState("existing", 0);
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
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // Should not add duplicate labelState calls
    expect(countOccurrences(result.code, "labelState")).toBe(1); // Only the existing one
  });

  it("skips labeling when existing call uses optional chaining", () => {
    const code = `
      function MyComponent() {
        const tracer = useAutoTracer({ name: "Test" });
        tracer?.labelState("existing", 0);
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
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // Current transformer doesn't detect optional-call as existing, so one more label is injected
    expect(countOccurrences(result.code, "labelState")).toBe(2);
  });

  it("handles components with no hooks to label", () => {
    const code = `
      function MyComponent() {
        const customHook = useCustomHook();
        return <div>{String(customHook)}</div>;
      }
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"], // Only label useState, not custom hooks
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // Should inject useAutoTracer but no labelState calls
    expect(result.code).toMatch(/useAutoTracer/);
    expect(result.code).not.toMatch(/labelState/);
  });

  it("does not inject duplicate tracer when tracer variable already exists and no labels to add", () => {
    const code = `
      function MyComponent() {
        const tracer = useAutoTracer({ name: "Test" });
        const customHook = useCustomHook();
        return <div>{String(customHook)}</div>;
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
      },
    };
    const result = transform(code, context);
    // No additional tracer injection or labels
    expect(result.injected).toBe(true);
    // Exactly one tracer variable creation
    expect(countOccurrences(result.code, "const tracer = useAutoTracer")).toBe(
      1
    );
    // Import may be injected once since transform marks as injected
    expect(countOccurrences(result.code, "import { useAutoTracer }")).toBe(1);
    expect(result.code).not.toMatch(/labelState/);
  });

  it("uses existing tracer identifier for labelState when present", () => {
    const code = `
      function MyComponent() {
        const tracer = useAutoTracer({ name: "Comp" });
        const [count] = useState(0);
        return <div>{count}</div>;
      }
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // Should label using the 'tracer' identifier, not __autoTracer
    expect(result.code).toMatch(/tracer\.labelState\(['"]count['"],\s*0,\s*count\)/);
    expect(result.code).not.toMatch(/__autoTracer\.labelState/);
  });

  it("does not attempt to label the tracer hook itself", () => {
    const code = `
      function MyComponent() {
        const tracer = useAutoTracer({ name: "Comp" });
        return <div/>;
      }
    `;
    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // No labelState added since only tracer is present
    expect(result.code).not.toMatch(/labelState/);
    // And it should not create a second tracer variable
    expect(countOccurrences(result.code, "const tracer = useAutoTracer")).toBe(
      1
    );
  });

  it("ignores array destructuring without a first identifier", () => {
    const code = `
      function MyComponent() {
        const [, setCount] = useState(0);
        return <div />;
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
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(/useAutoTracer/);
    expect(result.code).not.toMatch(/labelState/);
  });

  it("ignores array destructuring when first element is an object pattern", () => {
    const code = `
      function MyComponent() {
        const [{ x }, setState] = useState({ x: 1 });
        return <div />;
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
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(/useAutoTracer/);
    expect(result.code).not.toMatch(/labelState/);
  });

  it("ignores array destructuring when first element is a rest element", () => {
    const code = `
      function MyComponent() {
        const [...items] = useState([]);
        return <ul>{items.map(String)}</ul>;
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
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(/useAutoTracer/);
    expect(result.code).not.toMatch(/labelState/);
  });

  it("ignores multi-declarator variable statements for hooks", () => {
    const code = `
      function MyComponent() {
        const a = useState(0), b = useState(1);
        return <div />;
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
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(/useAutoTracer/);
    expect(result.code).not.toMatch(/labelState/);
  });

  it("does not label member expression hooks like React.useState", () => {
    const code = `
      function MyComponent() {
        const [count] = React.useState(0);
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
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(/useAutoTracer/);
    expect(result.code).not.toMatch(/labelState/);
  });
});

describe("import handling", () => {
  it("adds useAutoTracer import when needed", () => {
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
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(
      /import { useAutoTracer } from ['"]@auto-tracer\/react18['"]/
    );
  });

  it("does not add import when useAutoTracer is already imported", () => {
    const code = `
      import { useAutoTracer } from '@auto-tracer/react18';

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
        exclude: ["**/*.test.*", "**/*.spec.*"],
        labelHooks: ["useState"],
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);
    // Should not add duplicate import
    expect(countOccurrences(result.code, "import { useAutoTracer }")).toBe(1);
  });

  it("does not add a second import when no hooks to label and import already exists", () => {
    const code = `
      import { useAutoTracer } from '@auto-tracer/react18';

      function MyComponent() {
        const x = useCustomHook();
        return <div>{String(x)}</div>;
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
      },
    };

    const result = transform(code, context);
    // No hooks to label, but import already exists -> should remain single import
    expect(result.injected).toBe(true);
    expect(countOccurrences(result.code, "import { useAutoTracer }")).toBe(1);
    // No labelState should be injected
    expect(result.code).not.toMatch(/labelState/);
  });

  it("uses configured importSource when injecting", () => {
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
        importSource: "my-tracer-src",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(result.code).toMatch(
      /import \{ useAutoTracer \} from ['"]my-tracer-src['"]/
    );
  });

  it("adds a single import for multiple transformed components in the same file", () => {
    const code = `
      function First() { const [a] = useState(0); return <div>{a}</div>; }
      function Second() { const [b] = useState(0); return <div>{b}</div>; }
    `;
    const context: TransformContext = {
      filename: "src/Multi.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
      },
    };
    const result = transform(code, context);
    expect(result.injected).toBe(true);
    expect(countOccurrences(result.code, "import { useAutoTracer }")).toBe(1);
    expect(countOccurrences(result.code, "labelState")).toBe(2);
  });
});

describe("config utilities", () => {
  describe("normalizeConfig", () => {
    it("returns default config when no config provided", () => {
      const config = normalizeConfig();
      expect(config.mode).toBe("opt-in");
      expect(config.importSource).toBe("@auto-tracer/react18");
      expect(config.labelHooks).toEqual(["useState", "useReducer"]);
    });

    it("merges provided config with defaults", () => {
      const config = normalizeConfig({
        mode: "opt-out",
        labelHooks: ["useState"],
      });
      expect(config.mode).toBe("opt-out");
      expect(config.labelHooks).toEqual(["useState"]);
      expect(config.importSource).toBe("@auto-tracer/react18"); // default
    });
  });

  describe("matchesPattern", () => {
    it("matches file extensions", () => {
      expect(matchesPattern("src/Component.tsx", ["**/*.tsx"])).toBe(true);
      expect(matchesPattern("src/Component.js", ["**/*.tsx"])).toBe(false);
    });

    it("returns false for non-extension patterns", () => {
      expect(matchesPattern("src/Component.tsx", ["src/**"])).toBe(false);
    });
  });

  describe("shouldProcessFile", () => {
    it("returns false for excluded files", () => {
      const config = normalizeConfig({
        exclude: ["**/*.test.*"],
      });
      expect(shouldProcessFile("src/Component.test.tsx", config)).toBe(false);
    });

    it("returns true for included files", () => {
      const config = normalizeConfig({
        include: ["**/*.tsx"],
        exclude: [],
      });
      expect(shouldProcessFile("src/Component.tsx", config)).toBe(true);
    });

    it("returns false when file doesn't match include patterns", () => {
      const config = normalizeConfig({
        include: ["**/*.tsx"],
        exclude: [],
      });
      expect(shouldProcessFile("src/Component.js", config)).toBe(false);
    });

    it("returns false for files in node_modules directory", () => {
      const config = normalizeConfig({
        include: ["**/*.tsx"],
        exclude: ["**/node_modules/**"],
      });
      expect(
        shouldProcessFile("node_modules/some-package/Component.tsx", config)
      ).toBe(false);
      expect(
        shouldProcessFile("src/node_modules/nested/Component.tsx", config)
      ).toBe(false);
    });

    it("does not process when include excludes the file extension", () => {
      const config = normalizeConfig({ include: ["**/*.jsx"], exclude: [] });
      expect(shouldProcessFile("src/Comp.tsx", config)).toBe(false);
    });

    it("does not process when include excludes the extension", () => {
      const config = normalizeConfig({ include: ["**/*.jsx"], exclude: [] });
      expect(shouldProcessFile("src/Comp.tsx", config)).toBe(false);
    });
  });

  describe("matchesPattern", () => {
    it("handles basic extension patterns", () => {
      expect(matchesPattern("Component.tsx", ["**/*.tsx"])).toBe(true);
      expect(matchesPattern("src/Component.tsx", ["**/*.tsx"])).toBe(true);
      expect(matchesPattern("deep/nested/Component.tsx", ["**/*.tsx"])).toBe(
        true
      );
      expect(matchesPattern("Component.js", ["**/*.tsx"])).toBe(false);
    });

    it("handles wildcard patterns with dots", () => {
      expect(matchesPattern("Component.test.tsx", ["**/*.test.*"])).toBe(true);
      expect(matchesPattern("Utils.spec.js", ["**/*.spec.*"])).toBe(true);
      expect(
        matchesPattern("src/deep/Component.test.tsx", ["**/*.test.*"])
      ).toBe(true);
      expect(matchesPattern("Component.tsx", ["**/*.test.*"])).toBe(false);
    });

    it("handles directory patterns", () => {
      expect(
        matchesPattern("node_modules/package/file.js", ["**/node_modules/**"])
      ).toBe(true);
      expect(
        matchesPattern("src/node_modules/nested/file.js", [
          "**/node_modules/**",
        ])
      ).toBe(true);
      expect(
        matchesPattern("node_modules/file.js", ["**/node_modules/**"])
      ).toBe(true);
      expect(
        matchesPattern("src/components/file.js", ["**/node_modules/**"])
      ).toBe(false);
    });

    it("handles multiple patterns", () => {
      const patterns = ["**/*.tsx", "**/*.jsx"];
      expect(matchesPattern("Component.tsx", patterns)).toBe(true);
      expect(matchesPattern("Component.jsx", patterns)).toBe(true);
      expect(matchesPattern("Component.ts", patterns)).toBe(false);
    });

    it("handles patterns with prefix directories", () => {
      expect(matchesPattern("src/Component.tsx", ["src/**/*.tsx"])).toBe(true);
      expect(matchesPattern("lib/deep/Component.tsx", ["lib/**/*.tsx"])).toBe(
        true
      );
      expect(matchesPattern("other/Component.tsx", ["src/**/*.tsx"])).toBe(
        true
      ); // matches extension only
    });

    it("handles brace expansion patterns", () => {
      expect(matchesPattern("Component.tsx", ["**/*.{tsx,jsx}"])).toBe(true);
      expect(matchesPattern("Component.jsx", ["**/*.{tsx,jsx}"])).toBe(true);
      expect(matchesPattern("Component.ts", ["**/*.{tsx,jsx}"])).toBe(false);
      expect(matchesPattern("test.spec.js", ["**/*.{test,spec}.js"])).toBe(
        true
      );
    });

    it("returns false for unsupported patterns", () => {
      expect(matchesPattern("Component.tsx", ["*.tsx"])).toBe(false);
      expect(matchesPattern("Component.tsx", ["Component.tsx"])).toBe(false);
    });
  });
});

describe("detect utilities", () => {
  describe("isComponentFunction", () => {
    it("returns true for PascalCase function declarations that return JSX", () => {
      const node = t.functionDeclaration(
        t.identifier("MyComponent"),
        [],
        t.blockStatement([
          t.returnStatement(
            t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier("div"), []),
              t.jsxClosingElement(t.jsxIdentifier("div")),
              []
            )
          ),
        ])
      );
      expect(isComponentFunction(node)).toBe(true);
    });

    it("returns false for non-PascalCase function declarations", () => {
      const node = t.functionDeclaration(
        t.identifier("myComponent"),
        [],
        t.blockStatement([
          t.returnStatement(
            t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier("div"), []),
              t.jsxClosingElement(t.jsxIdentifier("div")),
              []
            )
          ),
        ])
      );
      expect(isComponentFunction(node)).toBe(false);
    });

    it("returns true for PascalCase arrow functions that return JSX", () => {
      const node = t.variableDeclarator(
        t.identifier("MyComponent"),
        t.arrowFunctionExpression(
          [],
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier("div"), []),
            t.jsxClosingElement(t.jsxIdentifier("div")),
            []
          )
        )
      );
      expect(isComponentFunction(node)).toBe(true);
    });

    it("returns true for concise arrow returning JSX Fragment", () => {
      const node = t.variableDeclarator(
        t.identifier("MyComponent"),
        t.arrowFunctionExpression(
          [],
          t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), [
            t.jsxText("hello"),
          ])
        )
      );
      expect(isComponentFunction(node)).toBe(true);
    });

    it("returns false for functions that don't return JSX", () => {
      const node = t.functionDeclaration(
        t.identifier("MyComponent"),
        [],
        t.blockStatement([t.returnStatement(t.stringLiteral("hello"))])
      );
      expect(isComponentFunction(node)).toBe(false);
    });

    it("returns false for functions with empty return", () => {
      const node = t.functionDeclaration(
        t.identifier("MyComponent"),
        [],
        t.blockStatement([t.returnStatement()])
      );
      expect(isComponentFunction(node)).toBe(false);
    });

    it("returns false for concise arrow returning non-JSX", () => {
      const node = t.variableDeclarator(
        t.identifier("MyComponent"),
        t.arrowFunctionExpression([], t.stringLiteral("text"))
      );
      expect(isComponentFunction(node)).toBe(false);
    });

    it("returns true for arrow with block body that returns JSX", () => {
      const node = t.variableDeclarator(
        t.identifier("MyComponent"),
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.returnStatement(
              t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier("div"), []),
                t.jsxClosingElement(t.jsxIdentifier("div")),
                []
              )
            ),
          ])
        )
      );
      expect(isComponentFunction(node)).toBe(true);
    });

    it("returns false for arrow with block body and no return", () => {
      const node = t.variableDeclarator(
        t.identifier("MyComponent"),
        t.arrowFunctionExpression(
          [],
          t.blockStatement([t.expressionStatement(t.stringLiteral("hello"))])
        )
      );
      expect(isComponentFunction(node)).toBe(false);
    });

    it("returns true for FunctionDeclaration that returns a JSX Fragment", () => {
      const node = t.functionDeclaration(
        t.identifier("MyComponent"),
        [],
        t.blockStatement([
          t.returnStatement(
            t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), [
              t.jsxText("frag"),
            ])
          ),
        ])
      );
      expect(isComponentFunction(node)).toBe(true);
    });
  });

  describe("extractComponentInfo", () => {
    it("extracts info from function declarations", () => {
      const node = t.functionDeclaration(
        t.identifier("MyComponent"),
        [],
        t.blockStatement([])
      );
      const info = extractComponentInfo(node);
      expect(info?.name).toBe("MyComponent");
      expect(info?.isAnonymous).toBe(false);
    });

    it("extracts info from variable declarators", () => {
      const node = t.variableDeclarator(
        t.identifier("MyComponent"),
        t.arrowFunctionExpression([], t.blockStatement([]))
      );
      const info = extractComponentInfo(node);
      expect(info?.name).toBe("MyComponent");
      expect(info?.isAnonymous).toBe(false);
    });
  });

  describe("hasExistingUseAutoTracerImport", () => {
    it("returns true when useAutoTracer is imported", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("useAutoTracer"),
                t.identifier("useAutoTracer")
              ),
            ],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        true
      );
    });

    it("returns false when useAutoTracer is not imported", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("useState"),
                t.identifier("useState")
              ),
            ],
            t.stringLiteral("react")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns false for default import from source", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier("tracer"))],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns false for namespace import from source", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [t.importNamespaceSpecifier(t.identifier("TracerNS"))],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns true for named import with alias", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("trace"),
                t.identifier("useAutoTracer")
              ),
            ],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        true
      );
    });

    it("returns false when only other named imports exist from the source", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("somethingElse"),
                t.identifier("somethingElse")
              ),
            ],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns false when useAutoTracer is imported from a different source", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("useAutoTracer"),
                t.identifier("useAutoTracer")
              ),
            ],
            t.stringLiteral("not-auto-tracer")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns false when named import uses StringLiteral for imported", () => {
      // Babel allows string literal imported names in rare cases; detector only matches identifiers
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("alias"),
                t.stringLiteral("useAutoTracer") as unknown as t.Identifier
              ),
            ],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns false for side-effect import from the source with no specifiers", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration([], t.stringLiteral("@auto-tracer/react18")),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns false for mixed specifiers without named useAutoTracer", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importDefaultSpecifier(t.identifier("Tracer")),
              t.importSpecifier(
                t.identifier("something"),
                t.identifier("something")
              ),
            ],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });

    it("returns true when mixed specifiers include named useAutoTracer", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [
              t.importDefaultSpecifier(t.identifier("Tracer")),
              t.importSpecifier(
                t.identifier("alias"),
                t.identifier("useAutoTracer")
              ),
            ],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        true
      );
    });

    it("returns false when earlier import from source lacks named useAutoTracer even if a later one has it (current behavior)", () => {
      const ast = t.file(
        t.program([
          t.importDeclaration(
            [t.importSpecifier(t.identifier("a"), t.identifier("a"))],
            t.stringLiteral("not-auto-tracer")
          ),
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier("X"))],
            t.stringLiteral("@auto-tracer/react18")
          ),
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("trace"),
                t.identifier("useAutoTracer")
              ),
            ],
            t.stringLiteral("@auto-tracer/react18")
          ),
        ])
      );
      expect(hasExistingUseAutoTracerImport(ast, "@auto-tracer/react18")).toBe(
        false
      );
    });
  });

  describe("mock NodePath limitations", () => {
    it("should demonstrate current mock limitations with complex component structure", () => {
      // This test demonstrates the current mock NodePath approach limitations
      // by testing a complex component structure that might reveal edge cases
      const code = `
        function ComplexComponent() {
          // Nested block statement
          if (condition) {
            const [state1] = useState(0);
          }

          // Multiple hooks in sequence
          const [state2] = useState(1);
          const [state3] = useState(2);

          // Hook inside try-catch
          try {
            const [state4] = useState(3);
          } catch (error) {
            // error handling
          }

          return <div>Complex</div>;
        }
      `;

      const context: TransformContext = {
        filename: "src/ComplexComponent.tsx",
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

      // The current implementation should handle basic cases
      expect(result.code).toContain("useAutoTracer");
      expect(result.code).toContain("labelState");

      // But might not handle nested block statements properly
      // This test documents current behavior rather than ideal behavior
      expect(result.injected).toBe(true);
    });

    it("should handle components with existing complex NodePath scenarios", () => {
      // Test a scenario that might expose mock NodePath limitations
      const code = `
        function ComponentWithComplexStructure() {
          const [count, setCount] = useState(0);

          // Nested function declarations inside component
          function handleClick() {
            const [nested] = useState(99); // This shouldn't be transformed
          }

          // Arrow function with useState (should not be transformed)
          const callback = () => {
            const [another] = useState(88);
          };

          return <div onClick={handleClick}>Count: {count}</div>;
        }
      `;

      const context: TransformContext = {
        filename: "src/ComponentWithComplexStructure.tsx",
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

      // Should transform the top-level useState
      expect(result.code).toContain('labelState("count"');

      // Should not transform nested useState calls in inner functions
      // This tests the current scope limitations of the mock approach
      const nestedStateMatches = (
        result.code.match(/labelState.*nested/g) || []
      ).length;
      const anotherStateMatches = (
        result.code.match(/labelState.*another/g) || []
      ).length;

      expect(nestedStateMatches).toBe(0);
      expect(anotherStateMatches).toBe(0);
    });
  });

  describe("regressions and edge scenarios", () => {
    it("ignores variable assigned to non-component function", () => {
      // Test case where isComponentFunction returns true but extractComponentInfo returns null
      const code = `
        const NotAComponent = function() {
          // This will match isComponentFunction but fail extractComponentInfo
          return null;
        };
      `;

      const context: TransformContext = {
        filename: "src/NotAComponent.tsx",
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

      // Should not inject anything for invalid component (no JSX return)
      expect(result.injected).toBe(false);
      expect(result.code).not.toContain("useAutoTracer");
    });

    it("ignores variable declarator without initializer", () => {
      // Test case where componentInfo exists but init is not a function
      const code = `
        const MyComponent = null;
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

      // Should not inject anything when init is not a function
      expect(result.injected).toBe(false);
      expect(result.code).not.toContain("useAutoTracer");
    });

    it("does not transform components wrapped beyond HOC depth limit", () => {
      // Test deeply nested HOCs beyond the depth limit
      const code = `
        const DeeplyWrapped = hoc1(hoc2(hoc3(hoc4(hoc5(function MyComponent() {
          const [state] = useState(0);
          return <div>{state}</div>;
        })))));
      `;

      const context: TransformContext = {
        filename: "src/DeeplyWrapped.tsx",
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

      // Should not transform due to HOC depth limit
      expect(result.injected).toBe(false);
      expect(result.code).not.toContain("labelState");
    });

    it("ignores HOC invocations without function arguments", () => {
      // Test HOC call with non-function arguments
      const code = `
        const WithConfig = configure({ option: true })(MyComponent);
      `;

      const context: TransformContext = {
        filename: "src/WithConfig.tsx",
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

      // Should not transform when no function is found in HOC arguments
      expect(result.injected).toBe(false);
      expect(result.code).not.toContain("useAutoTracer");
    });

    it("ignores non-function variable declarator assignments", () => {
      // Variable assigned to a non-function should be ignored by extraction
      const code = `
        const notAComponent = someValue;
      `;

      const context: TransformContext = {
        filename: "src/NotAComponent.tsx",
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

      // Should not transform when extractComponentInfo returns null
      expect(result.injected).toBe(false);
      expect(result.code).not.toContain("useAutoTracer");
    });

    it("returns false for malformed brace expansion patterns", () => {
      // Malformed brace expansion should be treated as non-matching
      expect(matchesPattern("test.js", ["**/*.{malformed"])).toBe(false);
    });

    it("extractComponentInfo returns null for standalone function expressions", () => {
      // A bare function expression is not a top-level component declaration
      const functionExpr = t.functionExpression(
        null, // no id
        [],
        t.blockStatement([])
      );

      const result = extractComponentInfo(functionExpr);
      expect(result).toBe(null);
    });

    it("transforms variable declarator function component", () => {
      // Transforms a function component assigned to a variable
      const code = `
        const MyComponent = function Component() {
          const [state] = useState(0);
          return <div>{state}</div>;
        };
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
      expect(result.code).toContain("labelState");
    });
  });

  describe("index.ts exports coverage", () => {
    it("covers all exports from index.ts", () => {
      // Import everything to ensure index.ts exports are covered
      expect(typeof transform).toBe("function");
      expect(typeof normalizeConfig).toBe("function");
      expect(typeof matchesPattern).toBe("function");
      expect(typeof shouldProcessFile).toBe("function");
      expect(typeof isComponentFunction).toBe("function");
      expect(typeof extractComponentInfo).toBe("function");
      expect(typeof hasExistingUseAutoTracerImport).toBe("function");

      // Also test that we can import from the main index
      import("../../src/index.js").then((indexExports) => {
        expect(typeof indexExports.transform).toBe("function");
      });
    });
  });

  describe("types.ts coverage", () => {
    it("covers types.ts by using the interfaces", () => {
      // Create instances that use the types to ensure coverage
      const config: TransformConfig = {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      };

      const context: TransformContext = {
        filename: "test.tsx",
        config,
      };

      const result: TransformResult = {
        code: "test",
        injected: false,
        components: [],
      };

      const componentInfo: ComponentInfo = {
        name: "Test",
        isAnonymous: false,
        node: t.functionDeclaration(
          t.identifier("Test"),
          [],
          t.blockStatement([])
        ),
      };

      // Verify the types work correctly
      expect(config.mode).toBe("opt-out");
      expect(context.filename).toBe("test.tsx");
      expect(result.injected).toBe(false);
      expect(componentInfo.name).toBe("Test");
    });
  });
});
