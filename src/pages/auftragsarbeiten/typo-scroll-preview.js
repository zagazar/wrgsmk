/**
 * Typo Scroll Preview — Pinned commission section with repeating project list.
 *
 * Follows the Osmo/Dashly "Big Typo Scroll Preview" pattern: each project has
 * its own fixed-position preview image that stacks at viewport center. Only
 * the active one is visible. Switching items crossfades via simultaneous
 * clip-path + opacity transitions (CSS).
 *
 * Expects globals: gsap, ScrollTrigger
 *
 * Webflow classes used:
 * - .wrgsmk-comission        (section, gets pinned)
 * - .wrgsmk-comission_wrap   (inner wrapper, gets translated)
 * - .wrgsmk-comission_list   (project list, gets cloned N-1 times)
 * - .wrgsmk-comission_item   (each project entry)
 * - .wrgsmk-comission_img    (image inside each item — source for preview)
 * - .comission-img-container (the OLD single preview — removed, no longer used)
 *
 * Previews created by this module (added to <body>):
 * - .typo-preview            (one per project, fixed-position, clip-path animated)
 *   - .is-active              (state class)
 *
 * Optional data attribute on .wrgsmk-comission:
 * - data-comission-repeats="3"  (how many times the list repeats, default 3)
 */
export function initTypoScrollPreview() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const section = document.querySelector('.wrgsmk-comission');
  if (!section) return;

  const wrap = section.querySelector('.wrgsmk-comission_wrap');
  const list = section.querySelector('.wrgsmk-comission_list');
  if (!wrap || !list) return;

  const REPEAT_COUNT = parseInt(section.dataset.comissionRepeats || '3', 10);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Remove the old single-preview container (no longer used)
  const oldContainer = section.querySelector('.comission-img-container');
  if (oldContainer) oldContainer.remove();

  // Create one fixed-position preview per ORIGINAL item (before cloning).
  const originalItems = list.querySelectorAll('.wrgsmk-comission_item');
  const previews = [];
  originalItems.forEach((item) => {
    const itemImg = item.querySelector('.wrgsmk-comission_img');
    if (!itemImg) {
      previews.push(null);
      return;
    }
    const preview = itemImg.cloneNode(true);
    preview.classList.remove('wrgsmk-comission_img');
    preview.classList.add('typo-preview');
    preview.removeAttribute('aria-hidden');
    document.body.appendChild(preview);
    previews.push(preview);
  });

  // Clone the list N-1 times for repeated scroll effect
  for (let i = 0; i < REPEAT_COUNT - 1; i++) {
    const clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    wrap.appendChild(clone);
  }

  const allItems = wrap.querySelectorAll('.wrgsmk-comission_item');

  // Section must clip the overflowing list content
  section.style.overflow = 'hidden';

  // Ensure titles render above the body-level previews
  section.style.position = 'relative';
  section.style.zIndex = '2';
  wrap.style.position = 'relative';
  wrap.style.zIndex = '2';
  requestAnimationFrame(() => {
    const pinSpacer = section.closest('.pin-spacer');
    if (pinSpacer) pinSpacer.style.zIndex = '2';
  });

  // Scroll distance = total list height minus one viewport
  const getScrollDistance = () =>
    list.offsetHeight * REPEAT_COUNT - window.innerHeight;

  // Pin section and scrub list position upward
  gsap.fromTo(
    wrap,
    { y: 0 },
    {
      y: () => -getScrollDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + getScrollDistance(),
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: isTouch ? findClosestItem : undefined,
      },
    }
  );

  // --- Active item logic ---
  let activeItem = null;

  // Find an item's index within its own parent list (0…n-1)
  function getPreviewIndex(item) {
    const parentList = item.closest('.wrgsmk-comission_list');
    if (!parentList) return -1;
    const siblings = parentList.querySelectorAll('.wrgsmk-comission_item');
    return Array.from(siblings).indexOf(item);
  }

  function activate(item) {
    if (item === activeItem) return;
    if (activeItem) activeItem.classList.remove('is-active');

    activeItem = item;
    item.classList.add('is-active');

    const idx = getPreviewIndex(item);
    previews.forEach((p, i) => {
      if (p) p.classList.toggle('is-active', i === idx);
    });
  }

  function deactivate() {
    if (activeItem) activeItem.classList.remove('is-active');
    activeItem = null;
    previews.forEach((p) => p?.classList.remove('is-active'));
  }

  // Desktop: hover-based activation
  if (!isTouch) {
    allItems.forEach((item) => {
      item.addEventListener('mouseenter', () => activate(item));
    });
    section.addEventListener('mouseleave', deactivate);
  }

  // Mobile: find item closest to viewport center
  function findClosestItem() {
    const cy = window.innerHeight / 2;
    let closest = null;
    let minDist = Infinity;

    allItems.forEach((item) => {
      const r = item.getBoundingClientRect();
      const dist = Math.abs(r.top + r.height / 2 - cy);
      if (dist < minDist) {
        minDist = dist;
        closest = item;
      }
    });

    if (closest && minDist < window.innerHeight / 3) {
      activate(closest);
    }
  }
}
