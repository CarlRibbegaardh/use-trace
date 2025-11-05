import { describe, it, expect, vi } from "vitest";

describe("babel interop branch coverage in one test", () => {
  it("covers both default-object and direct-function interop branches", async () => {
    // First: default-object branch (typeof traverse !== 'function')
    vi.resetModules();
    vi.doMock("@babel/traverse", () => ({
      // no __esModule on purpose to make the imported value an object
      default: (_ast: unknown, _visitors: unknown) => {
        // no-op
      },
    }));
    vi.doMock("@babel/generator", () => ({
      default: () => ({ code: "// gen-default-obj", map: undefined as unknown }),
    }));

  const { transform: transformA } = await import("../../src/functions/transform/transform.js");
    const resA = transformA("function A(){ return <div/> }", {
      filename: "src/A.tsx",
      config: { mode: "opt-out", importSource: "auto-tracer", include: ["**/*.tsx"], exclude: [], labelHooks: ["useState"], labelHooksPattern: "" },
    });
    expect(resA.code).toBe("// gen-default-obj");
    expect(resA.injected).toBe(false);

    // Second: direct-function branch (typeof traverse === 'function')
    vi.resetModules();
    vi.doMock("@babel/traverse", () => ({
      __esModule: true,
      default: (_ast: unknown, _visitors: unknown) => {
        // no-op
      },
    }));
    vi.doMock("@babel/generator", () => ({
      __esModule: true,
      default: () => ({ code: "// gen-func", map: undefined as unknown }),
    }));

  const { transform: transformB } = await import("../../src/functions/transform/transform.js");
    const resB = transformB("function B(){ return <div/> }", {
      filename: "src/B.tsx",
      config: { mode: "opt-out", importSource: "auto-tracer", include: ["**/*.tsx"], exclude: [], labelHooks: ["useState"], labelHooksPattern: "" },
    });
    expect(resB.code).toBe("// gen-func");
    expect(resB.injected).toBe(false);
  });
});
