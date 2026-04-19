# WRGSMK — Custom Scripts for wuergsamkeiten.com

Single-bundle JavaScript app for the Webflow portfolio site. Served via [jsDelivr CDN](https://www.jsdelivr.com/). Includes Barba.js for SPA-style page transitions.

## Structure

```
src/
  app/
    index.js              ← single entry point
    barba-controller.js   ← barba.init, views, transitions
    transitions/          ← title-wipe and future transitions
  core/                   ← runs once on first load
    lenis-init.js
    parallax.js
    context-guard.js
  pages/                  ← per-namespace init/destroy modules
    home/
    illustration/
    shop/
    photography/
    auftragsarbeiten/
dist/
  wrgsmk-app.min.js       ← the one bundle that gets shipped
```

## Setup

```bash
npm install
npm run build
```

## Webflow Integration

**Markup (per page template):**
- `<body data-barba="wrapper">`
- Outer page wrap: `data-barba="container"`, `data-barba-namespace="<slug>"`, `data-barba-title="<TITLE>"`

**Site-wide Custom Code (Before `</body>`):**
```html
<script src="https://cdn.jsdelivr.net/gh/zagazar/wrgsmk@1.1.0/dist/wrgsmk-app.min.js" defer></script>
```

No per-page Custom Code blocks needed. The bundle handles all pages based on `data-barba-namespace`.

## External Dependencies (loaded by Webflow, not bundled)

- GSAP 3.14.2 + ScrollTrigger + SplitText (Webflow CDN)
- Lenis 1.2.3 (jsDelivr)
- CircleType 2.3.1 (jsDelivr, home only)

## Releasing

1. `npm run build`
2. Commit `dist/` changes
3. `git tag v1.x.x && git push origin v1.x.x`
4. jsDelivr picks up the new tag automatically
5. Update version number in the Webflow site-wide script tag
