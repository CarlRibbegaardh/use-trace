import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transformSync } from "@babel/core";
import * as babelCore from "@babel/core";

describe("@auto-tracer/plugin-babel-react18 reparsing path", () => {
  let coreParseSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    coreParseSpy = vi
      .spyOn(babelCore as any, "parse")
      .mockImplementation(() => {
        throw new Error("@babel/core.parse must not be called by the plugin");
      });
  });

  afterEach(() => {
    coreParseSpy.mockRestore();
    delete process.env.TRACE_INJECT;
    delete process.env.NODE_ENV;
  });

  it("reparses without invoking @babel/core.parse", async () => {
    // Reset module registry for this test and mock inject-core
    vi.resetModules();
    vi.doMock("@auto-tracer/inject-react18", () => {
      return {
        shouldProcessFile: () => true,
        normalizeConfig: (c: unknown) => c,
        transform: (code: string) => ({ code: `${code}\n// transformed` }),
      };
    });

    // Dynamically import plugin after mocking so it uses the mock for this import only
    const { default: plugin } = await import("../src/index");

    const input = `export function A(){ return <div/> }`;

    const result = transformSync(input, {
      filename: "A.tsx",
      plugins: [[plugin as any, { mode: "opt-out" }]],
      parserOpts: {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      },
      babelrc: false,
      configFile: false,
    });

    expect(result?.code).toBeTypeOf("string");
  });
});
