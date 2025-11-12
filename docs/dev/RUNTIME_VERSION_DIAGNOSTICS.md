# Runtime Version Diagnostics Guide

## Problem Symptoms

Your external site is showing these symptoms:

1. ⚠️ Warning: `useTrace` is **not stable** (identical value detection)
2. Functions display as `(fn)` instead of `(fn:N)` format

## Root Cause

These symptoms indicate you're using an **older version** of `@auto-tracer/react18` that:

- Uses the old stringify format: `(fn)`
- Does not have function identity tracking: `(fn:123)`

The new version (1.0.0-alpha.7+) includes:

- Function identity tracking with unique IDs: `(fn:1)`, `(fn:2)`, etc.
- Better identical value detection
- Stable object reference handling

---

## Diagnostic Steps

### 1. Check Installed Package Versions

In your external site's project directory, run:

```powershell
# Check @auto-tracer/react18 version
npm list @auto-tracer/react18

# Check use-trace version
npm list use-trace

# Or with pnpm
pnpm list @auto-tracer/react18
pnpm list use-trace
```

**Expected versions:**

- `@auto-tracer/react18`: `1.0.0-alpha.7` or higher
- `use-trace`: `0.4.3` or higher (if using manual tracing)

---

### 2. Check for Dependency Conflicts

Multiple versions can be installed due to transitive dependencies:

```powershell
# npm
npm ls @auto-tracer/react18

# pnpm
pnpm list @auto-tracer/react18 --depth=Infinity

# yarn
yarn why @auto-tracer/react18
```

Look for output like:

```
@auto-tracer/react18@1.0.0-alpha.7
├─ my-app
└─ some-library@1.0.0
   └─ @auto-tracer/react18@0.9.0  ⚠️ CONFLICT!
```

---

### 3. Verify Runtime Version in Browser

Add this diagnostic code to your app temporarily:

```typescript
// In your main.tsx or App.tsx
import { stringify } from "@auto-tracer/react18/dist/lib/functions/stringify.js";

// Test the stringify function
const testFn = () => console.log("test");
const result = stringify(testFn);
console.log("🔍 Runtime stringify format:", result);
// Expected: "(fn:1)" or similar
// Old version: "(fn)"

// Also check the function itself
console.log("🔍 stringify function:", stringify.toString().substring(0, 200));
```

**Expected output (new version):**

```
🔍 Runtime stringify format: (fn:1)
🔍 stringify function: function stringify(value) { try { if (typeof value === "function") { const id = getFunctionId(value); return `(fn:${id})`; } ...
```

**Old version output:**

```
🔍 Runtime stringify format: (fn)
🔍 stringify function: function stringify(value) { ... return "(fn)"; ...
```

---

### 4. Check Build Configuration

If using Vite with the auto-injection plugin, verify your config:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { autoTracerPlugin } from "@auto-tracer/plugin-vite-react18";

export default defineConfig({
  plugins: [
    react(),
    autoTracerPlugin({
      // Ensure you're importing from the correct package
      // and not using a cached old version
    }),
  ],
});
```

Check the plugin version:

```powershell
npm list @auto-tracer/plugin-vite-react18
# Expected: 1.0.0-alpha.7 or higher
```

---

### 5. Check for Build Cache Issues

Old build artifacts can cause version mismatches:

```powershell
# Clear build cache
rm -rf node_modules/.vite
rm -rf dist

# Clear npm/pnpm cache
npm cache clean --force
# or
pnpm store prune

# Reinstall and rebuild
npm install
npm run build
```

---

## Resolution Steps

### Option 1: Update to Latest Version (Recommended)

```powershell
# Update to latest alpha version
npm install @auto-tracer/react18@latest
npm install use-trace@latest

# Or with pnpm
pnpm update @auto-tracer/react18 use-trace
```

### Option 2: Force Specific Version

In your `package.json`:

```json
{
  "dependencies": {
    "@auto-tracer/react18": "1.0.0-alpha.7"
  },
  "overrides": {
    "@auto-tracer/react18": "1.0.0-alpha.7"
  }
}
```

For pnpm, use `pnpm.overrides`:

```json
{
  "pnpm": {
    "overrides": {
      "@auto-tracer/react18": "1.0.0-alpha.7"
    }
  }
}
```

### Option 3: Verify Module Resolution

Add this to your app's initialization to confirm which module is loaded:

```typescript
// main.tsx
import * as autoTracer from "@auto-tracer/react18";

