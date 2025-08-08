/**
 * WRGSMK Horizontal Scroll Module
 * Standalone horizontal scrolling functionality
 */

window.WRGSMK_HORIZONTAL_SCROLL = {
  
  SELECTORS: {
    HORIZONTAL_SCROLL: '.horizontal-scroll__content',
    IMAGES: '.horizontal-scroll__content img',
    CONTAINER: '.horizontal-scroll__container',
    IMG_GRID: '.zag_img-grid--img-container'
  },

  CONFIG: {
    IMAGE_FALLBACK_WIDTH: 300,
    IMAGE_SPACING: 20,
    TRIGGER_START: "top 8%",
    RESIZE_DEBOUNCE: 150
  },

  state: {
    resizeTimeout: null,
    scrollTriggerInstance: null
  },

  setScrollContentWidth: function() {
    const scrollContent = document.querySelector(this.SELECTORS.HORIZONTAL_SCROLL);
    const images = document.querySelectorAll(this.SELECTORS.IMAGES);
    const imgGrid = document.querySelector(this.SELECTORS.IMG_GRID);
    
    if (!scrollContent) return;
    
    let totalWidth = 0;
    
    if (images.length > 0) {
      images.forEach(img => {
        totalWidth += img.offsetWidth || this.CONFIG.IMAGE_FALLBACK_WIDTH;
      });
      totalWidth += (images.length - 1) * this.CONFIG.IMAGE_SPACING;
    } else if (imgGrid) {
      totalWidth = imgGrid.offsetWidth || window.innerWidth * 2;
    } else {
      totalWidth = window.innerWidth * 3;
    }
    
    scrollContent.style.width = `${totalWidth}px`;
  },

  
  // Responsive Percent-Konfiguration
getResponsivePercents: function() {
  const w = window.innerWidth;
  const container = document.querySelector(this.SELECTORS.CONTAINER);
  const scrollContent = document.querySelector(this.SELECTORS.HORIZONTAL_SCROLL);
  if (!container || !scrollContent) return { START_PERCENT: 0, END_PERCENT: -100 };

  const containerWidth = container.offsetWidth;
  const contentWidth = scrollContent.offsetWidth;

  // Beispiel: Endwert so dass Content komplett sichtbar wird
  const END_PERCENT = ((contentWidth - containerWidth) / contentWidth) * -100;
  // Startwert evtl. immer 0
  return { START_PERCENT: 0, END_PERCENT };
},

  setupResize: function() {
    window.addEventListener('resize', () => {
      clearTimeout(this.state.resizeTimeout);
      this.state.resizeTimeout = setTimeout(() => {
        this.init(); // Instanz wird im init neu erstellt!
      }, this.CONFIG.RESIZE_DEBOUNCE);
    });
  },

  init: function() {
    const scrollContent = document.querySelector(this.SELECTORS.HORIZONTAL_SCROLL);
    const container = document.querySelector(this.SELECTORS.CONTAINER);
    const imgGrid = document.querySelector(this.SELECTORS.IMG_GRID);
    
    if (!scrollContent || !container) return;

    const percents = this.getResponsivePercents();

    // Falls bereits eine Instanz existiert, vorher zerstören!
    if (this.state.scrollTriggerInstance) {
      this.state.scrollTriggerInstance.scrollTrigger.kill();
    }

    this.state.scrollTriggerInstance = gsap.fromTo(scrollContent,
      { xPercent: percents.START_PERCENT },
      {
        xPercent: percents.END_PERCENT,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          pin: true,
          start: this.CONFIG.TRIGGER_START,
          scrub: 1,
          end: () => `+=${scrollContent.offsetWidth - container.offsetWidth}`        }
      }
    );

    this.setScrollContentWidth();
    // setupResize nur einmal aufrufen!
    if (!this._resizeSetup) {
      this.setupResize();
      this._resizeSetup = true;
    }
  },

  destroy: function() {
    if (this.state.scrollTriggerInstance) {
      this.state.scrollTriggerInstance.scrollTrigger.kill();
    }
    if (this.state.resizeTimeout) {
      clearTimeout(this.state.resizeTimeout);
    }
  }
};
