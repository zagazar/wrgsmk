/**
 * Lenis Smooth Scroll + GSAP ScrollTrigger Integration
 *
 * Expects global: Lenis, gsap, ScrollTrigger
 * Loaded site-wide on every page.
 */
export function initLenis() {
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') {
    console.warn('[WRGSMK] Lenis or GSAP not found — skipping smooth scroll init.');
    return null;
  }

  const lenis = new Lenis({
    lerp: 0.1666,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // Expose globally so page-specific scripts can access it
  window.wrgsmkLenis = lenis;

  return lenis;
}
