/**
 * Barba Controller — wires page transitions, views, and global hooks.
 *
 * - Per-namespace modules (init/destroy) dispatched via a registry.
 * - Global hooks handle ScrollTrigger cleanup, scroll reset, Webflow/IX2 reinit.
 * - Transitions are empty in Phase 2. Title-wipe is added in Phase 3.
 *
 * Debug mode: activate with ?debug=1, localStorage 'wrgsmk-debug', or
 * window.WRGSMK_DEBUG=true. See src/app/debug.js for details.
 */
import barba from '@barba/core';

import * as homeModule from '../pages/home/index.js';
import * as illustrationModule from '../pages/illustration/index.js';
import * as shopModule from '../pages/shop/index.js';
import * as photographyModule from '../pages/photography/index.js';
import * as auftragsarbeitenModule from '../pages/auftragsarbeiten/index.js';
import * as commissionDetailModule from '../pages/commission-detail/index.js';

// Pages without bespoke per-page scripts (e.g. About, Animation) share this
// no-op namespace module so the registry lookup succeeds cleanly and
// barba-controller doesn't warn about a missing module.
const passthroughModule = { init() {}, destroy() {} };

import { titleWipe } from './transitions/title-wipe.js';
import { injectWipeStyles } from './transitions/title-wipe.css.js';
import { isDebug, log, warn, group, groupEnd, time, timeEnd } from './debug.js';
import { refreshParallax } from '../core/parallax.js';

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
  about: passthroughModule,
  animation: passthroughModule,
};

