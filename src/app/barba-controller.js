/**
 * Transition Controller — title-wipe over native navigation.
 *
 * SPA-style container swapping fought too hard with Webflow's per-page
 * IX runtime (per-page cores, per-page schunks, IIFE closures with
 * lifelong state). Instead, we keep the cinematic title-wipe overlay
 * and just do real page reloads behind it: native nav guarantees that
 * Webflow boots cleanly on every page exactly the way it does on a
 * hard reload, so all hover/scroll/IX animations work without manual
 * rebind dances.
 *
 * Flow:
 * - On link click to a tagged path: animate title-wipe leave (orange
 *   title slides in from the right onto a white overlay), then
 *   `window.location.href = url`.
 * - Before navigating away, write the destination's title into
 *   sessionStorage so the next page's pre-paint setup can stage the
 *   overlay in its "centered" end-state.
 * - On the new page load: if the stash is present, paint the overlay
 *   immediately (text centered, full opacity), then play title-wipe
 *   enter to slide it off.
 * - Page-module init() runs once on natural load, same as a hard
 *   reload. No destroy/rebind needed.
 */
import * as homeModule from '../pages/home/index.js';
import * as illustrationModule from '../pages/illustration/index.js';
import * as shopModule from '../pages/shop/index.js';
import * as photographyModule from '../pages/photography/index.js';
import * as auftragsarbeitenModule from '../pages/auftragsarbeiten/index.js';
import * as commissionDetailModule from '../pages/commission-detail/index.js';

const passthroughModule = { init() {}, destroy() {} };

import { titleWipe } from './transitions/title-wipe.js';
import { injectWipeStyles } from './transitions/title-wipe.css.js';
import { isDebug, log, warn, group, groupEnd, time, timeEnd } from './debug.js';

const modules = {
  home: homeModule,
  illustration: illustrationModule,
  shop: shopModule,
  photography: photographyModule,
  auftragsarbeiten: auftragsarbeitenModule,
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

const STORAGE_KEY = 'wrgsmk-incoming';

// Paths we own a transition for. Anything else falls through to native
// nav with no overlay (external links, hash links, mailto, etc.).
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

function getCurrentContainer() {
  return document.querySelector('[data-barba="container"]');
}

function getCurrentNamespace() {
  return getCurrentContainer()?.dataset?.barbaNamespace || null;
}

function pathToTitle(path) {
  const last = path.replace(/\/+$/, '').split('/').filter(Boolean).pop();
  return last ? last.replace(/-/g, ' ').toUpperCase() : 'WÜRGSAMKEITEN';
}

function titleForLink(link, url) {
  const explicit = link?.dataset?.barbaTitle;
  if (explicit) return explicit;
  return pathToTitle(url.pathname);
}

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
    console.error('[WRGSMK:transition] init failed for', namespace, e);
  }
}

function playEnter() {
  const stash = sessionStorage.getItem(STORAGE_KEY);
  if (!stash) return;
  sessionStorage.removeItem(STORAGE_KEY);

  let title = '';
  try {
    title = JSON.parse(stash).title || '';
  } catch {
    title = stash;
  }
  if (!title) title = pathToTitle(location.pathname);

  if (typeof gsap === 'undefined') {
    // No GSAP loaded yet — best we can do is hide a pre-painted overlay
    // so the page is visible.
    document.getElementById('wrgsmk-wipe')?.remove();
    return;
  }

  const container = getCurrentContainer();
  const data = {
    next: {
      namespace: getCurrentNamespace(),
      url: { path: location.pathname, href: location.href },
      container: container || { dataset: { barbaTitle: title } },
    },
  };
  if (container && !container.dataset.barbaTitle) {
    container.dataset.barbaTitle = title;
  }

  // Drop the CSS-driven incoming state on a pre-painted overlay (if any)
  // so leave()'s GSAP fromTo can own the inline transform without
  // fighting CSS specificity.
  const preExisting = document.getElementById('wrgsmk-wipe');
  if (preExisting) preExisting.classList.remove('is-incoming');

  // Stage via leave(): adopts a pre-painted overlay or creates one,
  // sets the title text, and builds the slide-in timeline. Jump that
  // timeline to its end-state so we don't see the slide-in. This also
  // initializes title-wipe's module-level `overlay`/`textEl` refs that
  // enter() needs.
  const stageTl = titleWipe.leave(data);
  if (stageTl && typeof stageTl.totalProgress === 'function') {
    stageTl.totalProgress(1).pause();
  }

  // Now play the reveal: text slides off-screen left, overlay fades out.
  titleWipe.enter(data);
}

function navigate(url, link) {
  const title = titleForLink(link, url);
  log(`navigate → ${url.pathname} (title="${title}")`);

  // Stash for the incoming page's enter animation.
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ title, ts: Date.now() }));
  } catch {}

  const data = {
    next: {
      namespace: null,
      url: { path: url.pathname, href: url.href },
      container: { dataset: { barbaTitle: title } },
    },
  };

  if (typeof gsap === 'undefined') {
    window.location.href = url.href;
    return;
  }

  const tl = titleWipe.leave(data);
  if (tl && typeof tl.eventCallback === 'function') {
    tl.eventCallback('onComplete', () => { window.location.href = url.href; });
  } else {
    Promise.resolve(tl).then(() => { window.location.href = url.href; });
  }
}

function handleClick(e) {
  if (e.defaultPrevented) return;
  if (e.button !== undefined && e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const link = e.target.closest('a[href]');
  if (!link) return;
  if (link.target === '_blank') return;
  if (link.hasAttribute('download')) return;

  const href = link.getAttribute('href');
  if (!href) return;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

  let url;
  try {
    url = new URL(href, location.origin);
  } catch {
    return;
  }
  if (url.origin !== location.origin) return;

  const path = url.pathname.replace(/\/$/, '') || '/';
  if (!TAGGED_PATHS.has(path)) return;

  // Don't intercept same-page clicks.
  if (path === (location.pathname.replace(/\/$/, '') || '/') && url.hash === location.hash) return;

  e.preventDefault();
  navigate(url, link);
}

export function initBarba() {
  if (typeof window === 'undefined') return;

  if (isDebug()) {
    log('debug mode ENABLED');
    log('registered namespaces:', Object.keys(modules));
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  injectWipeStyles();

  // Page-module init for whatever page we just loaded into. Mirrors
  // what Barba's hooks.once used to do. Skipped for non-tagged paths
  // (e.g. landing on /impressum directly — there's no module for it).
  const ns = getCurrentNamespace();
  if (ns) runInit(ns);

  // If the stash flag is present, this load is the back end of a
  // title-wipe transition. Run the enter animation to slide the
  // overlay off and reveal the page.
  if (sessionStorage.getItem(STORAGE_KEY)) {
    // Wait one frame so the page has actually painted before the
    // overlay is staged on top of it (avoids a flash of unstyled
    // content under the overlay during paint).
    requestAnimationFrame(playEnter);
  }

  document.addEventListener('click', handleClick, false);

  log('transition controller ready');
}
