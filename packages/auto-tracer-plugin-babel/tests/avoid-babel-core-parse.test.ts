import { describe, it, expect, vi } from "vitest";
import { transformSync } from "@babel/core";
import * as babel from "@babel/core";
import plugin from "../src/index";

describe("auto-tracer-plugin-babel reparsing strategy", () => {
  it("does not call @babel/core.parse when reparsing transformed code", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    // Spy on @babel/core.parse and make it throw if called.
    const parseSpy = vi.spyOn(babel as any, "parse").mockImplementation(() => {
      throw new Error("@babel/core.parse should not be called by the plugin");
    });

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

      // Critically, ensure @babel/core.parse was never invoked
      expect(parseSpy).not.toHaveBeenCalled();
    } finally {
      parseSpy.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
