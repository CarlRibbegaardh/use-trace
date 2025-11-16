# @auto-tracer/plugin-babel-react18

Babel plugin that automatically injects `useAutoTracer()` into React components for enhanced tracing with labeled state and props.

## Installation

```bash
pnpm add -D @auto-tracer/plugin-babel-react18
```

## Usage with Next.js

### 1. Add the Babel plugin

Create or update your `.babelrc` or `babel.config.js`:

```json
{
  "presets": ["next/babel"],
  "plugins": [
    [
      "@auto-tracer/plugin-babel-react18",
      {
        "mode": "opt-out",
        "serverComponents": true
      }
    ]
  ]
}
```

### 2. Initialize the DevTools hook

**Important:** For AutoTracer to work in production builds, you need to ensure the React DevTools hook exists before React loads. You have two options:

#### Option A: Script Tag (Recommended for Next.js)

Add this script to your `_document.tsx` (Pages Router) or custom Document (App Router):

**Pages Router (`pages/_document.tsx`):**

```tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof window === 'undefined' || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;
  var nextID = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(),
    supportsFiber: true,
    inject: function(injected) { return nextID++; },
    onScheduleFiberRoot: function(id, root, children) {},
    onCommitFiberRoot: function(id, root, maybePriorityLevel, didError) {},
    onCommitFiberUnmount: function() {}
  };
})();
            `.trim(),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

**App Router:** Create `src/app/layout.tsx` with a similar script tag in the `<head>`.

#### Option B: Install React DevTools Browser Extension

Alternatively, install the [React DevTools browser extension](https://react.dev/learn/react-developer-tools) for Chrome, Firefox, or Edge. The extension provides the DevTools hook automatically.

**Note:** In development mode, Next.js Fast Refresh already provides the DevTools hook, so this is only needed for production builds.

## Plugin Options

All options from `@auto-tracer/inject-react18` are supported:

```typescript
{
  // Processing mode
  "mode": "opt-out",  // or "opt-in"

  // File patterns (glob)
  "include": ["src/**/*.tsx"],
  "exclude": ["**/*.test.*", "**/*.spec.*"],

  // React Server Components support
  "serverComponents": true,  // Only inject into "use client" modules

  // Hook labeling
  "labelHooks": ["useState", "useReducer"],
  "labelHooksPattern": "^use[A-Z].*"
}
```

## How It Works

The plugin:
1. **Transforms your source code** during the Babel compilation step
2. **Injects `useAutoTracer()`** into eligible React function components
3. **Respects "use client"** directives when `serverComponents: true`
4. **Skips non-Client Components** in RSC mode to prevent server-side errors

Unlike the Vite plugin, the Babel plugin **cannot** automatically inject the DevTools hook into HTML. You must add it manually via a script tag or use the browser extension.

## License

MIT
