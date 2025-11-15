# auto-tracer-plugin-vite

Vite plugin for auto-injecting `useAutoTracer()` into React function components during development.

## Installation

Install in a monorepo where `@auto-tracer/react18` and `@auto-tracer/plugin-vite-react18` are available:

```bash
pnpm add -D auto-tracer-plugin-vite
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "@auto-tracer/plugin-vite-react18";

export default defineConfig(({ mode }) => ({
  plugins: [
    mode === "development" &&
      autoTracer.vite({
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
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

## Production Builds with Workspace Libraries

When building for production in a monorepo where your app depends on workspace libraries, enable automatic UMD loading to prevent Rollup resolution errors.

**Note:** This is **only** needed for production builds (`vite build`). Development mode (`vite dev`) works without any additional configuration.

### The Problem

During production builds, Rollup bundles workspace library source files. The plugin injects `import { useAutoTracer } from "@auto-tracer/react18"` into these files, but workspace libraries don't declare `@auto-tracer/react18` as a dependency, causing resolution failures:

```
[!] (plugin vite:resolve) Error: Failed to resolve '@auto-tracer/react18' from 'packages/lib-B/src/Component.tsx'
```

### The Solution

Enable the `buildWithWorkspaceLibs` option in production mode:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "@auto-tracer/plugin-vite-react18";

export default defineConfig(({ mode }) => ({
  plugins: [
    autoTracer.vite({
      mode: "opt-out",
      include: ["src/**/*.tsx"],
      exclude: ["**/*.spec.*", "**/*.test.*"],
      // Enable automatic UMD loading for production builds only
      buildWithWorkspaceLibs: mode === 'production',
    }),
    react(),
  ],
}));
```

### What It Does

When enabled, the plugin automatically:
1. Adds `rollup-plugin-external-globals` to your build configuration
2. Emits the UMD build of `@auto-tracer/react18` to your output directory
3. Injects a `<script>` tag in your HTML to load it before your app bundle
4. Configures imports to reference the global variable (`window.AutoTracerReact18`)

This allows workspace libraries to remain dependency-free while still supporting tracing in production builds.

### Why It Works

The UMD file loads synchronously before your app bundle, exposing `window.AutoTracerReact18`. The external-globals plugin then transforms all `import` statements to reference this global instead of trying to resolve the module.

**Development mode doesn't need this** because Vite's dev server uses a different resolution mechanism that handles workspace dependencies correctly.

## React Server Components (RSC)

If you're using an RSC-enabled framework (like Next.js App Router), set `serverComponents: true` in the plugin options. When enabled, the transform will:

- Treat modules as Server Modules by default
- Only inject into modules that have the top-level directive:

  "use client";

This prevents injecting client-only hooks where they don't belong. All other transform rules (mode/include/exclude/pragma) still apply to Client Components.

## License

MIT
