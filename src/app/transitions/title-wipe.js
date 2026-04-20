/**
 * Title Wipe Transition
 *
 * A giant title (100svh tall) slides right-to-left across the viewport,
 * acting as a moving curtain that hides the page swap happening behind it.
 *
 * Phase 1 (leave, 0.55s, power2.in): overlay fades in quickly while the
 *   text enters from right. Slide ends at peak speed (left edge = viewport
 *   left) so Phase 2 picks up seamlessly. Barba swaps the container here
 *   (invisible behind the title).
 * Phase 2 (enter, 0.75s, power2.out): text continues sliding left, exiting
 *   viewport. Starts at peak speed, decelerates. The new container fades in
 *   during the tail, overlay fades out at the very end — all tweened.
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

// Overlay fade-in/out durations (short, so the reveal/cover feels snappy).
const OVERLAY_FADE_IN = 0.15;
const OVERLAY_FADE_OUT = 0.25;

// Fraction of the enter duration during which the incoming container fades.
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

    // Slide text back off-screen right regardless of where a prior run left
    // it, and start the overlay from a known invisible state so the fade-in
    // is a real tween (not a hard set).
    const tl = gsap.timeline();

    tl.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: OVERLAY_FADE_IN, ease: 'power1.out' }, 0);

    tl.fromTo(textEl,
      { x: '100vw' },
      { x: 0, duration: LEAVE_DURATION, ease: LEAVE_EASE }, 0);

    return tl;
  },

  enter(data) {
    log(`title-wipe: enter (${data?.next?.namespace})`);
    if (typeof gsap === 'undefined') {
      if (overlay) overlay.style.opacity = '0';
      return Promise.resolve();
    }

    if (prefersReducedMotion()) {
      return gsap.to(overlay, { opacity: 0, duration: 0.2 });
    }

    const textWidth = textEl.getBoundingClientRect().width;
    const nextContainer = data?.next?.container;

    const tl = gsap.timeline();

    // Text slides off to the left (continues the leave-phase motion).
    tl.to(textEl, {
      x: -textWidth,
      duration: ENTER_DURATION,
      ease: ENTER_EASE,
    }, 0);

    // Incoming page fades in during the tail of the slide.
    if (nextContainer) {
      tl.fromTo(nextContainer,
        { opacity: 0 },
        { opacity: 1, duration: CONTENT_FADE_DURATION, ease: 'power1.out' },
        ENTER_DURATION * CONTENT_FADE_START);
    }

    // Overlay fades out at the very end so the reveal is a real tween
    // instead of a hard set.
    tl.to(overlay, {
      opacity: 0,
      duration: OVERLAY_FADE_OUT,
      ease: 'power1.out',
    }, ENTER_DURATION - OVERLAY_FADE_OUT);

    // Reset text off-screen for the next run without animating it.
    tl.call(() => {
      gsap.set(textEl, { x: '100vw' });
      if (nextContainer) gsap.set(nextContainer, { clearProps: 'opacity' });
    });

    return tl;
  },
};
