import { describe, it, expect } from 'vitest';
import { parse } from '@babel/parser';
import type { File } from '@babel/types';
import { isClientComponentModule } from '../../../src/functions/detect/isClientComponentModule';

describe('isClientComponentModule', () => {
  it('should return true for a module with "use client"', () => {
    const code = '"use client";\n\nexport function MyComponent() { return <div>Hello</div>; }';
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    expect(isClientComponentModule(ast as File)).toBe(true);
  });

  it('should return false for a module without "use client"', () => {
    const code = 'export function MyComponent() { return <div>Hello</div>; }';
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    expect(isClientComponentModule(ast as File)).toBe(false);
  });

  it('should return false for a module with other directives', () => {
    const code = '"use strict";\n\nexport function MyComponent() { return <div>Hello</div>; }';
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    expect(isClientComponentModule(ast as File)).toBe(false);
  });

  it('should return false for an empty file', () => {
    const code = '';
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    expect(isClientComponentModule(ast as File)).toBe(false);
  });
});
