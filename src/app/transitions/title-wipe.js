/**
 * Title Wipe Transition — Per-letter stagger.
 *
 * Leave (click → page-load):
 *   Each letter pops in at the right edge (right-anchored flex), with
 *   width 0 → natural pushing earlier letters left, plus inner scale
 *   0 → 1 + opacity 0 → 1. Easing: back.out(1.4) for a tiny overshoot.
 *
 * Hold (during page navigation):
 *   Whole title sits at the right viewport edge while window.location
 *   loads the new page. Pre-paint snippet in the next page's <head>
 *   re-paints this state synchronously so there's no flash.
 *
 * Enter (new page → reveal):
 *   Letters fall down one at a time (left → right stagger), then the
 *   overlay fades out.
 *
 * Reduced-motion: no per-letter animation; just a brief overlay fade.
 *
 * Title source: data.next.container.dataset.barbaTitle, fallback to
 *   namespace, fallback to URL last-segment.
 */
import { log, warn } from '../debug.js';

const OVERLAY_ID = 'wrgsmk-wipe';
const LETTER_CLASS = 'wrgsmk-wipe__letter';
const INNER_CLASS = 'wrgsmk-wipe__inner';

const STAGGER = 0.04;             // 40 ms between letters
const LETTER_DURATION = 0.166;    // per-letter scale/opacity/width
const LETTER_EASE = 'back.out(1.4)';
const OVERLAY_FADE_IN = 0.15;

const ENTER_HOLD = 0.1;
const FALL_DURATION = 0.4;
const FALL_EASE = 'power2.in';
const ENTER_OVERLAY_FADE = 0.3;

let overlay = null;

function ensureOverlay() {
  if (overlay && document.body.contains(overlay)) return;
  // Inline pre-paint snippet may have already inserted the overlay so
  // it's on screen from the very first frame, before this deferred
  // bundle loads. Adopt it instead of creating a duplicate.
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    overlay = existing;
    return;
  }
  overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  document.body.appendChild(overlay);
}

function setupLetters(title) {
  // Idempotent: skip rebuild when the existing letters already match.
  const existing = overlay.querySelectorAll('.' + LETTER_CLASS);
  if (existing.length === title.length) {
    let same = true;
    for (let i = 0; i < title.length; i++) {
      if (existing[i].textContent !== title[i]) { same = false; break; }
    }
    if (same) return;
  }
  overlay.innerHTML = '';
  for (const ch of title) {
    const wrap = document.createElement('span');
    wrap.className = LETTER_CLASS;
    const inner = document.createElement('span');
    inner.className = INNER_CLASS;
    inner.textContent = ch;
    wrap.appendChild(inner);
    overlay.appendChild(wrap);
  }
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getTitle(data) {
  const fromAttr = data?.next?.container?.dataset?.barbaTitle;
  if (fromAttr) return fromAttr;
  const ns = data?.next?.namespace;
  if (ns) return ns.toUpperCase();
  const path = (data?.next?.url?.path || '').replace(/\/+$/, '');
  const last = path.split('/').filter(Boolean).pop();
  if (last) return last.replace(/-/g, ' ').toUpperCase();
  return 'WUERGSAMKEITEN';
}

export const titleWipe = {
  name: 'title-wipe',

  leave(data) {
    ensureOverlay();
    const title = getTitle(data);
    setupLetters(title);

    log(`title-wipe: leave (title="${title}", letters=${title.length})`);

    if (typeof gsap === 'undefined') {
      warn('title-wipe: gsap undefined, skipping');
      return Promise.resolve();
    }

    if (prefersReducedMotion()) {
      return gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    }

    const letterEls = [...overlay.querySelectorAll('.' + LETTER_CLASS)];
    const innerEls = [...overlay.querySelectorAll('.' + INNER_CLASS)];

    // Force a clean baseline so getBoundingClientRect reads natural widths
    // even when the snippet just painted with default CSS.
    for (const el of letterEls) gsap.set(el, { clearProps: 'width' });
    for (const el of innerEls) gsap.set(el, { clearProps: 'transform,opacity' });
    void overlay.offsetWidth;
    const widths = letterEls.map((el) => el.getBoundingClientRect().width);

    // Collapse to start state.
    for (let i = 0; i < letterEls.length; i++) {
      gsap.set(letterEls[i], { width: 0 });
      gsap.set(innerEls[i], {
        scale: 0,
        opacity: 0,
        transformOrigin: 'right center',
      });
    }

    const tl = gsap.timeline();

    tl.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: OVERLAY_FADE_IN, ease: 'power1.out' },
      0);

    for (let i = 0; i < letterEls.length; i++) {
      const start = i * STAGGER;
      tl.to(letterEls[i], {
        width: widths[i],
        duration: LETTER_DURATION,
        ease: LETTER_EASE,
      }, start);
      tl.to(innerEls[i], {
        scale: 1,
        opacity: 1,
        duration: LETTER_DURATION,
        ease: LETTER_EASE,
      }, start);
    }

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

    if (!overlay) return Promise.resolve();
    const innerEls = [...overlay.querySelectorAll('.' + INNER_CLASS)];
    const nextContainer = data?.next?.container;

    const tl = gsap.timeline();

    tl.to({}, { duration: ENTER_HOLD }, 0);

    if (nextContainer && nextContainer.nodeType) {
      tl.fromTo(nextContainer,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: 'power1.out' },
        ENTER_HOLD);
    }

    // Letters fall straight down, left-to-right stagger.
    const fallStart = ENTER_HOLD + 0.15;
    for (let i = 0; i < innerEls.length; i++) {
      tl.to(innerEls[i], {
        y: '110svh',
        opacity: 0,
        duration: FALL_DURATION,
        ease: FALL_EASE,
      }, fallStart + i * STAGGER);
    }

    // Overlay starts fading once the last letter is well on its way.
    const lastLetterStart = fallStart + (innerEls.length - 1) * STAGGER;
    tl.to(overlay, {
      opacity: 0,
      duration: ENTER_OVERLAY_FADE,
      ease: 'power1.out',
    }, lastLetterStart + 0.2);

    tl.call(() => {
      // Clear letters so the next leave() builds fresh elements with
      // fresh natural-width measurements.
      overlay.innerHTML = '';
      gsap.set(overlay, { clearProps: 'opacity' });
      if (nextContainer && nextContainer.nodeType) {
        gsap.set(nextContainer, { clearProps: 'opacity' });
      }
    });

    return tl;
  },
};
