/**
 * WRGSMK Illustration — page-specific scripts for /illustration
 */
import { initMousePan } from './mouse-pan.js';
import { initRotatingWords } from './rotating-words.js';

let cleanups = [];

export function init() {
  cleanups.push(initMousePan());
  cleanups.push(initRotatingWords());
}

export function destroy() {
  cleanups.forEach((fn) => { if (typeof fn === 'function') fn(); });
  cleanups = [];
}
