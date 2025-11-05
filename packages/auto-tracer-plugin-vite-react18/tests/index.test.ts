import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { autoTracer } from "../src/index";
import type { AutoTracerOptions } from "../src/index";
import type { TransformConfig, ComponentInfo } from "@auto-tracer/inject-react18";

// Mock the auto-tracer-inject-core module
vi.mock("@auto-tracer/inject-react18", () => ({
  transform: vi.fn(),
  normalizeConfig: vi.fn(),
  shouldProcessFile: vi.fn(),
}));

import {
  transform,
  normalizeConfig,
  shouldProcessFile,
} from "@auto-tracer/inject-react18";

describe("@auto-tracer/plugin-vite-react18", () => {
  const mockTransform = vi.mocked(transform);
  const mockNormalizeConfig = vi.mocked(normalizeConfig);
  const mockShouldProcessFile = vi.mocked(shouldProcessFile);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.NODE_ENV;
    delete process.env.TRACE_INJECT;

    // Default mock implementations
    const defaultConfig: Required<TransformConfig> = {
      mode: "opt-out",
      include: ["**/*.tsx"],
      exclude: [],
      serverComponents: false,
      importSource: "@auto-tracer/react18",
      labelHooks: [],
      labelHooksPattern: "",
    };
    mockNormalizeConfig.mockReturnValue(defaultConfig);
    mockShouldProcessFile.mockReturnValue(true);

    const mockComponent: ComponentInfo = {
      name: "TestComponent",
      isAnonymous: false,
      node: {},
    };
    mockTransform.mockReturnValue({
      code: "transformed code",
      injected: true,
      components: [mockComponent],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("plugin creation", () => {
    it("should create unplugin instance", () => {
      const pluginInstance = autoTracer;

      expect(pluginInstance).toBeDefined();
      expect(typeof pluginInstance).toBe("object");
      expect(pluginInstance).toHaveProperty("vite");
    });

    it("should create vite plugin with default options", () => {
      const vitePlugin = autoTracer.vite();

      expect(vitePlugin).toBeDefined();
      expect(Array.isArray(vitePlugin)).toBe(false);
      expect(typeof vitePlugin).toBe("object");
    });

    it("should create vite plugin with custom options", () => {
      const options: AutoTracerOptions = {
        mode: "opt-in",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*"],
      };

      const vitePlugin = autoTracer.vite(options);

      expect(vitePlugin).toBeDefined();
      expect(mockNormalizeConfig).toHaveBeenCalledWith(options);
    });
  });

  describe("vite plugin structure", () => {
    it("should create a valid vite plugin object", () => {
      const vitePlugin = autoTracer.vite();

      expect(vitePlugin).toBeDefined();
      expect(typeof vitePlugin).toBe("object");
      // Plugin should have some expected properties
      expect(vitePlugin).toHaveProperty("name");
      expect(vitePlugin).toHaveProperty("enforce");
    });
  });

  describe("configuration integration", () => {
    it("should pass normalized config to transform functions", () => {
      const customConfig: Required<TransformConfig> = {
        mode: "opt-in",
        include: ["custom/**/*.tsx"],
        exclude: ["**/*.spec.*"],
        serverComponents: false,
        importSource: "@auto-tracer/react18",
        labelHooks: [],
        labelHooksPattern: "",
      };

      mockNormalizeConfig.mockReturnValue(customConfig);

      autoTracer.vite(customConfig);

      expect(mockNormalizeConfig).toHaveBeenCalledWith(customConfig);
    });

    it("should support all AutoTracerOptions", () => {
      const options: AutoTracerOptions = {
        mode: "opt-in",
        include: ["src/**/*.tsx", "components/**/*.jsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        importSource: "custom-tracer",
        labelHooks: ["useState", "useCustomHook"],
        labelHooksPattern: "^use[A-Z].*",
      };

      const vitePlugin = autoTracer.vite(options);

      expect(vitePlugin).toBeDefined();
      expect(mockNormalizeConfig).toHaveBeenCalledWith(options);
    });
  });

  describe("default export", () => {
    it("should export vite plugin as default", () => {
      // The default export is tested implicitly through the import at the top
      // This test verifies the module structure is correct
      expect(autoTracer).toBeDefined();
      expect(autoTracer.vite).toBeDefined();
    });
  });

  describe("vite plugin behavior", () => {
    let vitePlugin: any;

    beforeEach(() => {
      vitePlugin = autoTracer.vite();
    });

    it("should have correct plugin name", () => {
      expect(vitePlugin.name).toBe("auto-tracer-inject");
    });

    it("should enforce pre transform order", () => {
      expect(vitePlugin.enforce).toBe("pre");
    });

    describe("transformInclude", () => {
      it("should exclude files in production mode", () => {
        process.env.NODE_ENV = "production";

        const result = vitePlugin.transformInclude("src/Component.tsx");

        expect(result).toBe(false);
      });

      it("should exclude files when TRACE_INJECT is disabled", () => {
        process.env.TRACE_INJECT = "0";

        const result = vitePlugin.transformInclude("src/Component.tsx");

        expect(result).toBe(false);
      });

      it("should include files in development mode", () => {
        process.env.NODE_ENV = "development";

        const result = vitePlugin.transformInclude("src/Component.tsx");

        expect(result).toBe(true);
        expect(mockShouldProcessFile).toHaveBeenCalledWith(
          "src/Component.tsx",
          expect.any(Object)
        );
      });

      it("should include files when NODE_ENV is not set (defaults to development)", () => {
        const result = vitePlugin.transformInclude("src/Component.tsx");

        expect(result).toBe(true);
        expect(mockShouldProcessFile).toHaveBeenCalledWith(
          "src/Component.tsx",
          expect.any(Object)
        );
      });

      it("should respect shouldProcessFile result", () => {
        process.env.NODE_ENV = "development";
        mockShouldProcessFile.mockReturnValue(false);

        const result = vitePlugin.transformInclude("src/Component.tsx");

        expect(result).toBe(false);
      });
    });

    describe("transform", () => {
      it("should transform code when injection occurs", () => {
        const code = "function MyComponent() { return <div />; }";
        const id = "src/Component.tsx";

        const result = vitePlugin.transform(code, id);

        expect(mockTransform).toHaveBeenCalledWith(code, {
          filename: id,
          config: expect.any(Object),
        });
        expect(result).toEqual({
          code: "transformed code",
          map: undefined,
        });
      });

      it("should return null when no injection occurs", () => {
        mockTransform.mockReturnValue({
          code: "original code",
          injected: false,
          components: [],
        });

        const code = "function MyComponent() { return <div />; }";
        const id = "src/Component.tsx";

        const result = vitePlugin.transform(code, id);

        expect(result).toBe(null);
      });

      it("should handle transform errors gracefully", () => {
        const consoleWarnSpy = vi
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        mockTransform.mockImplementation(() => {
          throw new Error("Transform failed");
        });

        const code = "function MyComponent() { return <div />; }";
        const id = "src/Component.tsx";

        const result = vitePlugin.transform(code, id);

        expect(result).toBe(null);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Auto-trace transform failed for src/Component.tsx:",
          expect.any(Error)
        );

        consoleWarnSpy.mockRestore();
      });

      it("should return source map when available", () => {
        const mockComponent: ComponentInfo = {
          name: "TestComponent",
          isAnonymous: false,
          node: {},
        };
        mockTransform.mockReturnValue({
          code: "transformed code",
          injected: true,
          components: [mockComponent],
          map: { version: 3, sources: [], mappings: "" },
        });

        const code = "function MyComponent() { return <div />; }";
        const id = "src/Component.tsx";

        const result = vitePlugin.transform(code, id);

        expect(result).toEqual({
          code: "transformed code",
          map: { version: 3, sources: [], mappings: "" },
        });
      });
    });
  });
});
