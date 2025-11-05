import { describe, it, expect } from 'vitest';
import { transform } from '../../src/functions/transform/transform.js';
import { normalizeConfig } from '../../src/functions/config/normalizeConfig.js';

describe('transform with RSC', () => {
  it('should NOT transform a server component when serverComponents is true', () => {
    const code = 'export function MyComponent() { return <div>Hello</div>; }';
    const config = normalizeConfig({ serverComponents: true, mode: 'opt-out', include: ['**/*'], exclude: [] });
    const result = transform(code, { filename: 'MyComponent.tsx', config });

    // This is the failing test.
    // Currently, the transform WILL inject the hook, causing this test to fail.
    // Once the logic is corrected, this test will pass.
    expect(result?.code).not.toContain('useAutoTracer');
  });

  it('should transform a client component when serverComponents is true', () => {
    const code = '"use client";\n\nexport function MyComponent() { return <div>Hello</div>; }';
    const config = normalizeConfig({ serverComponents: true, mode: 'opt-out', include: ['**/*'], exclude: [] });
    const result = transform(code, { filename: 'MyComponent.tsx', config });
    expect(result?.code).toContain('useAutoTracer');
  });

  it('should still transform a component when serverComponents is false', () => {
    const code = 'export function MyComponent() { return <div>Hello</div>; }';
    const config = normalizeConfig({ serverComponents: false, mode: 'opt-out', include: ['**/*'], exclude: [] });
    const result = transform(code, { filename: 'MyComponent.tsx', config });
    expect(result?.code).toContain('useAutoTracer');
  });
});
