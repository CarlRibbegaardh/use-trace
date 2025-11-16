# Production Build with Workspace Libraries Plan

## Problem Statement

When **building for production** in a monorepo where an app (A) depends on workspace libraries (B), the plugin injects `useAutoTracer` imports into library B's components. However, library B doesn't declare `@auto-tracer/react18` as a dependency, causing Rollup resolution failures during the production bundle process.

**Note:** Development mode (`vite dev`) works out of the box - this issue **only** affects production builds (`vite build`) that bundle workspace library code.

### Scenario

```
apps/
  app-A/
    package.json              # depends on: workspace:lib-B, @auto-tracer/react18
    vite.config.ts            # autoTracer plugin enabled

packages/
  lib-B/
    package.json              # NO @auto-tracer/react18 dependency
    src/
      Component.tsx           # Gets injected during app-A's build
```

### What Happens

1. **Development mode (`vite dev`)**: ✅ Works fine - Vite dev server resolves imports correctly
2. **Production build (`vite build`)**:
   - App-A's build process runs with the Vite plugin enabled
   - Rollup bundles files from both app-A and workspace lib-B
   - Plugin injects `import { useAutoTracer } from "@auto-tracer/react18"` into lib-B's components
   - Rollup attempts to resolve the import from lib-B's module context during bundling
   - Resolution fails: lib-B has no `@auto-tracer/react18` in its package.json
   - Build warning/error: "Failed to resolve '@auto-tracer/react18' from 'packages/lib-B/src/Component.tsx'"

## Solution: Auto-Configured UMD + rollup-plugin-external-globals

The plugin automatically handles UMD loading and external globals configuration during production builds, requiring minimal user configuration.

### Architecture

1. **Package `@auto-tracer/react18` as UMD** - Build with UMD format exposing `window.AutoTracerReact18`
2. **Plugin auto-configures production builds** - Automatically adds external-globals, emits UMD, injects script tag
3. **User enables with single flag** - `buildWithWorkspaceLibs: true` in plugin options
4. **Development unchanged** - Normal ESM resolution in dev mode

**Note on global naming:** The UMD global is named `AutoTracerReact18` (not just `AutoTracer`) to support micro-frontend scenarios where multiple apps with different React versions might coexist in the same window. Each React version's auto-tracer can have its own global namespace (`AutoTracerReact18`, `AutoTracerReact19`, etc.).

### How It Works

**Development mode (`vite dev`):**

- Normal ESM module resolution
- No UMD or globals involved
- Works out of the box

**Production build (`vite build`):**

1. Plugin detects `buildWithWorkspaceLibs: true`
2. Auto-adds `rollup-plugin-external-globals` to Rollup config
3. Emits UMD file as asset via `emitFile()` API
4. Injects `<script>` tag via `transformIndexHtml` tags API
5. UMD loads before app bundle, sets global
6. External-globals replaces imports with global references

### Benefits

✅ **Zero configuration** - Plugin handles all setup automatically

✅ **No dependency pollution** - lib-B remains clean, no @auto-tracer dependency needed

✅ **Seamless injection** - Plugin continues to inject standard ESM imports

✅ **Production build compatibility** - Rollup doesn't fail on unresolvable imports during bundling

✅ **Runtime safety** - UMD loads synchronously before app, global always available

✅ **Development unchanged** - Dev mode continues to work out of the box

✅ **Path-safe** - Uses Vite's tags API, handles base paths and subdirectories correctly

✅ **Standard pattern** - Traditional UMD approach, proven and reliable

## Implementation Tasks

### 1. Add UMD Build to `@auto-tracer/react18`

**File:** `packages/auto-tracer-react18/package.json`

