import { describe, it, expect, vi } from "vitest";

// This test targets the opposite interop branch: when traverse/generator are functions directly
describe("babel interop native function paths", () => {
  it("uses direct functions when traverse/generator are functions", async () => {
    vi.resetModules();

    // Mock traverse and generator as bare functions so typeof === 'function'
    vi.doMock("@babel/traverse", () => ({
      __esModule: true,
      default: (_ast: unknown, _visitors: unknown) => {
        // no-op traversal
      },
    }));

    vi.doMock("@babel/generator", () => ({
      __esModule: true,
      default: () => ({ code: "// gen-native", map: undefined as unknown }),
    }));

  const { transform } = await import("../../src/functions/transform/transform.js");

    const code = `
      function MyComponent() {
        const [c] = useState(0);
        return <div>{c}</div>;
      }
    `;

    const result = transform(code, {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    });

    // With no-op traverse and native generator, branch executes and our stub emits the code
    expect(result.injected).toBe(false);
    expect(result.code).toBe("// gen-native");
  });
});
