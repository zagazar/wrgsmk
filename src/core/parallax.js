/**
 * Parallax via data-speed attribute
 *
 * Usage: data-speed="0.8" (slower) / "1.2" (faster) / "clamp(1.25)" (Webflow syntax).
 * Expects: window.wrgsmkLenis and gsap global.
 *
 * SPA-aware: on each Barba nav, refreshParallax() re-scans the DOM for the new
 * container's [data-speed] elements. The single lenis scroll listener is bound
 * once; the element list is rebuilt.
 */
let parallaxEls = [];
let listenerBound = false;

function parseSpeed(raw) {
  if (!raw) return 1;
  // Match Webflow's "clamp(1.25)" or plain "1.25" or "-0.5"
  const match = String(raw).match(/-?\d+(?:\.\d+)?/);
  const n = match ? parseFloat(match[0]) : NaN;
  return Number.isFinite(n) ? n : 1;
}

function scanParallaxEls() {
  parallaxEls = Array.from(document.querySelectorAll('[data-speed]'));
}

export function initParallax() {
  const lenis = window.wrgsmkLenis;
  if (!lenis || typeof gsap === 'undefined') {
    console.warn('[WRGSMK] Lenis or GSAP not available — skipping parallax.');
    return;
  }

  scanParallaxEls();

  if (!listenerBound) {
    lenis.on('scroll', ({ scroll }) => {
      for (const el of parallaxEls) {
        const speed = parseSpeed(el.dataset.speed);
        if (speed === 1) continue;
        gsap.set(el, { y: -scroll * (1 - speed) });
      }
    });
    listenerBound = true;
  }
}

export function refreshParallax() {
  scanParallaxEls();
}
