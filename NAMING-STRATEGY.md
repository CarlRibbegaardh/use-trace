# Package Naming and Migration Plan

## Overview

This document outlines the package naming strategy for the @auto-tracer organization and provides a step-by-step migration plan from the current unscoped package names to the new scoped naming scheme.

## Naming Strategy

### Core Principle

- **Package names** use framework identifiers with version suffixes (e.g., `@auto-tracer/react18`)
- **Version numbers** are vanilla semantic (e.g., `@auto-tracer/react18@1.0.0` for React 18)
- **Folder names** include version suffixes to enable active multi-version maintenance without forgotten branches (e.g., `packages/auto-tracer-react18/`)
- **Supporting packages** specific versions for every package. Possibly a shared core, future will tell. For now, all specific. (e.g., `@auto-tracer/inject-react18`, `@auto-tracer/vite-plugin-react18`)

### Runtime Packages (Framework+Version Specific)

These packages contain the DevTools hook attachment logic and runtime correlation of traced state.

```
@auto-tracer/react18            // React 18 runtime (DevTools hook for React 18)
@auto-tracer/react19            // Future: React 19 runtime (DevTools hook for React 19)
@auto-tracer/vue3               // Future: Vue 3 runtime (DevTools hook for Vue 3)
@auto-tracer/angular17          // Future: Angular 17 runtime (Zone.js integration)
```

**peerDependencies Example:**

```json
{
  "name": "@auto-tracer/react18",
  "version": "1.0.0",
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

### Injection/Transform Packages (Framework+Version Specific)

These packages contain AST transformation logic for injecting tracing hooks at build time.

```
@auto-tracer/inject-react18     // AST transforms for React 18 hooks (useState, useReducer)
@auto-tracer/inject-react19     // Future: AST transforms for React 19 hooks
@auto-tracer/inject-vue3        // Future: AST transforms for Vue 3 (ref, reactive)
@auto-tracer/inject-angular17   // Future: AST transforms for Angular 17 (signals, lifecycle)
```

### Build Tool Integration Packages (Framework+Version Specific)

These packages provide build tool plugins that wire injection transforms into the build pipeline.

```
@auto-tracer/babel-plugin-react18     // Babel integration for React 18
@auto-tracer/vite-plugin-react18      // Vite integration for React 18
@auto-tracer/webpack-plugin-react18   // Future: Webpack integration for React 18

@auto-tracer/babel-plugin-react19     // Future: Babel integration for React 19
@auto-tracer/vite-plugin-react19      // Future: Vite integration for React 19

