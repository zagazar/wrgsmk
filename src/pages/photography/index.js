/**
 * WRGSMK Photography — page-specific scripts for /fotografie
 */
import { initPhotographyScroller } from './photography-scroller.js';
import { initStickyHorizontal } from './sticky-horizontal.js';
import { initDarkmodeText } from './darkmode-text.js';

document.addEventListener('DOMContentLoaded', () => {
  initPhotographyScroller();
  initStickyHorizontal();
  initDarkmodeText();
});
