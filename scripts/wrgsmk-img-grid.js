/**
 * WRGSMK Image Grid Module
 * Standalone image grid functionality
 */

window.WRGSMK_IMG_GRID = {
  
  SELECTORS: {
    IMG_GRID: '.zag_img-grid--img-container',
    IMAGES: '.zag_img-grid--img-container img'
  },

  CONFIG: {
    OBSERVER_THRESHOLD: 0.1
  },

  state: {
    observer: null,
    processedElements: new Set()
  },

  setupIntersectionObserver: function() {
    if (!window.IntersectionObserver) return;

    this.state.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.state.processedElements.has(entry.target)) {
          this.processImage(entry.target);
          this.state.processedElements.add(entry.target);
        }
      });
    }, {
      threshold: this.CONFIG.OBSERVER_THRESHOLD,
      rootMargin: '50px'
    });
  },

  processImage: function(img) {
    // Image is now visible - ready for any future processing
    // No animation applied
  },

  init: function() {
    const images = document.querySelectorAll(this.SELECTORS.IMAGES);
    
    if (images.length === 0) return;

    this.setupIntersectionObserver();

    if (this.state.observer) {
      images.forEach(img => {
        this.state.observer.observe(img);
      });
    }
  },

  destroy: function() {
    if (this.state.observer) {
      this.state.observer.disconnect();
    }
    this.state.processedElements.clear();
  }
};