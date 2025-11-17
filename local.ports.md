# Local Ports Map

This document lists all ports used by apps for dev/preview (Vite/Next) and by Playwright configs (baseURL/webServer.url).

## Summary By App

### apps/todo-example-vite
- Dev (Vite): 5172 (strict)
- Preview (Vite): 5172 (strict)
- Playwright:
  - `playwright.config.ts`: baseURL/url http://localhost:5172
  - `playwright.explicit.config.ts`: baseURL/url http://localhost:5173
  - `playwright.pattern.config.ts`: baseURL/url http://localhost:5174

### apps/todo-example-vite-injected
- Dev (Vite): 5182 (strict)
- Preview (Vite): 5182 (strict)
- Playwright:
  - `playwright.config.ts`: baseURL/url http://localhost:5182
  - `playwright.explicit.config.ts`: baseURL/url http://localhost:5183
  - `playwright.pattern.config.ts`: baseURL/url http://localhost:5184

### apps/todo-example-monorepo-app-vite5-react18
- Dev (Vite): 5180 (strict)
- Preview (Vite): not configured (defaults apply if used)
- Playwright: none in this app

### apps/example-app
- Dev (Vite): 5185 (strict)
- Preview (Vite): 5185 (strict)
- Playwright: none in this app

### apps/example-app2
- Dev (Vite): 5186 (strict)
- Preview (Vite): 5186 (strict)
- Playwright: none in this app

### apps/example-microfrontend-host
- Dev (Vite): 5190 (strict)
- Preview (Vite): 5190 (strict)
- Playwright: none in this app

### apps/example-microfrontend-remote1
- Dev (Vite Preview): 5191 (strict, serves built files)
- Preview (Vite): 5191 (strict)
- Playwright: none in this app

### apps/example-microfrontend-remote2
- Dev (Vite Preview): 5192 (strict, serves built files)
- Preview (Vite): 5192 (strict)
- Playwright: none in this app

### apps/todo-example-next-client-only-injected
- Dev (Next): 5176
- Start/Preview (Next): 5176
- Playwright:
  - `playwright.config.ts`: baseURL/url http://localhost:5176

### apps/todo-example-next-mixed-mode-injected
- Dev (Next): 5177
- Start/Preview (Next): 5177
- Playwright:
  - `playwright.config.ts`: baseURL/url http://localhost:5177

## Source References
- Vite dev/preview ports are defined in each app's `vite.config*.ts` under `server.port` and `preview.port`.
- Next dev/start ports are defined in each app's `package.json` scripts (`next dev -p <port>`, `next start -p <port>`).
- Playwright ports are defined per app in the `playwright*.config.ts` files under `use.baseURL` and `webServer.url`.

## Notes
- All Vite apps have `strictPort: true` to avoid port auto-increment.
- All Playwright configs set `reuseExistingServer: false` so servers are torn down and port conflicts fail fast.
