/**
 * matchesPattern
 *
 * Performs a simple glob-like match for a given file path against a list of patterns.
 * Supports:
 * - `**\/*.ext` and directory patterns like `**\/dir\/\*\*`
 * - wildcard segments like `**\/*.test.*`
 * - naive brace expansion like `**\/*.{tsx,jsx}` and `**\/*.{test,spec}.js`
 */
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
