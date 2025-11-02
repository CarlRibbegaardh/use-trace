import type { TransformConfig } from "../interfaces/types.js";

export const DEFAULT_CONFIG: Required<TransformConfig> = {
  mode: "opt-in",
  include: ["**/*.tsx", "**/*.jsx"],
  exclude: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"],
  serverComponents: false,
  importSource: "auto-tracer",
  labelHooks: ["useState", "useReducer"],
  labelHooksPattern: "",
};

export function normalizeConfig(
  config: Partial<TransformConfig> = {}
): Required<TransformConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}

export function matchesPattern(filepath: string, patterns: string[]): boolean {
  // Simple glob matching
  return patterns.some((pattern) => {
    if (pattern.includes("**/*.")) {
      const ext = pattern.split("**/*.")[1];
      if (ext.includes("{") && ext.includes("}")) {
        // Handle brace expansion like **/*.{tsx,jsx} or **/*.{test,spec}.js
        const braceMatch = ext.match(/\{([^}]+)\}/);
        if (braceMatch && braceMatch.index !== undefined) {
          const braceContent = braceMatch[1];
          const beforeBrace = ext.substring(0, braceMatch.index);
          const afterBrace = ext.substring(
            braceMatch.index + braceMatch[0].length
          );
          const options = braceContent.split(",").map((e) => e.trim());

          return options.some((option) => {
            const expandedPattern = beforeBrace + option + afterBrace;
            return filepath.endsWith(`.${expandedPattern}`);
          });
        }
      }
      if (ext.includes("*")) {
        // Handle patterns like **/*.test.*
        const parts = ext.split("*");
        return parts.every((part) => filepath.includes(part));
      }
      return filepath.endsWith(`.${ext}`);
    }
    if (pattern.includes("**/") && pattern.endsWith("/**")) {
      // Handle directory patterns like **/node_modules/**
      const dirName = pattern.split("**/")[1].split("/")[0];
      return (
        filepath.includes(`/${dirName}/`) || filepath.startsWith(`${dirName}/`)
      );
    }
    return false;
  });
}

export function shouldProcessFile(
  filepath: string,
  config: Required<TransformConfig>
): boolean {
  // Check exclude patterns first
  if (matchesPattern(filepath, config.exclude)) {
    return false;
  }

  // Check include patterns
  return matchesPattern(filepath, config.include);
}
