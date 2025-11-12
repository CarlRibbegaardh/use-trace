import { describe, it, expect, vi } from "vitest";
import { transformSync } from "@babel/core";
import * as babelParser from "@babel/parser";
import plugin from "../src/index";

describe("@auto-tracer/plugin-babel-react18 reparsing implementation", () => {
  it("uses @babel/parser.parse and avoids a second @babel/core.parse", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const parserParseSpy = vi.spyOn(babelParser as any, "parse");

    try {
      const input = `
        "use client";
        export function C() {
          const [c, setC] = useState(0);
          return <div>{c}</div>;
        }
      `;

      const result = transformSync(input, {
        filename: "C.tsx",
        plugins: [[plugin, { mode: "opt-out", labelHooks: ["useState"], serverComponents: true }]],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        babelrc: false,
        configFile: false,
      });

      const code = result?.code ?? "";
      expect(code).toContain("useAutoTracer(");

      // Ensure reparsing happened via @babel/parser
      expect(parserParseSpy).toHaveBeenCalled();
    } finally {
      parserParseSpy.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
