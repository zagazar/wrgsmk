/**
 * WRGSMK Preloader Module
 * Standalone preloader functionality
 */

window.WRGSMK_PRELOADER = {
  
  SELECTORS: {
    PRELOADER: '.wrgsmk-preloader',
    PRELOADER_BG: '.preloader-bg',
    PRELOADER_GIF: '.preloader-gif'
  },

  CONFIG: {
    DELAY: 500,
    BG_DURATION: 1,
    GIF_DURATION: 0.5
  },

  init: function() {
    return new Promise((resolve) => {
      const preloader = document.querySelector(this.SELECTORS.PRELOADER);
      const preloaderBg = document.querySelector(this.SELECTORS.PRELOADER_BG);
      const preloaderGif = document.querySelector(this.SELECTORS.PRELOADER_GIF);
      const body = document.body;

      if (!preloader) {
        resolve();
        return;
      }

      body.classList.add('no-scroll');
      if (preloaderBg) gsap.set(preloaderBg, { mixBlendMode: "normal" });

      const handleLoad = () => {
        setTimeout(() => {
          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set(preloader, { display: 'none' });
              body.classList.remove('no-scroll');
              window.scrollTo(0, 0);
              window.dispatchEvent(new CustomEvent('wrgsmkPreloaderComplete'));
              resolve();
            }
          });

          if (preloaderBg) {
            tl.to(preloaderBg, {
              scale: 0,
              marginTop: '-100%',
              duration: this.CONFIG.BG_DURATION,
              ease: 'naturalInOut'
            }, 0);
          }

          if (preloaderGif) {
            tl.to(preloaderGif, {
              scale: 0,
              y: -100,
              duration: this.CONFIG.GIF_DURATION,
              ease: 'power3.in'
            }, 0);
          }
        }, this.CONFIG.DELAY);
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad, { once: true });
      }

      window.addEventListener('beforeunload', () => {
        body.classList.remove('no-scroll');
      });
    });
  }
};