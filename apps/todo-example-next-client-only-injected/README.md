# Next.js Client-Only Example

This example demonstrates the tracing library in a Next.js App Router setup where all components are Client Components.

Key points:

- Client-only App Router with `"use client"` in layout and components
- Babel plugin auto-injection is enabled via `.babelrc` to label hooks
- autoTracer is initialized on the client via a minimal bootstrap component in `src/app/AutoTracerBootstrap.tsx`, rendered at the top of `layout.tsx`
- Intended for comparison with the mixed-mode (SSR + client) example

Current structure:

- `src/app` (App Router)
- Client components with state/hooks
- Playwright E2E: includes a logs-based test asserting initial tracer output

Status: working demo (autoTracer initialized on client, Babel auto-injection enabled)

## How to run

- Dev: `pnpm --filter todo-example-next-client-only-injected dev` (http://localhost:5176)
- Build: `pnpm --filter todo-example-next-client-only-injected build`
- E2E: `pnpm --filter todo-example-next-client-only-injected test:e2e`

## Tracing in this example

- Global tracing: `autoTracer()` is started by `AutoTracerBootstrap` as early as possible on the client
- Labeled logs: The Babel plugin auto-injects `useAutoTracer` into client components for readable labels in logs
- Manual usage is still possible for additional context, but not required

## RSC notes

- All modules are client components (`"use client"`), so RSC separation does not apply here

### Flow (conceptual)

```mermaid
graph TD
	A[Next App Router layout "use client"] --> B[AutoTracerBootstrap]
	B -->|autoTracer| C[Attach to DevTools hook]
	C --> D[Render client components]
	D --> E[Labeled logs via injected useAutoTracer]
```
