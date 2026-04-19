/**
 * WRGSMK Commission Detail — shared module for /auftragsarbeiten/* subpages
 *
 * Registered under each subpage namespace (luvcat, produktinszenierung, ...).
 * Self-detects the pinned-image layout; no-op on pages that don't have it.
 */
import { initPinImageSwap } from './pin-image-swap.js';

let cleanups = [];

export function init() {
  cleanups.push(initPinImageSwap());
}

export function destroy() {
  cleanups.forEach((fn) => { if (typeof fn === 'function') fn(); });
  cleanups = [];
}
