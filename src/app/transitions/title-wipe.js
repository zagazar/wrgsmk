/**
 * Title Wipe Transition — Center-Hold Pattern
 *
 * A giant title (100svh tall) slides in from the right, HOLDS centered
 * while the page swap and module re-init finish behind the overlay, then
 * slides out to the left as the overlay fades away.
 *
 * Phase 1 — Leave (~0.5s, power2.out):
 *   Text enters from right, decelerates onto a centered resting position
 *   (middle of text aligned with viewport center).
 *   Overlay BG fades in quickly at the start.
 *   Returns when the text is centered.
 *
 * Phase 2 — Cover / Hold (natural duration):
 *   Barba swaps the DOM container. barba-controller runs beforeEnter:
 *   resetScroll → reinitWebflow → runInit → ScrollTrigger.refresh.
 *   Everything happens invisibly behind the opaque overlay.
 *
 * Phase 3 — Enter (~1.0s):
 *   Content fade 0 → 1 (first 200ms, invisible behind overlay).
 *   Text slides from centered → off-screen left (power2.in).
 *   Overlay fades out during the latter half of the slide, revealing the
 *   already-settled new page.
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

// Returns the x offset needed so the text's horizontal midpoint sits at
// the viewport's horizontal midpoint. Negative if text is wider than vp
// (normal for this huge font-size).
function getCenteredX(width) {
  return (window.innerWidth - width) / 2;
}

const LEAVE_DURATION = 0.5;

// Small safety buffer at start of enter(). beforeEnter already holds for
// ~250ms with two ScrollTrigger.refresh passes; this just covers the
// handoff between the async hook and the first animation tick.
const ENTER_HOLD = 0.1;

const ENTER_CONTENT_FADE = 0.15;
const ENTER_SLIDE_DURATION = 0.8;

// Overlay fade-out begins AFTER the text has fully exited — the page swap
// is guaranteed already settled when the white BG starts disappearing.
// Negative offset is relative to slide end: 0 = exact slide end.
const OVERLAY_FADE_AFTER_SLIDE = -0.05;  // tiny overlap so it doesn't feel stuck
const ENTER_OVERLAY_FADE = 0.35;

const OVERLAY_FADE_IN = 0.15;

export const titleWipe = {
  name: 'title-wipe',
  sync: false,

  leave(data) {
    ensureOverlay();
    const title = getTitle(data);
    textEl.textContent = title;

    // Force a reflow so offsetWidth reads the new text's layout.
    // eslint-disable-next-line no-unused-expressions
    textEl.offsetWidth;

    const textWidth = textEl.getBoundingClientRect().width;
    const centerX = getCenteredX(textWidth);

    log(`title-wipe: leave (title="${title}", width=${Math.round(textWidth)}px, centerX=${Math.round(centerX)}px)`);

    if (typeof gsap === 'undefined') {
      warn('title-wipe: gsap undefined, skipping');
      return Promise.resolve();
    }

    if (prefersReducedMotion()) {
      log('title-wipe: prefers-reduced-motion → fade');
      return gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    }

    const tl = gsap.timeline();

    // Overlay BG fades in at the start (shorter than the slide).
    tl.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: OVERLAY_FADE_IN, ease: 'power1.out' },
      0);

    // Text slides in from off-screen right, decelerates onto center.
    tl.fromTo(textEl,
      { x: '100vw' },
      { x: centerX, duration: LEAVE_DURATION, ease: 'power2.out' },
      0);

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

    // HOLD: extra buffer before anything starts animating. Overlay stays
    // opaque and text stays centered during this window — any late IX2 /
    // layout work finishes fully covered.
    tl.to({}, { duration: ENTER_HOLD }, 0);

    const contentStart = ENTER_HOLD;
    const slideStart = contentStart + ENTER_CONTENT_FADE;
    const slideEnd = slideStart + ENTER_SLIDE_DURATION;
    const overlayStart = slideEnd + OVERLAY_FADE_AFTER_SLIDE;

    // Content fades 0 → 1 (invisible behind opaque overlay, but animated
    // so the new page is guaranteed at opacity 1 before the reveal).
    if (nextContainer) {
      tl.fromTo(nextContainer,
        { opacity: 0 },
        { opacity: 1, duration: ENTER_CONTENT_FADE, ease: 'power1.out' },
        contentStart);
    }

    // Text slides off-screen left.
    tl.to(textEl, {
      x: -textWidth,
      duration: ENTER_SLIDE_DURATION,
      ease: 'power2.in',
    }, slideStart);

    // Overlay fade-out only begins when the text is ~80% through its
    // slide — by then the swap is old news and the reveal feels like
    // the curtain catching up with the already-gone title.
    tl.to(overlay, {
      opacity: 0,
      duration: ENTER_OVERLAY_FADE,
      ease: 'power1.out',
    }, overlayStart);

    // Reset text off-screen and clear inline container opacity.
    tl.call(() => {
      gsap.set(textEl, { x: '100vw' });
      if (nextContainer) gsap.set(nextContainer, { clearProps: 'opacity' });
    });

    return tl;
  },
};
