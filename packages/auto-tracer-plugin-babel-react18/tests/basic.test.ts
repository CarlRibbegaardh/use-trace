import { describe, it, expect } from "vitest";
import { transformSync } from "@babel/core";
import plugin from "../src/index";

const inputCode = `
  // no useAutoTracer import here initially
  export function Hello() {
    const [count, setCount] = useState(0);
    return <div>Hello {count}</div>;
  }
`;

const inputCodeWithTraceDisable = `
  // @trace-disable
  export function DisabledComponent() {
    const [count, setCount] = useState(0);
    return <div>Disabled {count}</div>;
  }
`;

const serverComponentCode = `
  // This is a Server Component (no "use client")
  export function ServerHello() {
    const data = getServerData();
    return <div>Server Hello {data}</div>;
  }
`;

const clientComponentCode = `
  "use client";

  export function ClientHello() {
    const [count, setCount] = useState(0);
    return <div>Client Hello {count}</div>;
  }
`;

describe("@auto-tracer/plugin-babel-react18", () => {
  it("injects useAutoTracer into a component with hooks (opt-out mode)", () => {
    // Set NODE_ENV to development to enable transformation
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const result = transformSync(inputCode, {
        filename: "Hello.tsx",
        plugins: [[plugin, { mode: "opt-out", labelHooks: ["useState"] }]], // Use opt-out mode like Vite plugin
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
      });

      const code = result?.code ?? "";
      // Expect import to be present or a call to useAutoTracer injected
      expect(code).toMatch(/useAutoTracer\(/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("does not transform in production mode", () => {
    // Set NODE_ENV to production to disable transformation
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const result = transformSync(inputCode, {
        filename: "Hello.tsx",
        plugins: [[plugin, { mode: "opt-out", labelHooks: ["useState"] }]],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
      });

      const code = result?.code ?? "";
      // Should not contain any auto-tracer imports or calls
      expect(code).not.toMatch(/import.*useAutoTracer/);
      expect(code).not.toMatch(/const.*useAutoTracer/);
      expect(code).not.toMatch(/auto-tracer/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("respects TRACE_INJECT=0 environment variable", () => {
    // Set TRACE_INJECT to 0 to disable transformation
    const originalNodeEnv = process.env.NODE_ENV;
    const originalTraceInject = process.env.TRACE_INJECT;
    process.env.NODE_ENV = "development";
    process.env.TRACE_INJECT = "0";

    try {
      const result = transformSync(inputCode, {
        filename: "Hello.tsx",
        plugins: [[plugin, { mode: "opt-out", labelHooks: ["useState"] }]],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
      });

      const code = result?.code ?? "";
      // Should not contain any auto-tracer imports or calls
      expect(code).not.toMatch(/import.*useAutoTracer/);
      expect(code).not.toMatch(/const.*useAutoTracer/);
      expect(code).not.toMatch(/auto-tracer/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalTraceInject !== undefined) {
        process.env.TRACE_INJECT = originalTraceInject;
      } else {
        delete process.env.TRACE_INJECT;
      }
    }
  });

  it("respects @trace-disable pragma", () => {
    // Set NODE_ENV to development to enable transformation
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const result = transformSync(inputCodeWithTraceDisable, {
        filename: "DisabledComponent.tsx",
        plugins: [[plugin, { mode: "opt-out", labelHooks: ["useState"] }]],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
      });

      const code = result?.code ?? "";
      // Should not contain any auto-tracer imports or calls due to @trace-disable
      expect(code).not.toMatch(/import.*useAutoTracer/);
      expect(code).not.toMatch(/const.*useAutoTracer/);
      expect(code).not.toMatch(/auto-tracer/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('with serverComponents=true, skips injection when no "use client"', () => {
    // Set NODE_ENV to development to enable transformation
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const result = transformSync(serverComponentCode, {
        filename: "ServerComponent.tsx",
        plugins: [[plugin, { mode: "opt-out", serverComponents: true }]],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
      });

      const code = result?.code ?? "";
      // Should not contain any auto-tracer imports or calls in server component
      expect(code).not.toMatch(/import.*useAutoTracer/);
      expect(code).not.toMatch(/const.*useAutoTracer/);
      expect(code).not.toMatch(/auto-tracer/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('with serverComponents=true, injects when "use client" is present', () => {
    // Set NODE_ENV to development to enable transformation
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const result = transformSync(clientComponentCode, {
        filename: "ClientComponent.tsx",
        plugins: [
          [
            plugin,
            {
              mode: "opt-out",
              serverComponents: true,
              labelHooks: ["useState"],
            },
          ],
        ],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
      });

      const code = result?.code ?? "";
      // Should contain auto-tracer injection in client component
      expect(code).toMatch(/useAutoTracer\(/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("forwards labelHooks and labelHooksPattern to core correctly", () => {
    // Set NODE_ENV to development to enable transformation
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const customHookCode = `
      export function CustomComponent() {
        const [count, setCount] = useState(0);
        const data = useCustomHook();
        const query = useQuery();
        return <div>{count} {data} {query}</div>;
      }
    `;

    try {
      const result = transformSync(customHookCode, {
        filename: "CustomComponent.tsx",
        plugins: [
          [
            plugin,
            {
              mode: "opt-out",
              labelHooks: ["useState", "useCustomHook"],
              labelHooksPattern: "^use[A-Z].*",
            },
          ],
        ],
        parserOpts: {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        },
        generatorOpts: {
          retainLines: true,
        },
        babelrc: false,
        configFile: false,
        sourceMaps: false,
      });

      const code = result?.code ?? "";
      // Should contain auto-tracer injection and labeling calls
      expect(code).toMatch(/useAutoTracer\(/);
      expect(code).toMatch(/labelState.*count/);
      expect(code).toMatch(/labelState.*data/);
      expect(code).toMatch(/labelState.*query/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
