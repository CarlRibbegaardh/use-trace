import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "@auto-tracer/plugin-vite-react18";

// Test configuration: ONLY labelHooks (explicit list) - no pattern matching
export default defineConfig({
  plugins: [
    react(),
    autoTracer.vite({
      mode: "opt-out",
      // ONLY explicit hook labeling - for testing isolation
      labelHooks: [
        "useState",
        "useReducer",
        "useSelector",
        "useAppSelector",
        "useCustomHook",
        "useCustomHook2WithCustomHookInside",
      ],
      // labelHooksPattern: undefined, // Explicitly disabled for this test
    }),
  ],
  server: {
    port: 5175, // Different port for explicit testing
  },
  preview: {
    port: 5175,
  },
});
