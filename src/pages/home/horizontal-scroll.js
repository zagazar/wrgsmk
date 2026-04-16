/**
 * WRGSMK Horizontal Scroll Module
 * Responsive horizontal scroll with GSAP ScrollTrigger.
 * Breakpoint-specific config + SPEED_MULTIPLIER for scroll pacing.
 *
 * Expects globals: gsap, ScrollTrigger, Webflow
 */
export function initHorizontalScroll() {
  window.Webflow = window.Webflow || [];
  Webflow.push(function () {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[WRGSMK] GSAP or ScrollTrigger not found.');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    window.WRGSMK_HORIZONTAL_SCROLL = {
      SELECTORS: {
        HORIZONTAL_SCROLL: '.horizontal-scroll__content',
        IMAGES: '.horizontal-scroll__content img',
        CONTAINER: '.horizontal-scroll__container',
        IMG_GRID: '.zag_img-grid--img-container',
      },

      BREAKPOINTS: {
        xs: 0, sm: 480, md: 768, lg: 992, xl: 1280, xxl: 1440, xxxl: 1920,
      },

      CONFIG_BP: {
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
      },

      state: {
        resizeTimeout: null,
        scrollTween: null,
        imageScrollTriggers: [],
        activeCfg: null,
      },

      getActiveConfig() {
        const w = window.innerWidth;
        const { sm, md, lg, xl, xxl, xxxl } = this.BREAKPOINTS;
        let key = 'xs';
        if (w >= xxxl) key = 'xxxl';
        else if (w >= xxl) key = 'xxl';
        else if (w >= xl) key = 'xl';
        else if (w >= lg) key = 'lg';
        else if (w >= md) key = 'md';
        else if (w >= sm) key = 'sm';
        const cfg = { ...this.CONFIG_BP.base, ...(this.CONFIG_BP[key] || {}) };
        this.state.activeCfg = cfg;
        return cfg;
      },

      setScrollContentWidth() {
        const cfg = this.state.activeCfg || this.getActiveConfig();
        const scrollContent = document.querySelector(this.SELECTORS.HORIZONTAL_SCROLL);
        const images = document.querySelectorAll(this.SELECTORS.IMAGES);
        const imgGrid = document.querySelector(this.SELECTORS.IMG_GRID);
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
      },

      setupResize() {
        window.addEventListener('resize', () => {
          clearTimeout(this.state.resizeTimeout);
          this.state.resizeTimeout = setTimeout(() => {
            this.getActiveConfig();
            this.setScrollContentWidth();
            ScrollTrigger.refresh();
          }, (this.state.activeCfg || this.CONFIG_BP.base).RESIZE_DEBOUNCE);
        });
      },

      setupImageScaleAnimations() {
        this.state.imageScrollTriggers.forEach((st) => st.kill());
        this.state.imageScrollTriggers = [];

        const cfg = this.state.activeCfg || this.getActiveConfig();
        const images = gsap.utils.toArray(this.SELECTORS.IMAGES);
        if (!images.length || !this.state.scrollTween) return;

        gsap.set(images, {
          scale: cfg.IMG_SCALE_FROM,
          transformOrigin: '50% 50%',
          willChange: 'transform',
        });

        images.forEach((img) => {
          const st = ScrollTrigger.create({
            trigger: img,
            containerAnimation: this.state.scrollTween,
            start: 'top bottom',
            onEnter: () =>
              gsap.to(img, {
                scale: cfg.IMG_SCALE_TO,
                duration: cfg.IMG_SCALE_DURATION,
                ease: 'back.out',
              }),
            onLeaveBack: () =>
              gsap.to(img, {
                scale: cfg.IMG_SCALE_FROM,
                duration: cfg.IMG_SCALE_DURATION,
                ease: 'back.inOut',
              }),
          });
          this.state.imageScrollTriggers.push(st);
        });
      },

      init() {
        const scrollContent = document.querySelector(this.SELECTORS.HORIZONTAL_SCROLL);
        const container = document.querySelector(this.SELECTORS.CONTAINER);
        const imgGrid = document.querySelector(this.SELECTORS.IMG_GRID);
        if (!scrollContent || !container) return;

        this.destroy();
        const cfg = this.getActiveConfig();
        this.setScrollContentWidth();

        this.state.scrollTween = gsap.fromTo(
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

        this.setupImageScaleAnimations();

        document.querySelectorAll(this.SELECTORS.IMAGES).forEach((img) => {
          if (img.complete) return;
          img.addEventListener(
            'load',
            () => {
              this.setScrollContentWidth();
              ScrollTrigger.refresh();
            },
            { once: true }
          );
        });

        window.addEventListener(
          'load',
          () => {
            this.setScrollContentWidth();
            ScrollTrigger.refresh();
          },
          { once: true }
        );

        this.setupResize();
      },

      destroy() {
        this.state.imageScrollTriggers.forEach((st) => st.kill());
        this.state.imageScrollTriggers = [];
        if (this.state.scrollTween) {
          this.state.scrollTween.kill();
          this.state.scrollTween = null;
        }
        if (this.state.resizeTimeout) {
          clearTimeout(this.state.resizeTimeout);
          this.state.resizeTimeout = null;
        }
      },
    };

    window.WRGSMK_HORIZONTAL_SCROLL.init();
  });
}
