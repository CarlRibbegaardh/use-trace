# Package Naming and Migration Plan

## Overview

This document outlines the package naming strategy for the @auto-tracer organization and provides a step-by-step migration plan from the current unscoped package names to the new scoped naming scheme.

## Naming Strategy

### Core Principle

- **Package names** use framework identifiers with version suffixes (e.g., `@auto-tracer/react18`)
- **Version numbers** are vanilla semantic (e.g., `@auto-tracer/react18@1.0.0` for React 18)
- **Folder names** include version suffixes to enable active multi-version maintenance without forgotten branches (e.g., `packages/react18/`)
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
  react18/                      # @auto-tracer/react18
  react19/                      # @auto-tracer/react19 (future)
  inject-core/                  # @auto-tracer/inject-core
  inject-react18/               # @auto-tracer/inject-react18
  inject-react19/               # @auto-tracer/inject-react19 (future)
  vite-plugin-react18/          # @auto-tracer/vite-plugin-react18
  vite-plugin-react19/          # @auto-tracer/vite-plugin-react19 (future)
  babel-plugin-react18/         # @auto-tracer/babel-plugin-react18
  babel-plugin-react19/         # @auto-tracer/babel-plugin-react19 (future)
  vue3/                         # @auto-tracer/vue3 (future)
  inject-vue3/                  # @auto-tracer/inject-vue3 (future)
  types/                        # @auto-tracer/types (future)

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

### Phase 1: Preparation (No Breaking Changes)

**Goal:** Set up infrastructure without breaking existing usage.

1. **Reserve npm package names**

   - Publish placeholder packages for:
     - `@auto-tracer/react18`
     - `@auto-tracer/inject-react18`
     - `@auto-tracer/babel-plugin-react18`
     - `@auto-tracer/vite-plugin-react18`
     - `@auto-tracer/inject-core`
   - Initial version: `0.0.0-reserved` with README pointing to migration plan

2. **Create new package folders**

   ```bash
   # From project root
   mkdir -p packages/react18
   mkdir -p packages/inject-react18
   mkdir -p packages/babel-plugin-react18
   mkdir -p packages/vite-plugin-react18
   ```

3. **Update documentation**
   - Add this `docs/naming.md` file
   - Update root README.md to reference new naming scheme
   - Add deprecation notices to existing package READMEs

### Phase 2: Code Migration (Test-First)

**Goal:** Move code to new packages while maintaining 100% test coverage.

1. **Migrate package by package with tests**

   For each package:

   a. **Copy package code to new location**

   ```bash
   # Example for auto-tracer → @auto-tracer/react18
   cp -r packages/auto-tracer/* packages/react18/
   ```

   b. **Update package.json in new location**

   ```json
   {
     "name": "@auto-tracer/react18",
     "version": "1.0.0",
     "publishConfig": {
       "access": "public"
     },
     "peerDependencies": {
       "react": "^18.0.0"
     }
   }
   ```

   c. **Update internal dependencies**

   ```json
   {
     "dependencies": {
       "@auto-tracer/inject-core": "workspace:*"
     }
   }
   ```

   d. **Run tests for new package**

   ```bash
   pnpm --filter @auto-tracer/react18 test
   ```

   e. **Build and verify**

   ```bash
   pnpm build
   ```

2. **Update example apps to use new packages**

   For each app:

   a. **Update package.json dependencies**

   ```json
   {
     "dependencies": {
       "@auto-tracer/react18": "workspace:*"
     },
     "devDependencies": {
       "@auto-tracer/babel-plugin-react18": "workspace:*",
       "@auto-tracer/vite-plugin-react18": "workspace:*"
     }
   }
   ```

   b. **Update imports**

   ```typescript
   // Before
   import { autoTracer } from "auto-tracer";

   // After
   import { autoTracer } from "@auto-tracer/react18";
   ```

   c. **Update build configuration**

   ```javascript
   // vite.config.ts - Before
   import autoTracer from "auto-tracer-plugin-vite";

   // After
   import autoTracer from "@auto-tracer/vite-plugin-react18";
   ```

   ```json
   // .babelrc - Before
   {
     "plugins": ["auto-tracer-plugin-babel"]
   }

   // After
   {
     "plugins": ["@auto-tracer/babel-plugin-react18"]
   }
   ```

   d. **Run E2E tests**

   ```bash
   pnpm --filter todo-example-vite5-react18-injected test:e2e
   pnpm --filter todo-example-next14-client-only-react18-injected test:e2e
   ```

3. **Verify full monorepo**
   ```bash
   pnpm build
   pnpm test
   ```

### Phase 3: Deprecation and Cleanup

**Goal:** Mark old packages as deprecated and remove legacy code.

1. **Publish new packages to npm**

   ```bash
   # Publish new scoped packages with v1.0.0
   pnpm --filter "@auto-tracer/*" publish --access public
   ```

2. **Deprecate old packages on npm**

Packages are not yet published.

3. **Remove old package folders**

   ```bash
   # After confirmation that new packages work
   rm -rf packages/auto-tracer
   rm -rf packages/auto-tracer-inject-core
   rm -rf packages/auto-tracer-plugin-babel
   rm -rf packages/auto-tracer-plugin-vite
   ```

4. **Update CI/CD pipelines**
   - Update build scripts to reference new package names
   - Update release workflows
   - Update badges in README files

### Phase 4: Documentation and Communication

**Goal:** Ensure users can migrate smoothly.

1. **Create migration guide for users**

   - Add `docs/migration-guide.md` with step-by-step instructions
   - Include code examples for common migration scenarios
   - Document breaking changes and upgrade path

2. **Update website/documentation**

   - Update installation instructions
   - Update all code examples
   - Add migration notice banner

3. **Announce migration**
   - Create GitHub release with migration instructions
   - Update package README files with prominent migration notices
   - Consider blog post explaining the change

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
