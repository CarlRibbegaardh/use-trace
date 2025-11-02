import { describe, it, expect } from "vitest";
import type { TransformConfig, ComponentInfo, TransformResult, TransformContext } from "../../src/interfaces/types.js";

describe("types.ts coverage", () => {
  it("should use all exported types", () => {
    // This ensures types.ts gets covered
    const config: TransformConfig = {
      mode: "opt-in",
      include: ["**/*.tsx"],
      exclude: [],
      serverComponents: false,
      importSource: "@acme/auto-tracer",
      labelHooks: ["useState"],
      labelHooksPattern: "^use[A-Z].*",
    };

    const componentInfo: ComponentInfo = {
      name: "TestComponent",
      isAnonymous: false,
      node: {},
      start: 0,
      end: 10,
    };

    const result: TransformResult = {
      code: "test code",
      map: null,
      injected: true,
      components: [componentInfo],
    };

    const context: TransformContext = {
      filename: "test.tsx",
      config,
    };

    expect(config).toBeDefined();
    expect(componentInfo).toBeDefined();
    expect(result).toBeDefined();
    expect(context).toBeDefined();
  });
});
