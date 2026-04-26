/**
 * Photography Scroller — Pins the photography section, scrubs the photo
 * column vertically through it as the user scrolls.
 *
 * Mechanic: .photography-scroller pins; .photography-scroller__content
 * is GSAP-tweened from y:0 to y:-(contentHeight - viewportHeight) tied
 * to scroll progress, so the photos appear to scroll through the
 * pinned section. pinSpacing: false + manual marginBottom keeps the
 * masonry grid directly under the section without a .pin-spacer wrapper
 * between them.
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() that kills the tween/trigger and detaches listeners.
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

  const tween = gsap.fromTo(
    content,
    { y: 0 },
    {
      y: () => -calcSpace(),
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: () => '+=' + calcSpace(),
        pin: true,
        pinSpacing: false,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: updateMargin,
      },
    }
  );

  // ScrollTrigger handles resize internally. Refresh on image load so
  // the pin distance and scrub end-y reflect the final content height.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh);

  const imgs = [];
  content.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', refresh, { once: true });
    imgs.push(img);
  });

  return function destroy() {
    tween.scrollTrigger?.kill();
    tween.kill();
    container.style.marginBottom = '';
    window.removeEventListener('load', refresh);
    imgs.forEach((img) => img.removeEventListener('load', refresh));
  };
}
