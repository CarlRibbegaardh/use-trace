import { createUnplugin } from "unplugin";
import type { TransformConfig } from "@auto-tracer/inject-react18";
import {
  transform,
  normalizeConfig,
  shouldProcessFile,
} from "@auto-tracer/inject-react18";
import externalGlobals from "rollup-plugin-external-globals";
import { readFileSync } from "fs";
import { resolve } from "path";

export interface AutoTracerOptions extends Partial<TransformConfig> {
  /**
   * Enable automatic UMD loading for production builds with workspace libraries.
   *
   * When true, the plugin will:
   * - Auto-configure rollup-plugin-external-globals
   * - Emit the UMD build as an asset
   * - Inject a script tag to load it before the app bundle
   *
   * Only needed for production builds (`vite build`) in monorepos where
   * workspace libraries are bundled. Development mode works without this.
   *
   * @default false
   */
  buildWithWorkspaceLibs?: boolean;
}

export const autoTracer = createUnplugin<AutoTracerOptions | undefined>(
  (options = {}) => {
    const config = normalizeConfig(options);
    const enableBuildSupport = options.buildWithWorkspaceLibs ?? false;

    return {
      name: "auto-tracer-inject",
      enforce: "pre", // Run before other transformations

      // Vite-specific hooks
      vite: {
        config(viteConfig, { command }) {
          // Only configure for production builds
          if (command !== "build" || !enableBuildSupport) return;

          // Auto-add external-globals plugin
          viteConfig.build = viteConfig.build || {};
          viteConfig.build.rollupOptions = viteConfig.build.rollupOptions || {};
          const plugins = viteConfig.build.rollupOptions.plugins;

          // Ensure plugins is an array
          if (Array.isArray(plugins)) {
            plugins.push(
              externalGlobals({
                "@auto-tracer/react18": "window.AutoTracerReact18",
                react: "window.React",
                "react-dom": "window.ReactDOM",
              })
            );
          } else {
            viteConfig.build.rollupOptions.plugins = [
              externalGlobals({
                "@auto-tracer/react18": "window.AutoTracerReact18",
                react: "window.React",
                "react-dom": "window.ReactDOM",
              }),
            ];
          }
        },

        transformIndexHtml: {
          order: "pre",
          handler(html) {
            // Only inject during build with workspace lib support
            if (!enableBuildSupport) return html;

            // Use Vite's tags API for proper path resolution
            return {
              html,
              tags: [
                {
                  tag: "script",
                  attrs: {
                    src: "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
                    crossorigin: "",
                  },
                  injectTo: "head-prepend",
                },
                {
                  tag: "script",
                  attrs: {
                    src: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
                    crossorigin: "",
                  },
                  injectTo: "head-prepend",
                },
                {
                  tag: "script",
                  attrs: { src: "/auto-tracer-react18.umd.js" },
                  injectTo: "head-prepend",
                },
              ],
            };
          },
        },

        // Copy UMD to output during build
        generateBundle() {
          if (!enableBuildSupport) return;

          try {
            // Resolve UMD path from node_modules
            const umdPath = resolve(
              process.cwd(),
              "node_modules/@auto-tracer/react18/dist/index.umd.js"
            );
            const umdContent = readFileSync(umdPath, "utf-8");

            // Emit as asset
            this.emitFile({
              type: "asset",
              fileName: "auto-tracer-react18.umd.js",
              source: umdContent,
            });
          } catch (error) {
            console.error("AutoTracer plugin: Failed to emit UMD file:", error);
          }
        },
      },

      transformInclude(id: string) {
        // Check if environment flag disables injection
        if (process.env.TRACE_INJECT === "0") {
          return false;
        }

        return shouldProcessFile(id, config);
      },
      transform(code: string, id: string) {
        try {
          const result = transform(code, {
            filename: id,
            config,
          });

          if (result.injected) {
            return {
              code: result.code,
              map: result.map,
            };
          }

          return null; // No transformation needed
        } catch (error) {
          // Log error but don't fail the build
          console.warn(`Auto-trace transform failed for ${id}:`, error);
          return null;
        }
      },
    };
  }
);

// Export for Vite
export default autoTracer.vite;