- [ ] Add build script for UMD output
- [ ] Configure TypeScript/Rollup/Vite to generate `dist/index.umd.js`
- [ ] Set UMD global name to `AutoTracerLib`
- [ ] Externalize React/ReactDOM in UMD build (prevent bundling duplicate React)
- [ ] Update package.json `exports` field to include UMD entry

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "umd": "./dist/index.umd.js"
    }
  },
  "umd:main": "./dist/index.umd.js"
}
```

**Build configuration example:**

```typescript
// packages/auto-tracer-react18/rollup.config.js or vite.config.ts
{
  output: {
    file: 'dist/index.umd.js',
    format: 'umd',
    name: 'AutoTracerReact18',  // Version-specific global name
    globals: {
      'react': 'React',
      'react-dom': 'ReactDOM'
    }
  },
  external: ['react', 'react-dom']
}
```

### 2. Implement Auto-Configuration in Plugin

**File:** `packages/auto-tracer-plugin-vite-react18/src/index.ts`

- [ ] Add `buildWithWorkspaceLibs` option to plugin config
- [ ] Implement Vite `config` hook to auto-add external-globals
- [ ] Implement `generateBundle` hook to emit UMD via `emitFile()`
- [ ] Implement `transformIndexHtml` with tags API to inject script
- [ ] Add rollup-plugin-external-globals as dependency
- [ ] Only activate in production builds (`command === 'build'`)

**Implementation example:**

```typescript
export const autoTracer = createUnplugin<AutoTracerOptions | undefined>(
  (options = {}) => {
    const config = normalizeConfig(options);
    const enableBuildSupport = options.buildWithWorkspaceLibs ?? false;

    return {
      name: "auto-tracer-inject",
      enforce: "pre",

      vite: {
        config(viteConfig, { command }) {
          // Only configure for production builds
          if (command !== "build" || !enableBuildSupport) return;

          const externalGlobals = require("rollup-plugin-external-globals");
          viteConfig.build = viteConfig.build || {};
          viteConfig.build.rollupOptions = viteConfig.build.rollupOptions || {};
          viteConfig.build.rollupOptions.plugins =
            viteConfig.build.rollupOptions.plugins || [];

          viteConfig.build.rollupOptions.plugins.push(
            externalGlobals({
              "@auto-tracer/react18": "AutoTracerReact18",
            })
          );
        },

        transformIndexHtml: {
          order: "pre",
          handler(html, ctx) {
            if (!ctx.bundle || !enableBuildSupport) return html;

            // Use Vite's tags API for proper path resolution
            return {
              html,
              tags: [
                {
                  tag: "script",
                  attrs: { src: "auto-tracer-react18.umd.js" },
                  injectTo: "head-prepend",
                },
              ],
            };
          },
        },

        generateBundle() {
          if (!enableBuildSupport) return;

          const fs = require("fs");
          const umdPath = require.resolve(
            "@auto-tracer/react18/dist/index.umd.js"
          );
          const umdContent = fs.readFileSync(umdPath, "utf-8");

          this.emitFile({
            type: "asset",
            fileName: "auto-tracer-react18.umd.js",
            source: umdContent,
          });
        },
      },

      transformInclude(id: string) {
        // ... existing
      },

      transform(code: string, id: string) {
        // ... existing
      },
    };
  }
);
```

### 3. Update Plugin Documentation

**File:** `packages/auto-tracer-plugin-vite-react18/README.md`

- [ ] Add "Production Builds with Workspace Libraries" section
- [ ] Document the `buildWithWorkspaceLibs` option
- [ ] Explain when it's needed and what it does
- [ ] Provide simple usage example
- [ ] Add troubleshooting section

**Content to add:**

````markdown
## Production Builds with Workspace Libraries

When building for production in a monorepo where your app depends on workspace libraries, enable automatic UMD loading to prevent Rollup resolution errors.

**Note:** This is **only** needed for production builds. Development mode (`vite dev`) works without any additional configuration.

### Setup

Simply enable the option in your Vite config:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracer } from "@auto-tracer/plugin-vite-react18";

export default defineConfig({
  plugins: [
    autoTracer.vite({
      mode: "opt-out",
      buildWithWorkspaceLibs: true, // Enable auto-configuration
    }),
    react(),
  ],
});
```
````

### What It Does

When enabled, the plugin automatically:

1. Adds `rollup-plugin-external-globals` to your build configuration
2. Emits the UMD build of `@auto-tracer/react18` to your output directory
3. Injects a `<script>` tag in your HTML to load it before your app bundle
4. Configures imports to reference the global variable in workspace libraries

### Why This Is Needed

During production builds, Rollup bundles workspace library source files. The plugin injects imports into these files, but workspace libraries don't declare `@auto-tracer/react18` as a dependency, causing resolution failures.

The UMD approach loads the library globally, allowing workspace libraries to remain dependency-free while still supporting tracing.

**Development mode doesn't need this** because Vite's dev server uses a different resolution mechanism.

````

### 4. Add Integration Tests

**File:** `packages/auto-tracer-plugin-vite-react18/tests/monorepo-integration.test.ts`

- [ ] Create test fixture simulating monorepo structure
- [ ] Test that injected imports work with external-globals plugin
- [ ] Verify workspace libraries can be processed without dependency
- [ ] Test UMD global availability
- [ ] Verify React instance consistency (no duplicate React issues)

### 5. Update Example Apps

**Files:**
- `apps/todo-example-vite-injected/vite.config.ts`
- `apps/todo-example-vite-injected/README.md`

- [ ] Enable `buildWithWorkspaceLibs: true` in plugin config
- [ ] Document the setup in app README
- [ ] Add comment explaining when it's needed
- [ ] Test build succeeds without warnings
- [ ] Verify UMD is emitted to dist/ and script tag is injected

