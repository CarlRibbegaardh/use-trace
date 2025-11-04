# auto-tracer-plugin-babel (WIP)

Babel plugin that delegates to `auto-tracer-inject-core` to inject `useAutoTracer()` into React components.

- Options mirror `TransformConfig` from the core.
- Intended for use in Next.js (App Router) with `serverComponents` set appropriately.
- Test-first development: unit tests drive the minimal viable implementation.

Usage (example .babelrc):

```json
{
  "presets": ["next/babel"],
  "plugins": [["auto-tracer-plugin-babel", { "serverComponents": true }]]
}
```

> Note: This package is under active development in this repository.