function runInit(namespace) {
  const m = modules[namespace];
  if (!m) {
    warn(`no module registered for namespace "${namespace}"`);
    return;
  }
  if (typeof m.init !== 'function') {
    warn(`module "${namespace}" has no init()`);
    return;
  }
  log(`init() → ${namespace}`);
  try {
    time(`init(${namespace})`);
    m.init();
    timeEnd(`init(${namespace})`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[WRGSMK:barba] init failed for', namespace, e);
  }
}

function runDestroy(namespace) {
  const m = modules[namespace];
  if (!m) {
    warn(`no module registered for namespace "${namespace}" (destroy)`);
    return;
  }
  if (typeof m.destroy !== 'function') {
    log(`module "${namespace}" has no destroy() — skipping`);
    return;
  }
  log(`destroy() → ${namespace}`);
  try {
    m.destroy();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[WRGSMK:barba] destroy failed for', namespace, e);
  }
}

function killAllScrollTriggers() {
  if (typeof ScrollTrigger !== 'undefined') {
    const count = ScrollTrigger.getAll().length;
    if (count) log(`killing ${count} ScrollTrigger(s)`);
    ScrollTrigger.getAll().forEach((st) => st.kill());
  }
}

function resetScroll() {
  log('resetScroll()');
  window.scrollTo(0, 0);
  if (window.wrgsmkLenis && typeof window.wrgsmkLenis.scrollTo === 'function') {
    window.wrgsmkLenis.scrollTo(0, { immediate: true });
  }
}

// Webflow stores per-page interaction IDs on <html data-wf-page="...">.
// During SPA nav only the barba container swaps, so <html> still carries
// the OLD page's ID and IX2 would re-bind the wrong interactions. Copy
// the new ID in from the fetched document before re-init.
function syncWebflowPageId(data) {
  try {
    const html = data?.next?.html;
    if (!html) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const incomingId = doc.documentElement.getAttribute('data-wf-page');
    if (!incomingId) {
      warn('no data-wf-page on incoming document');
      return;
    }
    const currentId = document.documentElement.getAttribute('data-wf-page');
    if (incomingId !== currentId) {
      document.documentElement.setAttribute('data-wf-page', incomingId);
      log(`data-wf-page: ${currentId} → ${incomingId}`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[WRGSMK:barba] syncWebflowPageId failed:', e);
  }
}

// Sync the page's script tags to whatever the next page actually needs.
//
// Webflow compiles page-specific IX bundles (`webflow.schunk.<hash>.js`)
// and lets users add per-page Custom Code (e.g. CircleType in <head> of
// the home page only). Barba never swaps <head>, and `<script>` tags
// inserted via innerHTML aren't executed by the browser — so any script
// that the next page expects but the current entry page never loaded
// stays missing, taking with it `window.CircleType`, the new page's IX
// compile output, etc.
//
// Strategy: parse `data.next.html`, diff the script-src list against
// what's currently in the DOM, and inject any missing scripts via
// createElement so the browser actually executes them. Then destroy +
// ready Webflow's runtime so the freshly-loaded schunks register their
// IX setup callbacks against the swapped-in container.
//
// We deliberately do NOT remove old page-specific scripts — they're
// inert once their setup is unbound, and removing them risks tripping
// modules that hold internal references.
const WEBFLOW_SCRIPT_RE = /webflow.*\.js/i;

async function syncPageScripts(data) {
  const html = data?.next?.html;
  if (!html) {
    warn('no data.next.html — skipping script sync');
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const expected = [...doc.querySelectorAll('script[src]')]
    .map((s) => s.src)
    .filter(Boolean);
  const currentSrcs = new Set(
    [...document.querySelectorAll('script[src]')].map((s) => s.src),
  );

  const missing = expected.filter((src) => !currentSrcs.has(src));
  // Per-page Webflow Head Custom Code can be inline (e.g. Webflow.push(...),
  // GSAP plugin registration, schema.org JSON-LD). Barba never swaps <head>,
  // so these never run on the second page. Re-fire any inline <script> from
  // the next page's <head> — Webflow.push and friends are idempotent, and a
  // duplicate JSON-LD or font loader is harmless. Preserve `type` so a
  // JSON-LD `<script type="application/ld+json">` doesn't get evaluated as
  // JavaScript on insertion.
  const newHeadInline = [...doc.head.querySelectorAll('script:not([src])')]
    .map((s) => ({ type: s.getAttribute('type') || '', code: s.textContent || '' }))
    .filter((s) => s.code.trim());
  log(`script sync: ${missing.length} missing src + ${newHeadInline.length} inline head script(s)`);

  // Tear down old Webflow bindings before adding fresh schunks; otherwise
  // the new schunks' `Webflow.push(...)` callbacks may collide with stale
  // state on `Webflow.ready()`.
  try {
    if (window.Webflow && typeof window.Webflow.destroy === 'function') {
      window.Webflow.destroy();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[WRGSMK:barba] Webflow.destroy() threw:', e);
  }

  await Promise.all(missing.map((src) => new Promise((resolve) => {
    const fresh = document.createElement('script');
    fresh.src = src;
    fresh.async = false;
    fresh.onload = resolve;
    fresh.onerror = resolve;
    // Webflow scripts go to <body> to match where Webflow itself emits
    // them; everything else (CircleType, page Custom Code) goes to <head>
    // since that's where Webflow's per-page Head Code lives.
    const target = WEBFLOW_SCRIPT_RE.test(src) ? document.body : document.head;
    target.appendChild(fresh);
  })));

  for (const { type, code } of newHeadInline) {
    const fresh = document.createElement('script');
    if (type) fresh.type = type;
    fresh.textContent = code;
    document.head.appendChild(fresh);
  }

  // Re-fire the Webflow ready queue so freshly-loaded schunks' setup
  // callbacks bind their IX2 / IX3 interactions to the new container.
  try {
    if (window.Webflow && typeof window.Webflow.ready === 'function') {
      window.Webflow.ready();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[WRGSMK:barba] Webflow.ready() threw:', e);
  }
  try {
    const ix2 = window.Webflow?.require?.('ix2');
    if (ix2 && typeof ix2.init === 'function') ix2.init();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[WRGSMK:barba] ix2.init() threw:', e);
  }
  try {
    const ix3 = window.Webflow?.require?.('ix3');
    // Destroy old IX3 bindings BEFORE re-binding. Without destroy(), ready()
    // is a no-op for already-bound interaction IDs and the new container's
    // data-w-id elements never get hover/scroll-reveal handlers attached
    // (visible as: hovers do nothing, IX3 scroll reveals stuck at start).
    if (ix3 && typeof ix3.destroy === 'function') ix3.destroy();
    if (ix3 && typeof ix3.ready === 'function') ix3.ready();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[WRGSMK:barba] ix3 rebind threw:', e);
  }

  log('Webflow rebind complete');
}

export function initBarba() {
  if (typeof window === 'undefined') return;

  const debug = isDebug();

  if (debug) {
    log('debug mode ENABLED');
    log('registered namespaces:', Object.keys(modules));
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Ensure <body> is the Barba wrapper without per-page Webflow config.
  if (!document.body.hasAttribute('data-barba')) {
    document.body.setAttribute('data-barba', 'wrapper');
    log('added data-barba="wrapper" to <body>');
  }

  injectWipeStyles();

  barba.hooks.once((data) => {
    group(`once → ${data.next.namespace}`);
    log('container:', data.next.container);
    log('url:', data.next.url);
    runInit(data.next.namespace);
    groupEnd();
  });

  barba.hooks.beforeLeave((data) => {
    group(`beforeLeave: ${data.current.namespace} → ${data.next.namespace}`);
    log('from:', data.current.url);
    log('to:', data.next.url);
    runDestroy(data.current.namespace);
    killAllScrollTriggers();
    groupEnd();
  });

  barba.hooks.leave(() => {
    log('leave (transition start)');
  });

  barba.hooks.beforeEnter(async (data) => {
    group(`beforeEnter → ${data.next.namespace}`);
    // Hide the OLD container immediately. Barba keeps it in the DOM until
    // after afterEnter, so without this it would flash through as soon as
    // the overlay begins fading. Overlay is still fully opaque here.
    if (data.current && data.current.container) {
      data.current.container.style.display = 'none';
      log('hid previous container');
    }
    // Everything happens invisibly behind the opaque title-wipe overlay so
    // the new page is fully prepared before the reveal starts.
    resetScroll();
    syncWebflowPageId(data);
    await syncPageScripts(data);
    refreshParallax();
    runInit(data.next.namespace);

    // First refresh captures triggers that init'd synchronously.
    if (typeof ScrollTrigger !== 'undefined') {
      log('ScrollTrigger.refresh() #1');
      ScrollTrigger.refresh();
    }

    // Hard settle window: gives Webflow CMS dyn-lists, lazy images, and
    // ScrollTrigger pin-spacers enough time to finish their layout passes.
    // Anything shorter and the pin-spacer height/padding changes leak out
    // AFTER the overlay has faded, causing a visible shift.
    log('awaiting 250ms settle window');
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Second refresh catches triggers that set up async (e.g. after
    // images/CMS finished rendering inside the new container).
    if (typeof ScrollTrigger !== 'undefined') {
      log('ScrollTrigger.refresh() #2');
      ScrollTrigger.refresh();
    }

    // Final paint tick so the refresh result is committed before enter().
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    log('paint settled');
    groupEnd();
  });

  barba.hooks.enter((data) => {
    log(`enter → ${data.next.namespace}`);
  });

  barba.hooks.afterEnter((data) => {
    // Intentionally no ScrollTrigger.refresh() here — running it after the
    // overlay has faded causes visible layout shifts in pinned sections.
    // All refresh work happens during beforeEnter while the overlay covers.
    log(`afterEnter → ${data.next.namespace}`);
  });

  barba.init({
    debug: debug,
    timeout: 5000,
    // Barba only handles navigation to pages that carry a Barba container.
    // Until every Webflow page template has been tagged, we keep a allowlist
    // of paths that are known-tagged; any other target falls through to a
    // native full-page navigation (and hash links stay native too).
    prevent: ({ el }) => {
      if (!el) return false;
      const href = el.getAttribute('href');
      if (!href) return false;
      if (href.startsWith('#')) {
        log(`prevent: hash link "${href}" → native`);
        return true;
      }
      try {
        const url = new URL(href, window.location.origin);
        const path = url.pathname.replace(/\/$/, '') || '/';
        const prevented = !TAGGED_PATHS.has(path);
        if (prevented) {
          log(`prevent: "${path}" not in allowlist → native nav`);
        } else {
          log(`barba will handle: "${path}"`);
        }
        return prevented;
      } catch {
        return false;
      }
    },
    transitions: [titleWipe],
    views: [],
  });

  log('barba.init complete');
}

// Keep in sync with the pages that have data-barba="container" in Webflow.
// Remove this allowlist entirely once every page template is tagged.
const TAGGED_PATHS = new Set([
  '/',
  '/about',
  '/animation',
  '/commissional-work',
  '/fotografie',
  '/illustration',
  '/shop',
  '/auftragsarbeiten/luvcat',
  '/auftragsarbeiten/kdk-festival-design',
  '/auftragsarbeiten/grey-men',
  '/auftragsarbeiten/plakate-drucksachen',
  '/auftragsarbeiten/fotoshoots',
  '/auftragsarbeiten/eventfotografie',
  '/auftragsarbeiten/cover-art',
  '/auftragsarbeiten/produktinszenierung',
]);
