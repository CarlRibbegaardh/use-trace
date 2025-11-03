import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// This test enforces that the legacy detect.ts file has been removed as part of the one-export-per-file refactor.
describe('legacy detect.ts should be removed', () => {
  it('src/functions/detect.ts must not exist', () => {
    const filePath = path.resolve(__dirname, '../../src/functions/detect.ts');
    const exists = fs.existsSync(filePath);
    // The legacy file should not exist anymore. If it does, this test will fail.
    expect(exists).toBe(false);
  });
});
