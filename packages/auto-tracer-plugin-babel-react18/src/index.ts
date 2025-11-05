import type { PluginObj, PluginPass, ParserOptions, ParseResult } from "@babel/core";
import * as babel from "@babel/core";
import {
  transform,
  normalizeConfig,
  shouldProcessFile,
  type TransformConfig,
} from "@auto-tracer/inject-react18";

export interface AutoTracerOptions extends Partial<TransformConfig> {
  // Additional Babel-specific options can be added here
}

interface BabelPluginWithParserOverride extends PluginObj<PluginPass> {
  parserOverride?: (
    code: string,
    parserOpts: ParserOptions,
    parse: (code: string, parserOpts: ParserOptions) => ParseResult | null
  ) => ParseResult | null;
}

// Must be default export for CJS compatibility for babel
function autoTracerBabelPlugin(
  _babel: typeof babel,
  options: AutoTracerOptions = {}
): BabelPluginWithParserOverride {
  const config = normalizeConfig(options);

  return {
    name: "@auto-tracer/plugin-babel-react18",
    visitor: {},
    parserOverride(code: string, parserOpts: ParserOptions, parse: (code: string, parserOpts: ParserOptions) => ParseResult | null) {
      const anyOpts = parserOpts as unknown as { sourceFilename?: string; filename?: string };
      const filename = anyOpts.sourceFilename || anyOpts.filename || "unknown.tsx";
      try {
        // Only transform in development mode
        if (process.env.NODE_ENV === "production") {
          return parse(code, parserOpts);
        }
        if (process.env.TRACE_INJECT === "0") {
          return parse(code, parserOpts);
        }
        if (!shouldProcessFile(filename, config)) {
          return parse(code, parserOpts);
        }

        const result = transform(code, { filename, config });
        if (result.code !== code) {
          return parse(result.code, parserOpts);
        }
        return parse(code, parserOpts);
      } catch (error) {
        console.warn(`Auto-trace transform failed for ${filename}:`, error);
        return parse(code, parserOpts);
      }
    },
  };
}

// Default export for ESM
export default autoTracerBabelPlugin;
