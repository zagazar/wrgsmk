/**
 * WRGSMK App — single consolidated bundle
 *
 * Loaded site-wide as wrgsmk-app.min.js. Runs once on first page load.
 * initCore() sets up Lenis/parallax/context-guard; initBarba() wires
 * barba.init with views (per-namespace init/destroy) and the title-wipe
 * transition.
 */
import { initCore } from '../core/index.js';
import { initBarba } from './barba-controller.js';

initCore();
initBarba();
