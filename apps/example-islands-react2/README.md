# Island 2 - Timer & Form

This is **Island 2** in the React Islands Architecture demo. It's an independent React application that builds to a UMD bundle and can be embedded in any HTML page.

## Features

- **Timer Component**: Start/pause/reset timer with useEffect
- **User Form**: Name and email inputs with submit handling
- **Toggle Visibility**: Show/hide individual components
- **Automatic Tracing**: AutoTracer instrumentation injected at build time

## State Labels (Auto-Traced)

All state is automatically labeled by `@auto-tracer/plugin-vite-react18`:

- `seconds` - Timer seconds counter
- `isRunning` - Timer running state
- `name` - Form name field
- `email` - Form email field
- `submitted` - Form submission state
- `showTimer` - Timer visibility toggle
- `showForm` - Form visibility toggle

## Development

### Standalone Mode

Run this island independently:

```bash
pnpm dev
```

Open http://localhost:5202

This mode:
- Initializes its own AutoTracer instance
- Renders into `#root` element
- Uses the standalone `index.html`

### Production Build (UMD)

Build for embedding in the loader page:

```bash
pnpm build
```

This creates:
- `dist/island.umd.js` - UMD bundle exposing `window.Island2`
- `dist/island.css` - Styles
- `dist/auto-tracer-react18.umd.js` - AutoTracer UMD (for standalone)

### Integration

The loader page embeds this island by:

```html
<!-- Load the UMD bundle -->
<script src="http://localhost:5202/island.umd.js"></script>

<!-- Mount to a DOM element -->
<script>
  window.Island2.mount('island-2');
</script>
```

## Build Configuration

- **Format**: UMD
- **Global Name**: `Island2`
- **External Dependencies**: React, ReactDOM, AutoTracer
- **Entry**: `src/mount.tsx`

## File Structure

```
src/
├── App.tsx       # Main island component
├── App.css       # Island styles
├── main.tsx      # Standalone entry point
├── mount.tsx     # UMD mount function
└── index.css     # Base styles
```

## API

### `mount(elementId: string)`

Mounts the island to a DOM element.

```typescript
Island2.mount('my-container-id')
```

**Parameters:**
- `elementId` - The ID of the DOM element to mount into

**Example:**

```html
<div id="island-2"></div>
<script src="island.umd.js"></script>
<script>
  Island2.mount('island-2')
</script>
```

## Technologies

- React 18.3.1
- TypeScript
- Vite (UMD library mode)
- @auto-tracer/plugin-vite-react18 (automatic instrumentation)

## Related

- [Islands Architecture Demo README](../ISLANDS-README.md)
- [Island 1 (Counter & Todo)](../example-islands-react1/README.md)
- [Loader Page](../example-islands-loader/README.md)
