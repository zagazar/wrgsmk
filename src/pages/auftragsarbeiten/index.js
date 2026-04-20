/**
 * WRGSMK Auftragsarbeiten — page-specific scripts for /commissional-work
 */
import { initTypoScrollPreview } from './typo-scroll-preview.js';

let cleanups = [];

export function init() {
  cleanups.push(initTypoScrollPreview());
}

export function destroy() {
  cleanups.forEach((fn) => { if (typeof fn === 'function') fn(); });
  cleanups = [];
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
