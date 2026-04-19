/**
 * Darkmode Text — Background-position scrub animation
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() (ScrollTrigger killed via global hook).
 */
export function initDarkmodeText() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return () => {};

  const el = document.querySelector('.wrgsmk-darkmode--text__span');
  if (!el) return () => {};

  gsap.fromTo(
    el,
    { backgroundPosition: '50% 100%' },
    {
      backgroundPosition: '50% 0%',
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    }
  );

  return () => {};
}
