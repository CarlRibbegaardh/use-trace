import { describe, it, expect, vi } from "vitest";

describe("transform variable declarator branch (mocked detect)", () => {
  it("treats variable declarator as component but skips when init is not a function", async () => {
    vi.resetModules();

    // Mock detect to force isComponentFunction true while init is not a function
    vi.doMock("../../src/functions/detect.js", async () => {
      const real = await vi.importActual<typeof import("../../src/functions/detect.js")>(
        "../../src/functions/detect.js"
      );
      return {
        __esModule: true,
        ...real,
        isComponentFunction: (node: any) => {
          // Force true for VariableDeclarator named ForcedComp
          return real.isComponentFunction(node) ||
            (node && node.type === "VariableDeclarator" && node.id?.name === "ForcedComp");
        },
        extractComponentInfo: (node: any) => {
          if (node && node.type === "VariableDeclarator" && node.id?.name === "ForcedComp") {
            return { name: "ForcedComp", isAnonymous: false, node } as any;
          }
          return real.extractComponentInfo(node as any) as any;
        },
      };
    });

    const { transform } = await import("../../src/functions/transform.js");

    const code = `
      // Variable declarator that our mock will mark as a component, but init is not a function
      const ForcedComp = 42;
    `;

    const result = transform(code, {
      filename: "src/ForcedComp.tsx",
      config: {
        mode: "opt-out",
        importSource: "auto-tracer",
        include: ["**/*.tsx", "**/*.ts"],
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    });

    // Should not inject anything because init isn't a function, covering the false branch
    expect(result.injected).toBe(false);
    expect(result.code).not.toContain("useAutoTracer");
  });

  it("FunctionDeclaration: isComponentFunction true but extractComponentInfo returns null", async () => {
    vi.resetModules();

    vi.doMock("../../src/functions/detect.js", async () => {
      const real = await vi.importActual<typeof import("../../src/functions/detect.js")>(
        "../../src/functions/detect.js"
      );
      return {
        __esModule: true,
        ...real,
        isComponentFunction: (node: any) => {
          return (
            real.isComponentFunction(node) ||
            (node?.type === "FunctionDeclaration" && node?.id?.name === "Ghost")
          );
        },
        extractComponentInfo: (node: any) => {
          if (node?.type === "FunctionDeclaration" && node?.id?.name === "Ghost") {
            return null as any;
          }
          return real.extractComponentInfo(node as any) as any;
        },
      };
    });

    const { transform } = await import("../../src/functions/transform.js");

    const code = `
      function Ghost(){ return <div/> }
    `;

    const result = transform(code, {
      filename: "src/ghost.tsx",
      config: {
        mode: "opt-out",
        importSource: "auto-tracer",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    });

    expect(result.injected).toBe(false);
    expect(result.components).toHaveLength(0);
    expect(result.code).not.toContain("useAutoTracer");
  });
});
