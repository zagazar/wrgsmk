/**
 * WRGSMK Photography — page-specific scripts for /fotografie
 */
import { initPhotographyScroller } from './photography-scroller.js';
import { initStickyHorizontal } from './sticky-horizontal.js';
import { initDarkmodeText } from './darkmode-text.js';

let cleanups = [];

export function init() {
  cleanups.push(initPhotographyScroller());
  cleanups.push(initStickyHorizontal());
  cleanups.push(initDarkmodeText());
}

export function destroy() {
  cleanups.forEach((fn) => { if (typeof fn === 'function') fn(); });
  cleanups = [];
}
