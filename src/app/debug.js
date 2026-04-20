/**
 * WRGSMK Debug Utilities
 *
 * Toggle verbose console logging for barba.js lifecycle, transitions,
 * and module init/destroy calls. Zero cost when disabled.
 *
 * Activation (any of):
 * - URL:         ?debug=1
 * - LocalStore:  localStorage.setItem('wrgsmk-debug', '1')
 * - Global:      window.WRGSMK_DEBUG = true  (set before the bundle loads)
 */

const PREFIX = '[WRGSMK:barba]';

let cached = null;

export function isDebug() {
  if (cached !== null) return cached;
  if (typeof window === 'undefined') return false;

  try {
    if (window.WRGSMK_DEBUG === true) return (cached = true);
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') return (cached = true);
    if (window.localStorage && window.localStorage.getItem('wrgsmk-debug') === '1') {
      return (cached = true);
    }
  } catch (e) {
    /* localStorage can throw in sandboxed contexts */
  }
  return (cached = false);
}

export function log(...args) {
  if (!isDebug()) return;
  // eslint-disable-next-line no-console
  console.log(PREFIX, ...args);
}

export function warn(...args) {
  if (!isDebug()) return;
  // eslint-disable-next-line no-console
  console.warn(PREFIX, ...args);
}

export function error(...args) {
  if (!isDebug()) return;
  // eslint-disable-next-line no-console
  console.error(PREFIX, ...args);
}

export function group(label) {
  if (!isDebug()) return;
  // eslint-disable-next-line no-console
  console.groupCollapsed(`${PREFIX} ${label}`);
}

export function groupEnd() {
  if (!isDebug()) return;
  // eslint-disable-next-line no-console
  console.groupEnd();
}

export function time(label) {
  if (!isDebug()) return;
  // eslint-disable-next-line no-console
  console.time(`${PREFIX} ${label}`);
}

export function timeEnd(label) {
  if (!isDebug()) return;
  // eslint-disable-next-line no-console
  console.timeEnd(`${PREFIX} ${label}`);
}
