/**
 * Photography Scroller — Pins the photography section while images scroll through
 *
 * Expects globals: gsap, ScrollTrigger
 */
export function initPhotographyScroller() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const container = document.querySelector('.photography-scroller');
  const content = document.querySelector('.photography-scroller__content');
  if (!container || !content) return;

  const setup = () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.trigger === container) st.kill();
    });

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

  window.addEventListener('load', () => {
    setup();
    ScrollTrigger.refresh();
  });

  const images = content.querySelectorAll('img');
  images.forEach((img) => {
    if (img.complete) return;
    img.addEventListener(
      'load',
      () => {
        setup();
        ScrollTrigger.refresh();
      },
      { once: true }
    );
  });

  window.addEventListener('resize', () => {
    setup();
    ScrollTrigger.refresh();
  });
}
