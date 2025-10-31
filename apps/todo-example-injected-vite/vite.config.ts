import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTrace } from "auto-trace-plugin-vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    mode === "development" &&
      autoTrace.vite({
        mode: "opt-out",
        importSource: "use-trace",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
      }),
    react(),
  ].filter(Boolean),
  server: {
    port: 5174,
  },
}));
