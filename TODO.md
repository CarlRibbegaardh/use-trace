# TODO: Implement React Server Components (RSC) Safety

This work will make the library safe for consumption in modern React frameworks that use Server Components by implementing an opt-in RSC-aware mode.

./github/instructions/rules.instructions.md must be followed to the letter.

THIS TODO MUST BE KEPT UPDATED ALL TIME BEFORE MOVING TO NEXT TASK.
Legend: [ ] TODO, [*] DOING, [X] DONE

- [x] **Phase 1: Create a Failing Test Case**

  - [x] Create a new test file `tests/functions/transform.rsc.test.ts`.
  - [x] Add a test case for a file that looks like a Server Component (no `"use client"` directive).
  - [x] In the test, set `serverComponents: true` in the transform config.
  - [x] Assert that the transform **incorrectly** injects `useAutoTracer()` into the Server Component.
  - [x] Verify that this test fails as expected.

- [x] **Phase 2: Implement Core Logic**

  - [x] Create a new helper function `isClientComponentModule(ast)` in `packages/auto-tracer-inject-core/src/functions/detect/`.
  - [x] The function should check the `ast.program.directives` array for a directive with the value `"use client"`.
  - [x] Create a corresponding test file `isClientComponentModule.test.ts` to verify the helper works correctly with modules that do and do not contain the directive.

- [x] **Phase 3: Integrate into Transform and Fix Failing Test**

  - [x] In `transform.ts`, add a check at the beginning of the `try` block.
  - [x] If `config.serverComponents` is `true`, call `isClientComponentModule(ast)`.
  - [x] If it returns `false`, immediately return from the transform function without making any changes.
  - [x] Re-run the failing test from Phase 1 and verify that it now passes.
  - [x] Add a new test case to ensure that when `serverComponents: true` and `"use client"` is present, the injection proceeds as expected.
  - [x] Add a final test case to ensure that when `serverComponents: false` (the default), injection proceeds regardless of the presence of `"use client"`.

- [x] **Phase 4: Documentation**

  - [x] Update the `README.md` in `packages/auto-tracer-inject-core` to document the `serverComponents` flag. Explain its purpose, default behavior (`false`), and how to enable the RSC-aware mode.
  - [x] Update the TSDoc for the `serverComponents` property in the `TransformConfig` interface with a detailed explanation.
  - [x] Update the `README.md` in `packages/auto-tracer-plugin-vite` to mention the `serverComponents` option.

- [x] **Phase 5: Create Next.js Example Apps**

  - [x] Create a new Next.js app `apps/todo-example-next-client-only-injected`.
    - Replicate the structure and functionality of the `todo-example-vite-injected` app.
    - Ensure all components are explicitly marked as client components (`"use client"`).
    - Configure the tracer plugin with `serverComponents: false` (default).
    - Add a Playwright E2E test to verify functionality and tracing.
  - [x] Create a new Next.js app `apps/todo-example-next-mixed-mode-injected`.
    - Replicate the structure and functionality of the `todo-example-vite-injected` app.
    - Structure the app to use Server Components by default.
    - Isolate the interactive parts (e.g., the input form) into a Client Component.
    - Configure the tracer plugin with `serverComponents: true`.
    - Add a Playwright E2E test to verify functionality and that tracing only applies to the client component.

- [x] **Phase 6: Final Verification**

  - [x] Run all tests for the `auto-tracer-inject-core` package with coverage to ensure no regressions.
  - [x] Build the entire project from the root using `pnpm build` to confirm the changes are integrated correctly.
  - [x] Run the E2E tests for the new Next.js apps to validate the final implementation.

- [*] **Phase 7: Next.js Babel Plugin for Auto-Injection**

  - [x] Create Babel plugin package `packages/@auto-tracer/plugin-babel-react18` (scaffold only)

    - [x] `package.json` (name, main/module/types, dependencies/devDependencies pinned)
    - [x] `tsconfig.json` (strict)
    - [x] `vitest.config.ts`
    - [x] `src/index.ts` exporting a Babel plugin function
    - [x] `README.md` (placeholder)

  - [x] Write failing unit tests (test-first) in the Babel plugin package

  - [x] Injects into a simple client component (no existing tracer)
  - [x] Respects `// @trace-disable` pragma (no injection)
  - [x] With `serverComponents: true`, skips injection when there is no `"use client"`
  - [x] With `serverComponents: true`, injects when `"use client"` is present
  - [x] Forwards `labelHooks` and `labelHooksPattern` to core correctly

  - [x] Implement minimal Babel plugin bridging to core

    - [x] Map plugin options to `TransformConfig` used by `auto-tracer-inject-core.transform`
    - [x] Apply transform in `Program:exit`; replace generated code; preserve sourcemaps if possible
    - [x] Keep changes small; re-run only the new unit tests each iteration

  - [ ] Wire plugin in `apps/todo-example-next-client-only-injected`

    - [x] Add `.babelrc` with `"presets": ["next/babel"]` and the new plugin (default `serverComponents: false`)
    - [x] Add a failing Playwright test for a component WITHOUT manual tracer that expects an observable effect of auto-injection (UI hint, not console logs)
      - tests/auto-injection-ui.spec.ts asserts data-auto-traced="true" on `[data-testid="empty-todos-message"]` rendered by `TodoList` (no manual tracer)
    - [ ] Run a single E2E test at a time (headless) per repo rules

  - [ ] Wire plugin in `apps/todo-example-next-mixed-mode-injected`

    - [ ] Add `.babelrc` with `"presets": ["next/babel"]` and the plugin configured as `{ serverComponents: true }`
    - [ ] Add a failing Playwright test ensuring injection ONLY occurs in client components, not server modules
    - [ ] Run a single E2E test at a time (headless)

  - [ ] Make tests pass (iterate in small steps)

    - [ ] Keep changes tight; verify each with unit tests and then the single targeted E2E
    - [ ] Always build the whole monorepo via `pnpm build` between steps (from the root)
    - [x] Align Babel plugin export with repo rules (named exports only). Current unit tests import `{ autoTracerBabelPlugin }` but `src/index.ts` exports a default. Decide and update either the export to a named export or the tests to import default; prefer named export per repo code patterns.
      - Decision: Keep default export for Babel compatibility; updated unit tests to import default. Note: This deviates from repo default, but is an explicit exception in rules for the Babel plugin.

  - [ ] Documentation
    - [ ] Complete `packages/@auto-tracer/plugin-babel-react18/README.md` with options, examples, RSC notes
    - [ ] Update Next app READMEs with setup steps, options, and mermaid flow diagrams
