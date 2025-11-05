import { defineConfig } from "vitest/config";

// https://vitest.dev/guide/#configuring-vitest
export default defineConfig(({ command, mode }) => {
  console.log("command:", command); // Will  return "build" or "serve"
  console.log("mode:", mode); // Will return "production", "ci" or "development". We use --mode ci for coverage on ci builds.

  const ci = mode === "ci";

  return {
    test: {
      pool: "threads",
      globals: true,
      include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
      environment: "jsdom",
      coverage: {
        provider: "v8",
        include: ["src/**/*.{js,ts,jsx,tsx}"],
        exclude: [
          "**/node_modules/**",
          "**/dist/**",
          "**/coverage/**",
          "**/tests/**",
          "**/*.test.*",
          "**/*.spec.*",
          "**/vitest.config.*",
          "**/tsconfig.*",
          "**/index.*",
          "**/interfaces/**",
        ],
        reporter: ci
          ? [
              ["lcov", { projectRoot: "./src" }],
              ["json", { file: "coverage.json" }],
            ]
          : ["html", "text", "json-summary", "text-summary"],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
      reporters: ["default"],
      outputFile: { junit: "test/junit.xml" },
    },
  };
});