console.group("🔍 AutoTracer Runtime Diagnostics");
console.log("Package exports:", Object.keys(autoTracer));
console.log("Has getFunctionId?", "getFunctionId" in autoTracer);
console.log("stringify location:", autoTracer.stringify);

// Test function identity
const fn1 = () => {};
const fn2 = () => {};
console.log("Function 1:", autoTracer.stringify(fn1));
console.log("Function 2:", autoTracer.stringify(fn2));
console.log(
  "Same function twice:",
  autoTracer.stringify(fn1),
  autoTracer.stringify(fn1)
);
console.groupEnd();
```

**Expected output (correct version):**

```
🔍 AutoTracer Runtime Diagnostics
  Package exports: ['initializeAutoTracer', 'stringify', ...]
  Has getFunctionId?: true
  Function 1: (fn:1)
  Function 2: (fn:2)
  Same function twice: (fn:1) (fn:1)
```

---

## Understanding the useTrace "Not Stable" Warning

The warning about `useTrace` not being stable occurs because:

1. **Old stringify** compares objects like:

   ```
   {"exit":"(fn)","log":"(fn)","state":"(fn)"}
   ```

   Every function looks identical: `"(fn)"`

2. **New stringify** compares objects with unique IDs:
   ```
   {"exit":"(fn:1)","log":"(fn:2)","state":"(fn:3)"}
   ```
   Each function has a stable identity

When the same function reference is used across renders, the new version shows:

```
{"exit":"(fn:1)","log":"(fn:2)","state":"(fn:3)"}
→ {"exit":"(fn:1)","log":"(fn:2)","state":"(fn:3)"}
```

✅ No change detected (same IDs)

With the old version:

```
{"exit":"(fn)","log":"(fn)","state":"(fn)"}
→ {"exit":"(fn)","log":"(fn)","state":"(fn)"}
```

⚠️ Can't tell if functions are the same (no identity)

---

## Quick Verification Command

Run this one-liner in your project:

```powershell
node -e "const {stringify} = require('@auto-tracer/react18/dist/lib/functions/stringify.js'); const fn = () => {}; console.log(stringify(fn));"
```

**Expected:** `(fn:1)` or similar number
**Problem:** `(fn)` without number

---

## Current Package Versions (This Repo)

For reference, the current versions in this monorepo:

| Package                             | Version         | Status     |
| ----------------------------------- | --------------- | ---------- |
| `@auto-tracer/react18`              | `1.0.0-alpha.7` | ✅ Current |
| `use-trace`                         | `0.4.3`         | ✅ Current |
| `@auto-tracer/plugin-vite-react18`  | `1.0.0-alpha.7` | ✅ Current |
| `@auto-tracer/plugin-babel-react18` | `1.0.0-alpha.7` | ✅ Current |

---

## Common Issues

### Issue 1: Multiple Versions in node_modules

**Symptom:** Different packages depend on different versions

**Solution:**

```powershell
# Force resolution to single version
pnpm install --force
# or
npm install --legacy-peer-deps
```

### Issue 2: Cached Build Artifacts

**Symptom:** Code changes don't appear in browser

**Solution:**

```powershell
# Clear Vite cache
rm -rf node_modules/.vite

# Hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Issue 3: TypeScript Using Wrong Types

**Symptom:** TypeScript errors about missing exports

**Solution:**

```powershell
# Rebuild TypeScript references
npx tsc --build --force
```

---

## Next Steps

After updating:

1. ✅ Verify versions: `npm list @auto-tracer/react18`
2. ✅ Clear caches: `rm -rf node_modules/.vite dist`
3. ✅ Rebuild: `npm run build`
4. ✅ Test runtime: Add diagnostic code above
5. ✅ Check output: Should see `(fn:1)`, `(fn:2)`, etc.

---

## Support

If issues persist after following these steps:

1. Share the output of: `npm list @auto-tracer/react18`
2. Share the runtime diagnostic output (from step 3)
3. Check if any other libraries bundle their own copy of autoTracer
