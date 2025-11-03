import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// This test enforces that the legacy functions/config.ts file does not contain any exports.
// If the file exists, it must be empty (no exports) to prevent stray barrels.
describe('legacy functions/config.ts should not export anything', () => {
  it('src/functions/config.ts must be absent or contain no exports', () => {
    const filePath = path.resolve(__dirname, '../../src/functions/config.ts');
    const exists = fs.existsSync(filePath);
    if (!exists) {
      expect(exists).toBe(false);
      return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    // No 'export' statements are allowed in the legacy file
    expect(/\bexport\b/.test(content)).toBe(false);
  });
});
