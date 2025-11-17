import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Test configuration for pattern testing with manual labelState calls
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Different port for pattern testing
    strictPort: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
});
