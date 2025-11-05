# Auto-injecting `useAutoTracer` via AST Transform

This document defines a strict, production-safe approach to auto-inject `useAutoTracer` into React function components using a build-time AST transform, along with package structure, integration adapters, and operational requirements.

## Goals

- Automatically call `useAutoTracer` in function components without manual edits
- Keep everything dev-only by default; zero runtime overhead in production builds
- Preserve React Hook Rules and runtime semantics
- Provide clear opt-in/opt-out controls

## Constraints and guardrails

- React Hook Rules always hold (only call hooks at the top level of function components)
- Do not alter class components
- SSR/Server Components are not injected unless explicitly enabled
- Transformations are deterministic, reversible, and preserve comments/source maps
- Per-file and per-component pragmas allow explicit enable/disable

## Package structure and placement

Auto-injection tooling ships separately from the core runtime to keep the runtime lean and free of build-time dependencies.

### Rationale for separation

- Install footprint: build-tool deps (Vite/Babel/Unplugin/SWC/ts-morph) stay out of the runtime package
- Dependency hygiene: dev/build-time deps live with tooling; runtime deps live with the library
- Production safety: no risk of tooling leaking into production bundles; tree-shaking remains simple
- Independent releases: tooling and runtime version independently

### Monorepo layout

```
packages/
  tracing/                         # Core runtime library (hooks, types)

  auto-tracer-inject-core/          # Shared AST utilities (no bundler specifics)
    src/
      config.ts                    # Config schema (mode, globs, pragmas, importSource)
      detect.ts                    # Component detection heuristics (JSX return, PascalCase, etc.)
      transform.ts                 # Insert import + useAutoTracer() at top of body
      print.ts                     # Printing/source map helpers
      utils/                       # Arrow-to-block, early returns, TS/JSX helpers
      types.ts                     # Internal transform types
    __tests__/                     # Fixture-based snapshots

  auto-tracer-plugin-vite/          # Vite/Rollup/Webpack via unplugin (primary adapter)
    src/
      index.ts                     # createUnplugin(...) adapter, dev-only gating
      vite.ts                      # Optional thin Vite entry wrapper
    __tests__/                     # Minimal integration test (dev-mode only)
    peerDeps: vite, unplugin
    deps: auto-tracer-inject-core

  @auto-tracer/plugin-babel-react18/         # Babel plugin (alternative pipeline)
    src/index.ts                   # Babel visitor that calls core transform
    __tests__/                     # Fixture-based tests
    peerDeps: @babel/core
    deps: auto-tracer-inject-core

```

### Responsibilities

- `tracing` (use-trace): runtime library; exports `useAutoTracer` and public API
- `auto-tracer-inject-core`: pure AST transform logic; reused by adapters
- `auto-tracer-plugin-vite`: primary Vite adapter (unplugin); dev-only application
- `@auto-tracer/plugin-babel-react18`: alternative Babel plugin

### Dependency rules

- No Vite/Babel/esbuild/SWC in `tracing` or `auto-tracer-inject-core`
- Adapters declare build tools as peerDependencies (optionally optional)
- Mark `sideEffects: false` where safe to aid tree-shaking
- `auto-tracer-inject-core` depends only on AST essentials (or uses adapter-provided parsers)

## High-level approach

The build-time transform:

- Detects function components
- Ensures an import for `useAutoTracer` exists (inserting if missing)
- Injects `useAutoTracer()` as the first statement inside the component body
- Applies only in development; production builds are untouched

The approach adds no extra component layers, avoids monkey patching, and preserves tree-shaking.

## Component detection heuristics

A component is a function that returns JSX. Candidates are identified using naming and structure:

- Named function declarations with PascalCase names that return JSX
  - `function MyComponent(props) { return <div /> }`
- Variable declarators with PascalCase identifiers assigned to function/arrow expressions that return JSX
  - `const MyComponent = (props) => <div />`
  - `const MyComponent = function (props) { return <div /> }`
- When naming is unclear:
  - Look for `JSXElement` or `JSXFragment` in any `return` path
  - Presence of imported React hooks (e.g., `useState`, `useEffect`) is a weak signal

Skipped by design:

- Class components
- Non-PascalCase functions unless they return JSX (opt-in only)
- Server-only files unless explicitly allowed by config

## Transform algorithm

1. Parse TS/TSX/JSX with a tolerant parser (Babel or SWC)
2. For each file:
   - If file is excluded, skip
   - In opt-in mode, skip if file lacks the pragma
3. For each candidate component function:
   - Ensure the body is a block; for concise arrows, convert to `{ const __ret = (original expr); return __ret; }`
   - Insert `useAutoTracer()` as the first statement in the block
   - If the import is missing, add: `import { useAutoTracer } from "@auto-tracer/react18";` (configurable via `importSource`)
4. Respect pragmas:
   - `// @trace-disable` → do not inject into this file or function
   - `// @trace` (opt-in mode) → inject only when present
5. Emit with original formatting as much as possible, preserving comments and source maps

### Example: before → after

Before (concise arrow):

```tsx
const TodoItem = ({ title }) => <li>{title}</li>;
```

After:

```tsx
import { useAutoTracer } from "@auto-tracer/react18";

const TodoItem = ({ title }) => {
  useAutoTracer();
  return <li>{title}</li>;
};
```

