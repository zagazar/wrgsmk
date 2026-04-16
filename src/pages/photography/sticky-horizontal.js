/**
 * Sticky Horizontal — Pins .horiz--photography until a stop element
 *
 * Expects globals: gsap, ScrollTrigger
 */
export function initStickyHorizontal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const contentEl = document.querySelector('.horizontal-scroll__content');
  const stopEl = document.querySelector('.wrgsmk-darkmode--text--bottom');
  const pinElSel = '.horiz--photography';
  if (!contentEl || !stopEl) return;

  const setup = () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars && st.vars.pin === pinElSel) st.kill();
    });

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

  window.addEventListener('load', () => {
    setup();
    ScrollTrigger.refresh();
  });

  window.addEventListener('resize', () => {
    setup();
    ScrollTrigger.refresh();
  });

  const imgs = document.querySelectorAll('.horizontal-scroll__content img');
  imgs.forEach((img) => {
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
}
