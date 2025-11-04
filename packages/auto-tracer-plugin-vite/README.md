# auto-tracer-plugin-vite

Vite plugin for auto-injecting `useAutoTracer()` into React function components during development.

## Installation

Install in a monorepo where `auto-tracer` and `auto-tracer-inject-core` are available:

```bash
pnpm add -D auto-tracer-plugin-vite
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "auto-tracer-plugin-vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    mode === "development" &&
      autoTracer.vite({
        mode: "opt-out",
        importSource: "auto-tracer",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.spec.*", "**/*.test.*"],
        // Enable this when using React Server Components (e.g., Next.js App Router)
        // to ensure we only inject into modules marked with "use client".
        // serverComponents: true,
      }),
    react(),
  ].filter(Boolean),
}));
```

## Mode vs. pragmas (precedence)

The transformer supports compile-time pragmas to narrow or broaden tracing inside eligible files.

- `mode: 'opt-in'` — Only files matching `include` are considered. Within those files, a component-level pragma can enable injection for specific components. Files outside `include` are not processed.
- `mode: 'opt-out'` — All files are eligible except those matching `exclude`. A pragma can disable tracing for a file or for specific components.

Precedence rules:

- File-level `exclude` always wins: excluded files are never processed.
- A disable pragma wins over an enable pragma when both apply to the same scope.
- Component-level pragma overrides file-level pragma for that component.

Example pragmas (illustrative names):

```ts
// File-level disable in an opt-out project
// @trace-disable

// Enable only a specific component inside an included file (opt-in)
// @trace
export function MyComponent() {
  /* … */
}

// Disable the next component only
// @trace-disable
export const HeavyComponent = () => {
  /* … */
};
```

## Hook value labels

You can opt-in to labeling values returned from hooks for nicer console output:

```ts
autoTracer.vite({
  labelHooks: ["useState", "useReducer", "useSelector", "useAppSelector"],
  labelHooksPattern: "^use[A-Z].*",
});
```

This augments built-ins (useState/useReducer) by labeling identifiers assigned from matching hook calls.

## Dev-only behavior

The plugin runs in development and is disabled in production builds. You can also turn it off via `TRACE_INJECT=0`.

## React Server Components (RSC)

If you're using an RSC-enabled framework (like Next.js App Router), set `serverComponents: true` in the plugin options. When enabled, the transform will:

- Treat modules as Server Modules by default
- Only inject into modules that have the top-level directive:

  "use client";

This prevents injecting client-only hooks where they don't belong. All other transform rules (mode/include/exclude/pragma) still apply to Client Components.

## License

MIT
