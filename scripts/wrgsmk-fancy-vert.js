/**
 * WRGSMK Fancy Vert Module
 * Standalone fancy vertical background animations
 */

window.WRGSMK_FANCY_VERT = {
  
  SELECTORS: {
    FANCY_VERT: '.fancy-hl__vert'
  },

  CONFIG: {
    START_TRIGGER: "top bottom",
    END_OFFSET: "+=200%",
    BACKGROUND_POSITION: "500px 100px"
  },

  state: {
    scrollTriggerInstances: []
  },

  init: function() {
    const fancyVertElements = document.querySelectorAll(this.SELECTORS.FANCY_VERT);
    
    if (fancyVertElements.length === 0) return;

    fancyVertElements.forEach((el) => {
      const scrollTrigger = gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: this.CONFIG.START_TRIGGER,
          end: this.CONFIG.END_OFFSET,
          scrub: true
        },
        backgroundPosition: this.CONFIG.BACKGROUND_POSITION,
        ease: "none"
      });

      this.state.scrollTriggerInstances.push(scrollTrigger.scrollTrigger);
    });
  },

  destroy: function() {
    this.state.scrollTriggerInstances.forEach(st => {
      if (st && st.kill) {
        st.kill();
      }
    });
    this.state.scrollTriggerInstances = [];
  }
};