@auto-tracer/babel-plugin-vue3        // Future: Babel integration for Vue 3
@auto-tracer/vite-plugin-vue3         // Future: Vite integration for Vue 3
```

### Utility/Shared Packages

```
@auto-tracer/inject-core        // Shared AST utilities (framework-agnostic helpers)
@auto-tracer/types              // Future: Shared TypeScript types across packages
```

### Manual Hook Package (Separate)

```
use-trace                       // Stays as unscoped package (manual tracing approach)
```

This package remains separate as it represents a fundamentally different approach (manual opt-in) versus the automatic injection approach of `@auto-tracer/*` packages.

## Monorepo Structure

```
packages/
  auto-tracer-react18/                      # @auto-tracer/react18
  auto-tracer-react19/                      # @auto-tracer/react19 (future)
  auto-tracer-inject-core/                  # @auto-tracer/inject-core
  auto-tracer-inject-react18/               # @auto-tracer/inject-react18
  auto-tracer-inject-react19/               # @auto-tracer/inject-react19 (future)
  auto-tracer-vite-plugin-react18/          # @auto-tracer/vite-plugin-react18
  auto-tracer-vite-plugin-react19/          # @auto-tracer/vite-plugin-react19 (future)
  auto-tracer-babel-plugin-react18/         # @auto-tracer/babel-plugin-react18
  auto-tracer-babel-plugin-react19/         # @auto-tracer/babel-plugin-react19 (future)
  auto-tracer-vue3/                         # @auto-tracer/vue3 (future)
  auto-tracer-inject-vue3/                  # @auto-tracer/inject-vue3 (future)
  auto-tracer-types/                        # @auto-tracer/types (future)

apps/
  todo-example-vite5-react18-injected/            # Uses @auto-tracer/react18@^1.0.0
  todo-example-next14-client-only-react18-injected/ # Uses @auto-tracer/react18@^1.0.0
  todo-example-react19-injected/                  # Future: Uses @auto-tracer/react19@^1.0.0
```

**Note on Dependencies:** Since all version matching comes from the package name, workspace references will be used where possible.

## Current Package Migration Map

| Current Package Name       | New Package Name                    | Notes                                    |
| -------------------------- | ----------------------------------- | ---------------------------------------- |
| `auto-tracer`              | `@auto-tracer/react18`              | Runtime for React 18 (start with v1.0.0) |
| `auto-tracer-inject-core`  | `@auto-tracer/inject-react18`       | React 18-specific AST transforms         |
| `auto-tracer-plugin-babel` | `@auto-tracer/babel-plugin-react18` | Babel integration for React 18           |
| `auto-tracer-plugin-vite`  | `@auto-tracer/vite-plugin-react18`  | Vite integration for React 18            |
| `use-trace`                | `use-trace`                         | No change (remains separate)             |

## Migration Plan

### Simplified Migration Plan (Actionable Checklists)

Follow these steps in order. Keep commits small and test at each step.

#### Step 1 — Rename folders

- [ ] Rename package folders to the new convention shown under Monorepo Structure
- [ ] Update any paths in tsconfig, vite, babel, and import paths if folder names are referenced directly

#### Step 2 — Rename packages and references

- [ ] Update "name" fields in each package.json (e.g., `@auto-tracer/react18`)
- [ ] Update all internal dependency references using VS Code Search & Replace
  - [ ] Replace old names (e.g., `auto-tracer`, `auto-tracer-plugin-vite`) with new names
  - [ ] Ensure example apps depend on the new names via `workspace:*`
- [ ] Update imports/usages in code and build configs
  - [ ] Imports: `@auto-tracer/react18`
  - [ ] Vite plugin: `@auto-tracer/vite-plugin-react18`
  - [ ] Babel plugin: `@auto-tracer/babel-plugin-react18`

#### Step 3 — Build and test until green

- [ ] Run `pnpm build` at the repo root (build all)
- [ ] Run unit tests for affected packages via filters
- [ ] Fix any missing/incorrect references, rebuild and retest
- [ ] Run E2E tests one app at a time
  - [ ] `pnpm --filter todo-example-vite5-react18-injected test:e2e`
  - [ ] `pnpm --filter todo-example-next14-client-only-react18-injected test:e2e`

#### Step 4 — Publish alpha versions

- [ ] Set prerelease versions in package.json (e.g., `1.0.0-alpha.0`)
- [ ] Publish with `--access public`

## Version Strategy

### Vanilla Semantic Versioning

All packages use standard semantic versioning independent of framework versions:

- `@auto-tracer/react18@1.0.0` → Initial stable release for React 18 support
- `@auto-tracer/react18@1.1.0` → New feature for React 18 support
- `@auto-tracer/react18@2.0.0` → Breaking change in React 18 support
- `@auto-tracer/react19@1.0.0` → Initial stable release for React 19 support

### Framework Compatibility via Package Name

Framework version compatibility is explicit in the package name, not the version number:

- `@auto-tracer/react18@*` → Always supports React 18
- `@auto-tracer/react19@*` → Always supports React 19
- `@auto-tracer/vue3@*` → Always supports Vue 3

### Plugin Packages

Plugin packages version independently and follow semver:

- `@auto-tracer/babel-plugin-react18@1.0.0` → Initial stable release
- `@auto-tracer/babel-plugin-react18@1.1.0` → New plugin option
- `@auto-tracer/babel-plugin-react18@2.0.0` → Breaking config change

## Compatibility Matrix

Document which versions work together:

| Runtime     | inject-react18 | babel-plugin-react18 | vite-plugin-react18 |
| ----------- | -------------- | -------------------- | ------------------- |
| react18@1.x | >=1.0.0        | >=1.0.0              | >=1.0.0             |
| react18@2.x | >=2.0.0        | >=1.0.0              | >=1.0.0             |

When React 19 support is added:

| Runtime     | inject-react19 | babel-plugin-react19 | vite-plugin-react19 |
| ----------- | -------------- | -------------------- | ------------------- |
| react19@1.x | >=1.0.0        | >=1.0.0              | >=1.0.0             |

## Future Framework Support

When adding React 19 support:

1. Create new runtime package (`@auto-tracer/react19`)
2. Create new injection package (`@auto-tracer/inject-react19`)
3. Create new plugin packages (`@auto-tracer/babel-plugin-react19`, `@auto-tracer/vite-plugin-react19`)
4. Update this document with new packages
5. Follow same version strategy (vanilla semantic versioning)

When adding Vue or Angular support:

1. Create new runtime package (`@auto-tracer/vue3`, `@auto-tracer/angular17`)
2. Create new injection package (`@auto-tracer/inject-vue3`, `@auto-tracer/inject-angular17`)
3. Create new plugin packages for each build tool
4. Update this document with new packages

## Questions and Decisions

### Why separate `use-trace`?

- Represents fundamentally different approach (manual vs automatic)
- Already has established name in ecosystem
- Keeps clear separation between opt-in and opt-out strategies

### Why framework+version suffixes on all packages?

- Enables parallel development and maintenance of multiple framework versions
- Prevents naming collisions when adding new framework versions
- Makes it explicit which framework and version the package targets
- Allows safe testing and tuning of new versions without breaking existing ones

### Why vanilla semantic versioning?

- Standard npm practice that developers expect
- Separates package functionality evolution from framework version compatibility
- Allows independent feature development within each framework version
- Simplifies dependency management and version resolution

### Why not shared packages across framework versions?

For now, all packages are framework+version specific to:

- Enable independent evolution of each framework version
- Avoid cross-version compatibility issues
- Simplify testing and maintenance
- Allow framework-specific optimizations

Future evaluation may identify truly shared components that can be extracted to `@auto-tracer/inject-core` or similar.

## Success Criteria

Migration is complete when:

- [ ] All new packages published to npm with `@auto-tracer` scope
- [ ] All example apps use new package names with framework+version suffixes
- [ ] All tests pass with new packages
- [ ] Old packages deprecated on npm
- [ ] Documentation updated
- [ ] Migration guide published
- [ ] Old package folders removed from monorepo
- [ ] Example app folders renamed to include framework+version suffixes
