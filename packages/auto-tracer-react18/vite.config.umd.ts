import { defineConfig } from "vite";
import { resolve } from "path";

/**
 * Vite configuration for building UMD bundle of @auto-tracer/react18.
 *
 * This UMD build is used for production builds with workspace libraries
 * where the auto-tracer plugin injects imports into libraries that don't
 * have @auto-tracer/react18 as a dependency.
 *
 * The UMD exposes window.AutoTracerReact18 global, which rollup-plugin-external-globals
 * maps to during builds.
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "AutoTracerReact18",
      fileName: () => "index.umd.js",
      formats: ["umd"],
    },
    rollupOptions: {
      // Externalize React and ReactDOM - they must come from the consuming app
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    outDir: "dist",
    emptyOutDir: false, // Don't clear dist since we also have ESM/CJS builds
  },
});
