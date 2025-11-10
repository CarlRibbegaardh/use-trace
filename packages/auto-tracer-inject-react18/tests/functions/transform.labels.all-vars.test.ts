import { describe, it, expect } from "vitest";
import { transform } from "../../src/functions/transform/transform.js";
import type { TransformContext } from "../../src/interfaces/TransformContext.js";

describe("labelState - all variables in destructuring", () => {
  it("should inject all array destructured variables with name-value pairs", () => {
    const code = `
      function MyComponent() {
        const [title, setTitle] = useState('');
        return <div>{title}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: ["useState"],
        labelHooksPattern: "",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Should inject: __autoTracer.labelState(0, "title", title, "setTitle", setTitle)
    // Hook index first, then alternating name-value pairs
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(\s*0\s*,\s*['"]title['"]\s*,\s*title\s*,\s*['"]setTitle['"]\s*,\s*setTitle\s*\)/
    );
  });

  it("should inject all object destructured variables with name-value pairs", () => {
    const code = `
      function MyComponent() {
        const { a, b, c } = useMyHook();
        return <div>{a}{b}{c}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z]",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Should inject: __autoTracer.labelState(0, "a", a, "b", b, "c", c)
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(\s*0\s*,\s*['"]a['"]\s*,\s*a\s*,\s*['"]b['"]\s*,\s*b\s*,\s*['"]c['"]\s*,\s*c\s*\)/
    );
  });

  it("should handle array destructuring with rest elements", () => {
    const code = `
      function MyComponent() {
        const [first, second, ...rest] = useMyHook();
        return <div>{first}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z]",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Should inject all named variables including rest
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(\s*0\s*,\s*['"]first['"]\s*,\s*first\s*,\s*['"]second['"]\s*,\s*second\s*,\s*['"]rest['"]\s*,\s*rest\s*\)/
    );
  });

  it("should handle object destructuring with rest", () => {
    const code = `
      function MyComponent() {
        const { a, b, ...rest } = useMyHook();
        return <div>{a}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z]",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Should inject all including rest
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(\s*0\s*,\s*['"]a['"]\s*,\s*a\s*,\s*['"]b['"]\s*,\s*b\s*,\s*['"]rest['"]\s*,\s*rest\s*\)/
    );
  });

  it("should handle single variable (non-destructured)", () => {
    const code = `
      function MyComponent() {
        const value = useMyHook();
        return <div>{value}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z]",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Should inject single name-value pair
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(\s*0\s*,\s*['"]value['"]\s*,\s*value\s*\)/
    );
  });

  it("should handle array destructuring with null/undefined elements", () => {
    const code = `
      function MyComponent() {
        const [, second, third] = useMyHook();
        return <div>{second}{third}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z]",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Should only inject defined elements
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(\s*0\s*,\s*['"]second['"]\s*,\s*second\s*,\s*['"]third['"]\s*,\s*third\s*\)/
    );
    expect(result.code).not.toMatch(/'undefined'/);
  });

  it("should handle renamed object destructuring", () => {
    const code = `
      function MyComponent() {
        const { original: renamed, other } = useMyHook();
        return <div>{renamed}{other}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/MyComponent.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: [],
        labelHooks: [],
        labelHooksPattern: "^use[A-Z]",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Should use the local variable name (renamed), not the property name
    expect(result.code).toMatch(
      /__autoTracer\.labelState\(\s*0\s*,\s*['"]renamed['"]\s*,\s*renamed\s*,\s*['"]other['"]\s*,\s*other\s*\)/
    );
  });
});
