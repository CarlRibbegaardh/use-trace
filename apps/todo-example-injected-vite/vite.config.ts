import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "auto-tracer-plugin-vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    mode === "development" &&
      autoTracer.vite({
        mode: "opt-out",
        importSource: "auto-tracer",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        // Enable labeling of common hooks beyond useState/useReducer
        labelHooks: [
          "useState",
          "useReducer",
          "useSelector",
          "useAppSelector",
          "useCustomHook",
          "useCustomHook2WithCustomHookInside",
        ],
        // Also enable pattern matching for custom hooks
        labelHooksPattern: "^use[A-Z].*",
      }),
    react(),
  ].filter(Boolean),
  server: {
    port: 5174,
  },
}));
