/**
 * Title Wipe Transition
 *
 * A giant title (100svh tall) slides right-to-left across the viewport,
 * acting as a moving curtain that hides the page swap happening behind it.
 *
 * Phase 1 (leave, 0.55s, power2.in): text enters from right, slides until
 *   its left edge reaches viewport left — viewport is fully covered.
 *   Ends at peak speed so Phase 2 picks up seamlessly. Barba swaps the
 *   container here (invisible behind the title).
 * Phase 2 (enter, 0.75s, power2.out): text continues sliding left, exiting
 *   viewport. Starts at peak speed, decelerates. The new page's container
 *   fades in during the last ~40% for a softer reveal.
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

// Tuned for continuous motion: leave ends at peak speed, enter starts at
// peak speed → no micro-pause at the cover moment.
const LEAVE_DURATION = 0.55;
const ENTER_DURATION = 0.75;
const LEAVE_EASE = 'power2.in';
const ENTER_EASE = 'power2.out';

// Fraction of the enter duration during which the incoming container fades.
// 0.5 = fade runs in the second half. Higher = later/shorter fade.
const CONTENT_FADE_START = 0.5;
const CONTENT_FADE_DURATION = ENTER_DURATION * (1 - CONTENT_FADE_START);

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
      ease: LEAVE_EASE,
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

    // New page container fades in during the tail of the slide for a softer
    // reveal than a hard cut. Safe if container is missing.
    const nextContainer = data?.next?.container;
    if (nextContainer) {
      gsap.set(nextContainer, { opacity: 0 });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { opacity: 0 });
        gsap.set(textEl, { x: '100vw' });
        if (nextContainer) gsap.set(nextContainer, { opacity: 1, clearProps: 'opacity' });
      },
    });

    tl.to(textEl, {
      x: -textWidth,
      duration: ENTER_DURATION,
      ease: ENTER_EASE,
    }, 0);

    if (nextContainer) {
      tl.to(nextContainer, {
        opacity: 1,
        duration: CONTENT_FADE_DURATION,
        ease: 'power1.out',
      }, ENTER_DURATION * CONTENT_FADE_START);
    }

    return tl;
  },
};
