import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "@auto-tracer/plugin-vite-react18";
import path from "path";

export default defineConfig({
  plugins: [
    autoTracer.vite({
      mode: "opt-out",
      importSource: "@auto-tracer/react18",
      include: ["src/**/*.tsx"],
      exclude: ["**/*.test.*", "**/*.spec.*"],
      labelHooks: ["useState", "useReducer"],
      labelHooksPattern: "^use[A-Z].*",
      buildWithWorkspaceLibs: false,
    }),
    react(),
  ],
  server: {
    port: 5201,
    strictPort: true,
    cors: true,
  },
  preview: {
    port: 5201,
    strictPort: true,
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/mount.tsx"),
      name: "Island1",
      formats: ["umd"],
      fileName: () => "island.umd.js",
    },
    rollupOptions: {
      external: [], // Bundle everything - no externals
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "island.css";
          return assetInfo.name || "asset";
        },
      },
    },
  },
});