Before (function declaration with early returns):

```tsx
function Editor({ doc }) {
  if (!doc) return null;
  return <Pane doc={doc} />;
}
```

After:

```tsx
import { useAutoTracer } from "@auto-tracer/react18";

function Editor({ doc }) {
  useAutoTracer();
  if (!doc) return null;
  return <Pane doc={doc} />;
}
```

## Error handling and failure modes

The transform handles errors gracefully to avoid breaking builds:

- **Syntax errors**: Skip transformation for files with parse errors; log warning and continue
- **Invalid JSX**: Skip components with malformed JSX; continue processing other components in the file
- **Missing dependencies**: If parser libraries are unavailable, disable transform with clear error message
- **Import conflicts**: Skip injection if `useAutoTracer` import would conflict with existing imports
- **Component detection failures**: Conservative approach - when in doubt, skip injection rather than risk incorrect transformations

All errors are logged with file location and component name for debugging, but never fail the build.

## Integration options and examples

### Vite (recommended)

Use the unplugin-based adapter in development mode.

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { autoTracer } from "@auto-tracer/plugin-vite-react18";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({}),
    mode === "development" &&
      autoTracer({
        mode: "opt-in",
        importSource: "use-trace",
        include: ["src/**/*.tsx"],
      }),
  ].filter(Boolean),
}));
```

### Babel (alternative)

```js
// babel.config.js
module.exports = {
  plugins: [
    [
      "@auto-tracer/plugin-babel-react18",
      { mode: "opt-in", importSource: "use-trace", include: ["src/**/*.tsx"] },
    ],
  ],
};
```

### Direct core usage (advanced)

For custom integrations, use `auto-tracer-inject-core` directly:

```ts
import { createTransform } from "@auto-tracer/inject-react18";

const transform = createTransform({
  mode: "opt-in",
  importSource: "use-trace",
  include: ["src/**/*.tsx"],
});

// Use with your build system
const result = transform.process(sourceCode, { filename: "Component.tsx" });
```

## Configuration surface

- `mode`: `opt-in` (default) | `opt-out`
  - `opt-in` requires `// @trace` at the top of the file or before the component
  - `opt-out` injects by default but allows `// @trace-disable` to skip
- `include` / `exclude` globs: e.g., include `src/**/*.tsx`, exclude `**/*.test.tsx`
- `serverComponents`: boolean (default `false`); when `true`, allow injection in RSC-aware code with care
- `importSource`: string; module to import `useAutoTracer` from (default: `"use-trace"`)

## Hook call details

- The transformer inserts `useAutoTracer()` at the top of the function body
- `name` is inferred from the identifier when available; fallback to filename-based naming when anonymous
- The call is a pure hook usage; no global reads are injected by the transformer

## TypeScript considerations

- Parser supports TS/TSX syntax and preserves types
- Types are not altered; type-only imports are preserved
- Converting concise arrows to blocks preserves return type inference

## Edge cases and rules

- Early returns: injection occurs before any `return`
- Concise arrows: wrap into a block and return the original expression
- `memo`/`forwardRef`: inject inside the inner function, not at the call site
- Default exports: ensure an identifier; otherwise generate a name for tracing metadata. Component.name assignment is preferred.
- Re-exports and HOCs: avoid injecting into factory functions that do not render JSX
- Files with `// @trace-disable` are skipped

## Testing and quality gates

- `auto-tracer-inject-core`: snapshot tests on fixtures (function decls, concise arrows, early returns, default/named exports, memo/forwardRef, pragmas, TSX)
- Adapters (-vite, -babel): minimal integration projects; verify dev-only application and valid source maps

## Debugging and escape hatches

- Preserve source maps to map runtime frames to original code
- Provide an environment flag (e.g., `TRACE_INJECT=0`) to disable the plugin quickly
- Support per-file and per-component pragmas for granular control

## Performance and safety

- Build-time transform yields zero runtime overhead in production
- Dev-only application keeps production bundles clean
- Conservative, pragma-driven, JSX-based detection avoids breaking Hook Rules

## Rollout plan

1. Opt-in, dev-only: enable for files/components marked with `// @trace`
2. Expand coverage: switch to opt-out in select packages; honor `// @trace-disable`
3. Stabilize: document patterns; keep dev-only

## Release and versioning

- Adapters version independently from `tracing`
- Use semver and document minimal compatible `tracing` version (API of `useAutoTracer`)
- Maintain changelogs per package to avoid coupling runtime upgrades to tooling fixes

## Acceptance criteria

**Core functionality:**

- Hook Rules are preserved in all transformed outputs
- Production builds contain zero trace-related code
- Opt-in and opt-out modes function correctly with pragma detection
- Component detection accurately identifies function components while avoiding false positives

**Quality and performance:**

- Transform completes within 100ms for files under 1000 lines
- Source maps correctly map transformed code to original locations
- TypeScript compilation succeeds for all transformed outputs
- Generated imports do not conflict with existing imports

**Testing requirements:**

- Unit tests pass for all fixture combinations (function declarations, arrow functions, early returns, default/named exports, memo/forwardRef, pragmas, TSX syntax)
- Integration test in a Vite project demonstrates dev-only application and working source maps
- No false positives in component detection test suite
