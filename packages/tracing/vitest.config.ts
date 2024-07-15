import { type ConfigEnv, type UserConfig, defineConfig } from "vitest/config";

// https://vitest.dev/guide/#configuring-vitest
const config = defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  console.log("command:", command); // Will  return "build" or "serve"
  console.log("mode:", mode); // Will return "production", "ci" or "development". We use --mode ci for coverage on ci builds.

  const ci = mode === "ci";

  const result: UserConfig = {
    test: {
      globals: true,
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      environment: "jsdom",
      coverage: {
        provider: "v8",
        all: true,
        reporter: ci
          ? [
              ["lcov", { projectRoot: "./src" }],
              ["json", { file: "coverage.json" }],
            ]
          : ["html"],
      },
      reporters: ["junit", "basic"],
      outputFile: { junit: "test/junit.xml" },
    },
  };
  return result;
});

// eslint-disable-next-line import/no-default-export
export default config;
