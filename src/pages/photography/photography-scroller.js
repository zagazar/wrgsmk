/**
 * Photography Scroller — Pins the photography section while images scroll through
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() that removes listeners (ScrollTriggers killed via global hook).
 */
export function initPhotographyScroller() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return () => {};

  const container = document.querySelector('.photography-scroller');
  const content = document.querySelector('.photography-scroller__content');
  if (!container || !content) return () => {};

  const setup = () => {
    ScrollTrigger.getAll().forEach((st) => { if (st.trigger === container) st.kill(); });

    const contentHeight = content.offsetHeight;
    const viewportHeight = window.innerHeight;
    const space = contentHeight - viewportHeight;
    container.style.marginBottom = space > 0 ? space + 'px' : '0px';

    ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: () => '+=' + space,
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
    });
  };

  setup();

  const windowLoad = () => {
    setup();
    ScrollTrigger.refresh();
  };
  window.addEventListener('load', windowLoad);

  const imgLoadHandlers = [];
  const images = content.querySelectorAll('img');
  images.forEach((img) => {
    if (img.complete) return;
    const handler = () => {
      setup();
      ScrollTrigger.refresh();
    };
    img.addEventListener('load', handler, { once: true });
    imgLoadHandlers.push({ img, handler });
  });

  const resize = () => {
    setup();
    ScrollTrigger.refresh();
  };
  window.addEventListener('resize', resize);

  return function destroy() {
    window.removeEventListener('load', windowLoad);
    window.removeEventListener('resize', resize);
    imgLoadHandlers.forEach(({ img, handler }) => img.removeEventListener('load', handler));
  };
}
