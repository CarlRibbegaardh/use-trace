import { describe, it, expect } from "vitest";
import { transformSync, parse } from "@babel/core";
import plugin from "../src/index";

describe("auto-tracer-plugin-babel parse options", () => {
  it("reuses the file's parserOpts.plugins when reparsing transformed code", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const input = `
        "use client";
        export function Example() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const parserPlugins = ["typescript", "jsx", "decorators-legacy"] as const;

      const transformResult = transformSync(input, {
        filename: "Example.tsx",
        plugins: [[plugin, { mode: "opt-out", labelHooks: ["useState"], serverComponents: true }]],
        parserOpts: {
          sourceType: "module",
          // Intentionally include an extra plugin to verify it's forwarded
          plugins: [...parserPlugins],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
        // Ensure Babel can parse TSX
        presets: [],
      });

      const code = transformResult?.code ?? "";
      expect(code).toBeTypeOf("string");
      // Sanity: transformed code should be parseable with the same parser plugins
      const reparsed = parse(code, {
        filename: "Example.tsx",
        parserOpts: {
          sourceType: "module",
          plugins: [...parserPlugins],
        },
      });
      expect(reparsed).toBeTruthy();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("preserves JSX runtime imports when replacing the Program AST", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const input = `
        import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
        "use client";
        export function X() { return <div /> }
      `;

      const result = transformSync(input, {
        filename: "X.tsx",
        plugins: [[plugin, { mode: "opt-out", serverComponents: true }]],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        babelrc: false,
        configFile: false,
      });

      const code = result?.code ?? "";
      expect(code).toContain('from "react/jsx-dev-runtime"');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
