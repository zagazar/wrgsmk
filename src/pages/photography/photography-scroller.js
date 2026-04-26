/**
 * Photography Scroller — Pins the photography section while images scroll through.
 *
 * Uses pinSpacing: false plus a manual marginBottom so the masonry grid
 * directly under .photography-scroller butts up against the section
 * without ScrollTrigger inserting a `.pin-spacer` wrapper between them.
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() that kills the ScrollTrigger and detaches listeners.
 */
export function initPhotographyScroller() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return () => {};

  const container = document.querySelector('.photography-scroller');
  const content = document.querySelector('.photography-scroller__content');
  if (!container || !content) return () => {};

  const calcSpace = () => Math.max(content.offsetHeight - window.innerHeight, 0);

  const updateMargin = () => {
    container.style.marginBottom = calcSpace() + 'px';
  };
  updateMargin();

  const trigger = ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: () => '+=' + calcSpace(),
    pin: true,
    pinSpacing: false,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onRefresh: updateMargin,
  });

  // ScrollTrigger listens for window resize internally and calls
  // refresh() — no resize handler of our own. We only force a refresh
  // when images finish loading, since that changes content height.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh);

  const imgs = [];
  content.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', refresh, { once: true });
    imgs.push(img);
  });

  return function destroy() {
    trigger.kill();
    container.style.marginBottom = '';
    window.removeEventListener('load', refresh);
    imgs.forEach((img) => img.removeEventListener('load', refresh));
  };
}
