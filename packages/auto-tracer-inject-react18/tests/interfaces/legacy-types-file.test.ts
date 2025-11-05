import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// This test enforces that the legacy interfaces/types.ts file has been removed.
describe('legacy interfaces/types.ts should be removed', () => {
  it('src/interfaces/types.ts must not exist', () => {
    const filePath = path.resolve(__dirname, '../../src/interfaces/types.ts');
    const exists = fs.existsSync(filePath);
    expect(exists).toBe(false);
  });
});
