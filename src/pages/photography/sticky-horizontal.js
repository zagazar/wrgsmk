/**
 * Sticky Horizontal — Pins .horiz--photography until a stop element
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() that removes listeners (ScrollTriggers killed via global hook).
 */
export function initStickyHorizontal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return () => {};

  const contentEl = document.querySelector('.horizontal-scroll__content');
  const stopEl = document.querySelector('.wrgsmk-darkmode--text--bottom');
  const pinElSel = '.horiz--photography';
  if (!contentEl || !stopEl) return () => {};

  const setup = () => {
    ScrollTrigger.getAll().forEach((st) => { if (st.vars && st.vars.pin === pinElSel) st.kill(); });

    const docTop = (el) => el.getBoundingClientRect().top + window.pageYOffset;
    const docBottom = (el) => el.getBoundingClientRect().bottom + window.pageYOffset;

    const calcEndDistance = () => {
      const stopTop = docTop(stopEl);
      const contentBottomPlus = docBottom(contentEl) + 50;
      const distance = Math.max(0, stopTop - contentBottomPlus);
      return '+=' + distance;
    };

    ScrollTrigger.create({
      trigger: contentEl,
      start: 'center center',
      end: calcEndDistance,
      pin: pinElSel,
      pinSpacing: true,
      anticipatePin: 1,
    });
  };

  setup();

  const windowLoad = () => {
    setup();
    ScrollTrigger.refresh();
  };
  window.addEventListener('load', windowLoad);

  const resize = () => {
    setup();
    ScrollTrigger.refresh();
  };
  window.addEventListener('resize', resize);

  const imgLoadHandlers = [];
  const imgs = document.querySelectorAll('.horizontal-scroll__content img');
  imgs.forEach((img) => {
    if (img.complete) return;
    const handler = () => {
      setup();
      ScrollTrigger.refresh();
    };
    img.addEventListener('load', handler, { once: true });
    imgLoadHandlers.push({ img, handler });
  });

  return function destroy() {
    window.removeEventListener('load', windowLoad);
    window.removeEventListener('resize', resize);
    imgLoadHandlers.forEach(({ img, handler }) => img.removeEventListener('load', handler));
  };
}
