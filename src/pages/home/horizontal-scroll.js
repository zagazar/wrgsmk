/**
 * WRGSMK Horizontal Scroll Module
 * Responsive horizontal scroll with GSAP ScrollTrigger.
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() that kills ScrollTriggers and removes resize listener.
 */
export function initHorizontalScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[WRGSMK] GSAP or ScrollTrigger not found.');
    return () => {};
  }
  gsap.registerPlugin(ScrollTrigger);

  const SELECTORS = {
    HORIZONTAL_SCROLL: '.horizontal-scroll__content',
    IMAGES: '.horizontal-scroll__content img',
    CONTAINER: '.horizontal-scroll__container',
    IMG_GRID: '.zag_img-grid--img-container',
  };

  const BREAKPOINTS = {
    xs: 0, sm: 480, md: 768, lg: 992, xl: 1280, xxl: 1440, xxxl: 1920,
  };

  const CONFIG_BP = {
    base: {
      START_PERCENT: 80,
      END_PERCENT: -66,
      TRIGGER_START: 'top 250px',
      IMAGE_FALLBACK_WIDTH: 300,
      IMAGE_SPACING: 20,
      RESIZE_DEBOUNCE: 150,
      IMG_SCALE_FROM: 0.7,
      IMG_SCALE_TO: 1,
      IMG_SCALE_DURATION: 0.4666,
      SCRUB: 1,
      PIN: true,
      SPEED_MULTIPLIER: 1,
    },
    xs:   { START_PERCENT: 30, END_PERCENT: -90, TRIGGER_START: 'top 250px' },
    sm:   { START_PERCENT: 40, END_PERCENT: -80 },
    md:   { START_PERCENT: 50, END_PERCENT: -70 },
    lg:   { START_PERCENT: 45, END_PERCENT: -60 },
    xl:   { START_PERCENT: 45, END_PERCENT: -60 },
    xxl:  { START_PERCENT: 45, END_PERCENT: -20 },
    xxxl: { START_PERCENT: 45, END_PERCENT: -13 },
  };

  const state = {
    resizeTimeout: null,
    scrollTween: null,
    imageScrollTriggers: [],
    activeCfg: null,
    resizeHandler: null,
    imgLoadHandlers: [],
    windowLoadHandler: null,
  };

  function getActiveConfig() {
    const w = window.innerWidth;
    const { sm, md, lg, xl, xxl, xxxl } = BREAKPOINTS;
    let key = 'xs';
    if (w >= xxxl) key = 'xxxl';
    else if (w >= xxl) key = 'xxl';
    else if (w >= xl) key = 'xl';
    else if (w >= lg) key = 'lg';
    else if (w >= md) key = 'md';
    else if (w >= sm) key = 'sm';
    const cfg = { ...CONFIG_BP.base, ...(CONFIG_BP[key] || {}) };
    state.activeCfg = cfg;
    return cfg;
  }

  function setScrollContentWidth() {
    const cfg = state.activeCfg || getActiveConfig();
    const scrollContent = document.querySelector(SELECTORS.HORIZONTAL_SCROLL);
    const images = document.querySelectorAll(SELECTORS.IMAGES);
    const imgGrid = document.querySelector(SELECTORS.IMG_GRID);
    if (!scrollContent) return;

    let totalWidth = 0;
    if (images.length > 0) {
      images.forEach((img) => {
        const w = img.getBoundingClientRect().width || cfg.IMAGE_FALLBACK_WIDTH;
        totalWidth += w;
      });
      totalWidth += (images.length - 1) * cfg.IMAGE_SPACING;
    } else if (imgGrid) {
      totalWidth = imgGrid.offsetWidth || window.innerWidth * 2;
    } else {
      totalWidth = window.innerWidth * 3;
    }
    scrollContent.style.width = `${totalWidth}px`;
  }

  function setupImageScaleAnimations() {
    state.imageScrollTriggers.forEach((st) => st.kill());
    state.imageScrollTriggers = [];

    const cfg = state.activeCfg || getActiveConfig();
    const images = gsap.utils.toArray(SELECTORS.IMAGES);
    if (!images.length || !state.scrollTween) return;

    gsap.set(images, {
      scale: cfg.IMG_SCALE_FROM,
      transformOrigin: '50% 50%',
      willChange: 'transform',
    });

    images.forEach((img) => {
      const st = ScrollTrigger.create({
        trigger: img,
        containerAnimation: state.scrollTween,
        start: 'top bottom',
        onEnter: () =>
          gsap.to(img, { scale: cfg.IMG_SCALE_TO, duration: cfg.IMG_SCALE_DURATION, ease: 'back.out' }),
        onLeaveBack: () =>
          gsap.to(img, { scale: cfg.IMG_SCALE_FROM, duration: cfg.IMG_SCALE_DURATION, ease: 'back.inOut' }),
      });
      state.imageScrollTriggers.push(st);
    });
  }

  const scrollContent = document.querySelector(SELECTORS.HORIZONTAL_SCROLL);
  const container = document.querySelector(SELECTORS.CONTAINER);
  const imgGrid = document.querySelector(SELECTORS.IMG_GRID);
  if (!scrollContent || !container) return () => {};

  const cfg = getActiveConfig();
  setScrollContentWidth();

  state.scrollTween = gsap.fromTo(
    scrollContent,
    { xPercent: cfg.START_PERCENT },
    {
      xPercent: cfg.END_PERCENT,
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        pin: cfg.PIN,
        start: cfg.TRIGGER_START,
        scrub: cfg.SCRUB,
        end: () => {
          const baseEnd = imgGrid?.offsetWidth
            ? imgGrid.offsetWidth * 0.99
            : window.innerWidth;
          return `+=${baseEnd * cfg.SPEED_MULTIPLIER}`;
        },
      },
    }
  );

  setupImageScaleAnimations();

  const imgs = document.querySelectorAll(SELECTORS.IMAGES);
  imgs.forEach((img) => {
    if (img.complete) return;
    const handler = () => {
      setScrollContentWidth();
      ScrollTrigger.refresh();
    };
    img.addEventListener('load', handler, { once: true });
    state.imgLoadHandlers.push({ img, handler });
  });

  state.windowLoadHandler = () => {
    setScrollContentWidth();
    ScrollTrigger.refresh();
  };
  window.addEventListener('load', state.windowLoadHandler, { once: true });

  state.resizeHandler = () => {
    clearTimeout(state.resizeTimeout);
    state.resizeTimeout = setTimeout(() => {
      getActiveConfig();
      setScrollContentWidth();
      ScrollTrigger.refresh();
    }, (state.activeCfg || CONFIG_BP.base).RESIZE_DEBOUNCE);
  };
  window.addEventListener('resize', state.resizeHandler);

  return function destroy() {
    state.imageScrollTriggers.forEach((st) => st.kill());
    state.imageScrollTriggers = [];
    if (state.scrollTween) {
      state.scrollTween.kill();
      state.scrollTween = null;
    }
    if (state.resizeTimeout) clearTimeout(state.resizeTimeout);
    if (state.resizeHandler) window.removeEventListener('resize', state.resizeHandler);
    if (state.windowLoadHandler) window.removeEventListener('load', state.windowLoadHandler);
    state.imgLoadHandlers.forEach(({ img, handler }) => img.removeEventListener('load', handler));
    state.imgLoadHandlers = [];
  };
}
