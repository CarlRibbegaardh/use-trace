import { describe, it, expect, vi } from "vitest";
import { transformSync } from "@babel/core";
import * as babelCore from "@babel/core";
import * as babelParser from "@babel/parser";
import plugin from "../src/index";

describe("auto-tracer-plugin-babel reparsing implementation", () => {
  it("uses @babel/parser.parse and never @babel/core.parse", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const coreParseSpy = vi
      .spyOn(babelCore as any, "parse")
      .mockImplementation(() => {
        throw new Error("@babel/core.parse must not be called");
      });

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
      // And never via @babel/core
      expect(coreParseSpy).not.toHaveBeenCalled();
    } finally {
      parserParseSpy.mockRestore();
      coreParseSpy.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