### 6. Add Direct Dependency

**File:** `packages/auto-tracer-plugin-vite-react18/package.json`

- [ ] Add rollup-plugin-external-globals as direct dependency (not peer)
- [ ] Update installation instructions in README

```json
{
  "dependencies": {
    "@auto-tracer/inject-react18": "workspace:*",
    "unplugin": "^1.5.0",
    "rollup-plugin-external-globals": "^0.11.0"
  }
}
````

**Rationale:** Since the plugin auto-configures external-globals when `buildWithWorkspaceLibs` is enabled, it should be a direct dependency, not a peer dependency that users must install.

## Alternative Solutions Considered

### ❌ Add @auto-tracer/react18 to workspace library dependencies

**Rejected:** Pollutes library dependencies with build-time tooling, makes libraries unusable without auto-tracer.

### ❌ Exclude workspace libraries from transformation

**Rejected:** Prevents tracing of library components, defeats purpose of comprehensive tracing.

### ❌ Use relative imports instead of package imports

**Rejected:** Breaks when libraries are published, ties implementation to monorepo structure.

### ❌ Virtual module resolution

**Rejected:** More complex than needed, requires custom resolution logic.

### ❌ Manual UMD configuration

**Rejected:** Requires users to manually configure external-globals, copy UMD files, and inject script tags - too much complexity.

### ✅ Auto-configured UMD + rollup-plugin-external-globals

**Selected:** Clean separation, no dependency pollution, zero user configuration, uses proven UMD pattern, leverages Vite's proper APIs (`emitFile`, `transformIndexHtml` tags).

## Testing Strategy

1. **Unit tests:** Plugin behavior with external-globals configuration
2. **Integration tests:** Full build cycle in simulated monorepo
3. **E2E tests:** Example apps build and run successfully
4. **Manual verification:**
   - Build app with workspace dependencies
   - Verify no Rollup warnings
   - Verify tracing works at runtime
   - Check bundle size (UMD overhead)

## Documentation Updates

- [ ] Main repository README - add production build with workspace libraries section
- [ ] Plugin README - add production build configuration section
- [ ] Library README - document UMD build
- [ ] Migration guide - for existing monorepo production builds
- [ ] FAQ - common production build issues with workspace libraries

## Rollout Plan

### Phase 1: Core Implementation

1. Add UMD build to @auto-tracer/react18
2. Test UMD build locally
3. Verify global exposure works

### Phase 2: Plugin Integration

1. Update plugin documentation
2. Add integration tests
3. Update example apps

### Phase 3: Documentation

1. Update all READMEs
2. Add troubleshooting guides
3. Create migration guide

### Phase 4: Validation

1. Test in real monorepo scenarios
2. Gather feedback
3. Refine documentation

### Phase 5: Release

1. Publish updated packages
2. Announce monorepo support
3. Update changelog

## Success Criteria

- [ ] App-A can build for production with workspace library dependencies without warnings
- [ ] Workspace libraries don't need @auto-tracer/react18 in dependencies
- [ ] Tracing works for components in workspace libraries in production builds
- [ ] Development mode (`vite dev`) continues to work without configuration
- [ ] No React instance conflicts (hooks work correctly)
- [ ] Bundle size increase is minimal (<10KB gzipped)
- [ ] Documentation clearly distinguishes dev vs production build needs
- [ ] Example apps demonstrate the production build pattern

## Open Questions

1. **Should UMD be the default build output?** Or keep ESM primary and UMD as opt-in? _(Current plan: ESM primary, UMD additional output)_
2. **Default enablement:** Should `buildWithWorkspaceLibs` default to `true` or `false`? _(Current plan: `false` for safety, opt-in)_
3. **SSR considerations:** How does this interact with server-side rendering and pre-rendering? _(Need to test with Next.js SSG/SSR)_
4. **Micro-frontends:** Should we provide tooling to automatically namespace globals per-app in complex module federation scenarios?
5. **Version collision detection:** Should the UMD build detect and warn if another `AutoTracerReact18` global already exists?
6. **Auto-detection:** Can the plugin automatically detect when workspace libraries are being bundled and enable this behavior automatically? _(Complex - better to require explicit opt-in)_
7. **Minification:** Should the emitted UMD be minified, or rely on the source being pre-minified?

## References

- [rollup-plugin-external-globals](https://github.com/eight04/rollup-plugin-external-globals)
- [UMD (Universal Module Definition)](https://github.com/umdjs/umd)
- [Vite Rollup Options](https://vitejs.dev/config/build-options.html#build-rollupoptions)
- [Monorepo with pnpm workspaces](https://pnpm.io/workspaces)
