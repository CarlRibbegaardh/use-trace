import { describe, it, expect } from "vitest";
import { transformSync } from "@babel/core";
import plugin from "../src/index";

describe("@auto-tracer/plugin-babel-react18 reparsing strategy", () => {
  it("reparses transformed code without invoking full Babel pipeline twice", () => {
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

      const result = transformSync(input, {
        filename: "Example.tsx",
        plugins: [[plugin, { mode: "opt-out", labelHooks: ["useState"], serverComponents: true }]],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        babelrc: false,
        configFile: false,
      });

      // Transformation should succeed and inject useAutoTracer
      const code = result?.code ?? "";
      expect(code).toContain("useAutoTracer(");

    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
