/**
 * Title Wipe Transition
 *
 * A giant title (100svh tall) slides right-to-left across the viewport,
 * acting as a moving curtain that hides the page swap happening behind it.
 *
 * Phase 1 (leave): text enters from right, slides until its left edge
 *   reaches viewport left — viewport is fully covered by the title.
 *   Barba swaps the container here (invisible behind the title).
 * Phase 2 (enter): text continues sliding left, exiting viewport.
 *   New page is revealed behind the trailing edge.
 *
 * Title source: data.next.container.dataset.barbaTitle
 * Fallback:    data.next.namespace.toUpperCase()
 *
 * Reduced-motion: skip slide, just hold a short fade.
 *
 * Expects global: gsap
 */
import { log, warn } from '../debug.js';

const OVERLAY_ID = 'wrgsmk-wipe';
const TEXT_CLASS = 'wrgsmk-wipe__text';

let overlay = null;
let textEl = null;

function ensureOverlay() {
  if (overlay && document.body.contains(overlay)) return;

  overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  textEl = document.createElement('span');
  // Piggy-back on the Webflow class so color/weight/font-family match the
  // Auftragsarbeiten title style. Our own class overrides font-size +
  // neutralizes the hover transition for the full-viewport wipe.
  textEl.className = `wrgsmk-comission_title ${TEXT_CLASS}`;

  overlay.appendChild(textEl);
  document.body.appendChild(overlay);
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getTitle(data) {
  const fromAttr = data?.next?.container?.dataset?.barbaTitle;
  if (fromAttr) return fromAttr;
  const ns = data?.next?.namespace;
  return ns ? ns.toUpperCase() : '';
}

const LEAVE_DURATION = 0.7;
const ENTER_DURATION = 0.9;
const EASE = 'power3.inOut';

export const titleWipe = {
  name: 'title-wipe',
  sync: false,

  leave(data) {
    ensureOverlay();
    const title = getTitle(data);
    textEl.textContent = title;
    log(`title-wipe: leave (title="${title}")`);

    if (typeof gsap === 'undefined') {
      warn('title-wipe: gsap undefined, skipping');
      return Promise.resolve();
    }

    if (prefersReducedMotion()) {
      log('title-wipe: prefers-reduced-motion → fade');
      return gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    }

    // Start off-screen right. Position the overlay so its LEFT edge sits at
    // viewport right (x = 100vw). Animate until the text's left edge hits
    // viewport left (x = 0) — at that moment the viewport is fully covered.
    gsap.set(overlay, { opacity: 1 });
    gsap.set(textEl, { x: '100vw' });

    return gsap.to(textEl, {
      x: 0,
      duration: LEAVE_DURATION,
      ease: EASE,
    });
  },

  enter(data) {
    log(`title-wipe: enter (${data?.next?.namespace})`);
    if (typeof gsap === 'undefined') {
      if (overlay) overlay.style.opacity = '0';
      return Promise.resolve();
    }

    if (prefersReducedMotion()) {
      return gsap.to(overlay, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => { gsap.set(overlay, { opacity: 0 }); },
      });
    }

    // Continue the slide: text keeps moving left until it fully exits the
    // viewport (right edge past viewport left = x equals -textWidth).
    const textWidth = textEl.getBoundingClientRect().width;

    return gsap.to(textEl, {
      x: -textWidth,
      duration: ENTER_DURATION,
      ease: EASE,
      onComplete: () => {
        gsap.set(overlay, { opacity: 0 });
        gsap.set(textEl, { x: '100vw' });
      },
    });
  },
};
