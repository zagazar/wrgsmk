/**
 * WRGSMK Home — page-specific scripts for /
 */
import { initHorizontalScroll } from './horizontal-scroll.js';
import { initCircleText } from './circle-text.js';

let cleanups = [];

export function init() {
  cleanups.push(initHorizontalScroll());
  cleanups.push(initCircleText());
}

export function destroy() {
  cleanups.forEach((fn) => { if (typeof fn === 'function') fn(); });
  cleanups = [];
}
