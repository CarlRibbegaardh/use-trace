# Monorepo Workspace Libraries Demo

This example app demonstrates using components from both **built** and **source** workspace libraries in a pnpm monorepo with AutoTracer support.

## Architecture

The app uses two workspace library patterns:

1. **Built Library** (`todo-example-monorepo-lib-built-vite5-react18`)
   - Pre-compiled TypeScript → JavaScript
   - Lives in `dist/` after building
   - Components are **not** auto-traced (pre-compiled before plugin runs)

2. **Source Library** (`todo-example-monorepo-lib-source-vite5-react18`)
   - Bundled directly from source by the app
   - TypeScript files imported via barrel exports
   - Components **are** auto-traced (transformed during app build)

## Components

### BuiltCounter
From the **built library**. A simple counter component that demonstrates:
- Pre-compiled workspace library usage
- No auto-tracing (compiled before transformation)

### SourceGreeting
From the **source library**. A greeting component that demonstrates:
- Direct source bundling
- Automatic tracing injection via `@auto-tracer/plugin-vite-react18`
- Hook labeling with `useAutoTracer`

## Production Build

The app uses the `buildWithWorkspaceLibs: true` option to enable UMD-based resolution for production builds:

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  plugins: [
    autoTracer.vite({
      mode: "opt-out",
      buildWithWorkspaceLibs: mode === 'production',
    }),
    react(),
  ],
}));
```

This ensures workspace library imports are properly resolved during production bundling.

## Running

### Development
```bash
pnpm --filter todo-example-monorepo-app-vite5-react18 dev
```

### Production Build
```bash
# Build the built library first
pnpm --filter todo-example-monorepo-lib-built-vite5-react18 build

# Then build the app
pnpm --filter todo-example-monorepo-app-vite5-react18 build
```

## Key Features

- ✅ Demonstrates both built and source workspace library patterns
- ✅ Auto-tracing works correctly for source libraries
- ✅ Production builds use UMD to avoid resolution errors
- ✅ Development mode works without UMD (uses Vite's module graph)
- ✅ Bundle size optimization: @auto-tracer/react18 externalized (38 KB saved)
