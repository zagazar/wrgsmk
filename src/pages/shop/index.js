/**
 * WRGSMK Shop — page-specific scripts for /shop
 */
import { initShopEffects } from './shop-effects.js';

let cleanups = [];

export function init() {
  cleanups.push(initShopEffects());
}

export function destroy() {
  cleanups.forEach((fn) => { if (typeof fn === 'function') fn(); });
  cleanups = [];
}
