# Islands Loader - HTML Page

This is the **loader page** for the React Islands Architecture demo. It's a plain HTML page (served by Vite) that loads and orchestrates two independent React islands.

## Purpose

- **Load AutoTracer once** - Initialize shared tracing instance
- **Load React from CDN** - Provide shared React runtime
- **Load island UMD bundles** - Fetch each island's JavaScript
- **Mount islands** - Call each island's `mount()` function
- **Provide UI** - Static HTML/CSS layout and instructions

## Running

```bash
# First, build the islands
pnpm --filter example-islands-react1 build
pnpm --filter example-islands-react2 build

# Then run the loader
pnpm dev
```

Open http://localhost:5200

## How It Works

The `index.html` file:

1. **Loads AutoTracer UMD** from Island 1's dev server:
   ```html
   <script src="http://localhost:5201/auto-tracer-react18.umd.js"></script>
   ```

2. **Initializes AutoTracer globally**:
   ```html
   <script>
     window.AutoTracer.autoTracer({ enabled: true, ... })
   </script>
   ```

3. **Loads React from unpkg CDN**:
   ```html
   <script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
   <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
   ```

4. **Loads Island 1 UMD**:
   ```html
   <script src="http://localhost:5201/island.umd.js"></script>
   <script>window.Island1.mount('island-1')</script>
   ```

5. **Loads Island 2 UMD**:
   ```html
   <script src="http://localhost:5202/island.umd.js"></script>
   <script>window.Island2.mount('island-2')</script>
   ```

## DOM Structure

```html
<div class="container">
  <header>...</header>

  <div class="islands-container">
    <!-- Island 1 mounts here -->
    <div id="island-1"></div>

    <!-- Island 2 mounts here -->
    <div id="island-2"></div>
  </div>

  <div class="info-box">...</div>
</div>
```

## Development vs Production

### Development (Current)

- Islands loaded from dev servers (ports 5201, 5202)
- AutoTracer UMD loaded from Island 1 dev server
- React loaded from unpkg CDN
- Enables quick iteration

### Production

For production, you would:

1. **Build islands** to static files
2. **Host on CDN** (e.g., CloudFront, Netlify)
3. **Update URLs** to point to CDN:
   ```html
   <script src="https://cdn.yoursite.com/islands/island1.abc123.umd.js"></script>
   ```
4. **Use minified React**:
   ```html
   <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
   ```

## Files

```
example-islands-loader/
├── index.html       # Main HTML page
├── package.json     # Minimal package (just Vite)
└── vite.config.ts   # Simple dev server config
```

## Technologies

- Plain HTML5
- CSS Grid & Flexbox
- Vite (dev server only, no build step)

## Related

- [Islands Architecture Demo README](../ISLANDS-README.md)
- [Island 1 (Counter & Todo)](../example-islands-react1/README.md)
- [Island 2 (Timer & Form)](../example-islands-react2/README.md)
