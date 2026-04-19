/**
 * Barba Controller — wires page transitions, views, and global hooks.
 *
 * - Per-namespace modules (init/destroy) dispatched via a registry.
 * - Global hooks handle ScrollTrigger cleanup, scroll reset, Webflow/IX2 reinit.
 * - Transitions are empty in Phase 2. Title-wipe is added in Phase 3.
 */
import barba from '@barba/core';

import * as homeModule from '../pages/home/index.js';
import * as illustrationModule from '../pages/illustration/index.js';
import * as shopModule from '../pages/shop/index.js';
import * as photographyModule from '../pages/photography/index.js';
import * as auftragsarbeitenModule from '../pages/auftragsarbeiten/index.js';
import * as commissionDetailModule from '../pages/commission-detail/index.js';

import { titleWipe } from './transitions/title-wipe.js';
import { injectWipeStyles } from './transitions/title-wipe.css.js';

const modules = {
  home: homeModule,
  illustration: illustrationModule,
  shop: shopModule,
  photography: photographyModule,
  auftragsarbeiten: auftragsarbeitenModule,
  // Commission subpages all share the same pinned-image + scroll-swap behavior.
  luvcat: commissionDetailModule,
  'kdk-festival-design': commissionDetailModule,
  'grey-men': commissionDetailModule,
  'plakate-drucksachen': commissionDetailModule,
  fotoshoots: commissionDetailModule,
  eventfotografie: commissionDetailModule,
  'cover-art': commissionDetailModule,
  produktinszenierung: commissionDetailModule,
};

function runInit(namespace) {
  const m = modules[namespace];
  if (m && typeof m.init === 'function') m.init();
}

function runDestroy(namespace) {
  const m = modules[namespace];
  if (m && typeof m.destroy === 'function') m.destroy();
}

function killAllScrollTriggers() {
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach((st) => st.kill());
  }
}

function resetScroll() {
  window.scrollTo(0, 0);
  if (window.wrgsmkLenis && typeof window.wrgsmkLenis.scrollTo === 'function') {
    window.wrgsmkLenis.scrollTo(0, { immediate: true });
  }
}

function reinitWebflow() {
  const wf = window.Webflow;
  if (!wf) return;
  try {
    if (typeof wf.destroy === 'function') wf.destroy();
    if (typeof wf.ready === 'function') wf.ready();
    const ix2 = typeof wf.require === 'function' ? wf.require('ix2') : null;
    if (ix2 && typeof ix2.init === 'function') ix2.init();
  } catch (e) {
    console.warn('[WRGSMK] Webflow reinit failed:', e);
  }
}

export function initBarba() {
  if (typeof window === 'undefined') return;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Ensure <body> is the Barba wrapper without per-page Webflow config.
  if (!document.body.hasAttribute('data-barba')) {
    document.body.setAttribute('data-barba', 'wrapper');
  }

  injectWipeStyles();

  barba.hooks.once((data) => {
    runInit(data.next.namespace);
  });

  barba.hooks.beforeLeave((data) => {
    runDestroy(data.current.namespace);
    killAllScrollTriggers();
  });

  barba.hooks.beforeEnter(() => {
    resetScroll();
    reinitWebflow();
  });

  barba.hooks.afterEnter((data) => {
    runInit(data.next.namespace);
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

  barba.init({
    debug: false,
    timeout: 5000,
    // Barba only handles navigation to pages that carry a Barba container.
    // Until every Webflow page template has been tagged, we keep a allowlist
    // of paths that are known-tagged; any other target falls through to a
    // native full-page navigation (and hash links stay native too).
    prevent: ({ el }) => {
      if (!el) return false;
      const href = el.getAttribute('href');
      if (!href) return false;
      if (href.startsWith('#')) return true;
      try {
        const url = new URL(href, window.location.origin);
        const path = url.pathname.replace(/\/$/, '') || '/';
        return !TAGGED_PATHS.has(path);
      } catch {
        return false;
      }
    },
    transitions: [titleWipe],
    views: [],
  });
}

// Keep in sync with the pages that have data-barba="container" in Webflow.
// Remove this allowlist entirely once every page template is tagged.
const TAGGED_PATHS = new Set([
  '/',
  '/commissional-work',
  '/auftragsarbeiten/luvcat',
  '/auftragsarbeiten/kdk-festival-design',
  '/auftragsarbeiten/grey-men',
  '/auftragsarbeiten/plakate-drucksachen',
  '/auftragsarbeiten/fotoshoots',
  '/auftragsarbeiten/eventfotografie',
  '/auftragsarbeiten/cover-art',
  '/auftragsarbeiten/produktinszenierung',
]);
