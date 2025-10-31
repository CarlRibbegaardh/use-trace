import { createUnplugin } from 'unplugin';
import type { TransformConfig } from 'auto-trace-inject-core';
import { transform, normalizeConfig, shouldProcessFile } from 'auto-trace-inject-core';

export interface AutoTraceOptions extends Partial<TransformConfig> {
  // Additional Vite-specific options can be added here
}

export const autoTrace = createUnplugin<AutoTraceOptions | undefined>((options = {}) => {
  const config = normalizeConfig(options);

  return {
    name: 'auto-trace-inject',
    enforce: 'pre',  // Run before other transformations
    transformInclude(id: string) {
      // Only transform in development mode
      if (process.env.NODE_ENV === 'production') {
        return false;
      }

      // Check if environment flag disables injection
      if (process.env.TRACE_INJECT === '0') {
        return false;
      }

      return shouldProcessFile(id, config);
    },
    transform(code: string, id: string) {
      try {
        const result = transform(code, {
          filename: id,
          config
        });

        if (result.injected) {
          return {
            code: result.code,
            map: result.map
          };
        }

        return null; // No transformation needed
      } catch (error) {
        // Log error but don't fail the build
        console.warn(`Auto-trace transform failed for ${id}:`, error);
        return null;
      }
    }
  };
});

// Export for Vite
export default autoTrace.vite;
