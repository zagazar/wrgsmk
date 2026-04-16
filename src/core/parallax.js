/**
 * Parallax via data-speed attribute
 *
 * Usage: Add data-speed="0.8" (slower) or data-speed="1.2" (faster) to any element.
 * Expects: window.wrgsmkLenis (from lenis-init.js) and gsap global.
 */
export function initParallax() {
  const lenis = window.wrgsmkLenis;
  if (!lenis || typeof gsap === 'undefined') {
    console.warn('[WRGSMK] Lenis or GSAP not available — skipping parallax.');
    return;
  }

  const parallaxEls = document.querySelectorAll('[data-speed]');
  if (!parallaxEls.length) return;

  lenis.on('scroll', ({ scroll }) => {
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 1;
      const y = -scroll * (1 - speed);
      gsap.set(el, { y });
    });
  });
}
