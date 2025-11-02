import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Test configuration for pattern testing with manual labelState calls
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176, // Different port for pattern testing
  },
  preview: {
    port: 5176,
  },
});
