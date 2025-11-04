# Next.js Mixed-Mode Example (Server + Client)

This example demonstrates the tracing library in a Next.js RSC environment where the app is mostly Server Components, with interactive parts implemented as Client Components.

Key points:

- App Router structure with Server Components by default.
- Client boundary is explicit (`"use client"`) for interactive components.
- In Next.js, auto-injection is currently NOT enabled; client components import/call `useAutoTracer` manually.

Current structure:

- `src/app` (Server Components by default)
- `src/components/TodoAppClient.tsx` wraps all interactive UI and Redux logic
- `src/components/AddTodoForm.tsx` remains a client component
- Playwright E2E verifies SSR content and client interactions

Status: working demo (SSR + manual tracing in client components)

## How to run

- Dev: `pnpm --filter todo-example-next-mixed-mode-injected dev` (http://localhost:5177)
- Build: `pnpm --filter todo-example-next-mixed-mode-injected build`
- E2E: `pnpm --filter todo-example-next-mixed-mode-injected test:e2e`

## Tracing in this example

- Manual tracing only. Import from `auto-tracer` and call `useAutoTracer()` inside client components as needed.
- RSC-aware auto-injection logic exists in the core, but Next.js apps in this repo are not yet wired to run the transform at build time.

## RSC notes

- Server components render static content.
- Client components (with `"use client"`) handle state and interactions; that is where tracing hooks live.

### Flow (conceptual)

```mermaid
flowchart TD
	A[Server Module] -->|no transform| E[Run App]
	B[Client Module with "use client"] --> C[Manual useAutoTracer()]
	C --> E[Run App]
```
