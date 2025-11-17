import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "@auto-tracer/plugin-vite-react18";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    autoTracer.vite({
      mode: "opt-out",
      importSource: "@auto-tracer/react18",
      include: ["src/**/*.tsx"],
      exclude: ["**/*.test.*", "**/*.spec.*"],
      // Also enable pattern matching for custom hooks
      labelHooksPattern: "^use[A-Z].*",
      // Enable automatic UMD loading for production builds with workspace libraries
      buildWithWorkspaceLibs: mode === "production",
    }),
    react(),
  ],
  server: {
    port: 5180,
    strictPort: true,
  },
}));
