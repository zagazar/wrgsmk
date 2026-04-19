/**
 * WRGSMK Core — runs once on first app load
 *
 * Initializes:
 * - GSAP plugin registration (ScrollTrigger)
 * - Lenis smooth scrolling
 * - Parallax (data-speed)
 * - Context menu guard
 */
import { initLenis } from './lenis-init.js';
import { initParallax } from './parallax.js';
import { initContextGuard } from './context-guard.js';

export function initCore() {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  initLenis();
  initParallax();
  initContextGuard();
}
