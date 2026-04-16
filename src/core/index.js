/**
 * WRGSMK Core — loaded on every page
 *
 * Initializes:
 * - GSAP plugin registration (ScrollTrigger, SplitText)
 * - Lenis smooth scrolling
 * - Parallax (data-speed)
 * - Context menu guard
 */
import { initLenis } from './lenis-init.js';
import { initParallax } from './parallax.js';
import { initContextGuard } from './context-guard.js';

(function () {
  // Register only the GSAP plugins we actually use site-wide
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  initLenis();
  initParallax();
  initContextGuard();
})();
