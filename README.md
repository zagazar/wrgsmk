# WRGSMK — Custom Scripts for wuergsamkeiten.com

Modular, versioned JavaScript for the Webflow portfolio site. Served via [jsDelivr CDN](https://www.jsdelivr.com/).

## Structure

```
src/
  core/               ← Loaded on every page
    lenis-init.js       Lenis smooth scroll + GSAP ticker
    parallax.js         data-speed parallax
    context-guard.js    Right-click guard
  pages/
    home/             ← / only
      horizontal-scroll.js
      circle-text.js
    illustration/     ← /illustration only
      mouse-pan.js
      rotating-words.js
    shop/             ← /shop only
      shop-effects.js
dist/                 ← Minified bundles (built by esbuild)
  wrgsmk-core.min.js
  wrgsmk-home.min.js
  wrgsmk-illustration.min.js
  wrgsmk-shop.min.js
```

## Setup

```bash
npm install
npm run build
```

## Webflow Integration

Add to **Site-wide Custom Code (Before `</body>`):**
```html
<script src="https://cdn.jsdelivr.net/gh/zagazar/wrgsmk@1.0.0/dist/wrgsmk-core.min.js" defer></script>
```

Add to **Page-specific Custom Code (Before `</body>`):**
```html
<!-- Home -->
<script src="https://cdn.jsdelivr.net/gh/zagazar/wrgsmk@1.0.0/dist/wrgsmk-home.min.js" defer></script>

<!-- Illustration -->
<script src="https://cdn.jsdelivr.net/gh/zagazar/wrgsmk@1.0.0/dist/wrgsmk-illustration.min.js" defer></script>

<!-- Shop -->
<script src="https://cdn.jsdelivr.net/gh/zagazar/wrgsmk@1.0.0/dist/wrgsmk-shop.min.js" defer></script>
```

## External Dependencies (loaded by Webflow, not bundled)

- GSAP 3.14.2 + ScrollTrigger + SplitText (Webflow CDN)
- Lenis 1.2.3 (jsDelivr)
- CircleType 2.3.1 (jsDelivr, home only)

## Releasing

1. `npm run build`
2. Commit dist/ changes
3. `git tag v1.x.x && git push origin v1.x.x`
4. jsDelivr picks up the new tag automatically
5. Update version number in Webflow script tags
