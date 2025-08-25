/**
 * WRGSMK Core JavaScript Framework
 * Modulare Basis für alle Webflow-Seiten
 * Version: 2.1
 */

// ===== CORE CONFIGURATION =====
const WRGSMK_CONFIG = {
  // Custom Easings
  CUSTOM_EASINGS: {
    power1InOut: "M0,0 C0.19,0.03 0.32,0.27 0.5,0.5 0.68,0.73 0.83,0.96 1,1",
    lightFall: "M0,0 C0.2,0 0.3,0.3 0.5,0.6 0.7,0.9 0.8,1.0 1.0,1.0",
    hover266: "M0,0 C0.83,0 0.17,1 1,1"
  },

  SCROLL_SMOOTH: {
    SMOOTH: 0.466,
    TOUCH: 0.05
  }
};

// ===== CORE STATE MANAGEMENT =====
const WRGSMK_STATE = {
  isInitialized: false,
  eventListeners: [],
  smoother: null,
  hasScrolled: false,
  domCache: {}
};

// ===== UTILITY FUNCTIONS =====
const WRGSMK_UTILS = {
  getElement: (selector, useCache = true) => {
    if (useCache && WRGSMK_STATE.domCache[selector]) {
      return WRGSMK_STATE.domCache[selector];
    }
    const element = document.querySelector(selector);
    if (useCache) WRGSMK_STATE.domCache[selector] = element;
    return element;
  },

  getElements: (selector, useCache = true) => {
    if (useCache && WRGSMK_STATE.domCache[selector]) {
      return WRGSMK_STATE.domCache[selector];
    }
    const elements = document.querySelectorAll(selector);
    if (useCache) WRGSMK_STATE.domCache[selector] = elements;
    return elements;
  },

  addManagedEventListener: (element, event, handler, options = {}) => {
    if (!element) return;
    
    element.addEventListener(event, handler, options);
    WRGSMK_STATE.eventListeners.push({ element, event, handler, options });
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// ===== CORE MODULES =====
const WRGSMK_CORE = {
  
  setupGSAP: () => {
    try {
      if (typeof gsap === 'undefined') {
        return false;
      }

      gsap.registerPlugin(ScrollTrigger, ScrollSmoother, CustomEase);
      
      Object.entries(WRGSMK_CONFIG.CUSTOM_EASINGS).forEach(([name, curve]) => {
        CustomEase.create(name, curve);
      });

      return true;
    } catch (error) {
      console.error('GSAP setup failed:', error);
      return false;
    }
  },

  initScrollSmoother: () => {
    try {
      WRGSMK_STATE.smoother = ScrollSmoother.create({
        smooth: WRGSMK_CONFIG.SCROLL_SMOOTH.SMOOTH,
        effects: true,
        smoothTouch: WRGSMK_CONFIG.SCROLL_SMOOTH.TOUCH,
        normalizeScroll: true,
        ignoreMobileResize: true
      });
      return true;
    } catch (error) {
      console.error('ScrollSmoother initialization failed:', error);
      return false;
    }
  },

  setupCoreEventListeners: () => {
    WRGSMK_UTILS.addManagedEventListener(window, 'beforeunload', WRGSMK_CORE.cleanup);
    
    WRGSMK_UTILS.addManagedEventListener(document, 'visibilitychange', () => {
      if (document.hidden) {
        gsap.globalTimeline.pause();
      } else {
        gsap.globalTimeline.resume();
      }
    });
  },

  cleanup: () => {
    try {
      if (WRGSMK_STATE.smoother && typeof WRGSMK_STATE.smoother.kill === 'function') {
        WRGSMK_STATE.smoother.kill();
      }

      WRGSMK_STATE.eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      WRGSMK_STATE.eventListeners = [];

      Object.keys(WRGSMK_STATE.domCache).forEach(key => delete WRGSMK_STATE.domCache[key]);

      document.body.classList.remove('no-scroll');

      // Cleanup Module Components
      if (window.WRGSMK_HORIZONTAL_SCROLL) {
        window.WRGSMK_HORIZONTAL_SCROLL.destroy();
      }
      if (window.WRGSMK_IMG_GRID) {
        window.WRGSMK_IMG_GRID.destroy();
      }
      if (window.WRGSMK_FANCY_VERT) {
        window.WRGSMK_FANCY_VERT.destroy();
      }
      if (window.WRGSMK_MOUSE_FOLLOWER) {
        window.WRGSMK_MOUSE_FOLLOWER.destroy();
      }

    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
};

// ===== MAIN INITIALIZATION FUNCTION =====
window.WRGSMK_INIT = async function(pageConfig = {}) {
  if (WRGSMK_STATE.isInitialized) return;

  try {
    const gsapReady = WRGSMK_CORE.setupGSAP();
    if (!gsapReady) {
      throw new Error('GSAP initialization failed');
    }

    const SELECTORS = { ...pageConfig.selectors };

    // Initialize Preloader
    if (window.WRGSMK_PRELOADER) {
      await window.WRGSMK_PRELOADER.init();
    }

    // Initialize ScrollSmoother
    WRGSMK_CORE.initScrollSmoother();

    // Initialize Module Components
    if (window.WRGSMK_HORIZONTAL_SCROLL) {
      window.WRGSMK_HORIZONTAL_SCROLL.init();
    }
    if (window.WRGSMK_IMG_GRID) {
      window.WRGSMK_IMG_GRID.init();
    }
    if (window.WRGSMK_FANCY_VERT) {
      window.WRGSMK_FANCY_VERT.init();
    }
    if (window.WRGSMK_MOUSE_FOLLOWER) {
      window.WRGSMK_MOUSE_FOLLOWER.init();
    }

    WRGSMK_CORE.setupCoreEventListeners();

    if (pageConfig.init && typeof pageConfig.init === 'function') {
      pageConfig.init(SELECTORS, WRGSMK_CORE, WRGSMK_UTILS, WRGSMK_STATE);
    }

    WRGSMK_STATE.isInitialized = true;
    
    window.dispatchEvent(new CustomEvent('wrgsmkReady', {
      detail: { 
        timestamp: Date.now(),
        version: '2.1',
        page: pageConfig.pageName || 'unknown'
      }
    }));

  } catch (error) {
    console.error('WRGSMK initialization failed:', error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (!window.WRGSMK_PAGE_CONFIG) {
    window.WRGSMK_INIT();
  }
});

window.WRGSMK = {
  CORE: WRGSMK_CORE,
  UTILS: WRGSMK_UTILS,
  STATE: WRGSMK_STATE,
  CONFIG: WRGSMK_CONFIG,
  INIT: window.WRGSMK_INIT
};
