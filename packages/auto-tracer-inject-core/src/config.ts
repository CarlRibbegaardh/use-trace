import type { TransformConfig } from './types.js';

export const DEFAULT_CONFIG: Required<TransformConfig> = {
  mode: 'opt-in',
  include: ['**/*.tsx', '**/*.jsx'],
  exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
  serverComponents: false,
  importSource: 'auto-tracer'
};

export function normalizeConfig(config: Partial<TransformConfig> = {}): Required<TransformConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...config
  };
}

export function matchesPattern(filepath: string, patterns: string[]): boolean {
  // Simple glob matching - just check extensions for now
  return patterns.some(pattern => {
    if (pattern.includes('**/*.')) {
      const ext = pattern.split('**/*.')[1];
      return filepath.endsWith(`.${ext}`);
    }
    return false;
  });
}

export function shouldProcessFile(filepath: string, config: Required<TransformConfig>): boolean {
  // Check exclude patterns first
  if (matchesPattern(filepath, config.exclude)) {
    return false;
  }

  // Check include patterns
  return matchesPattern(filepath, config.include);
}
