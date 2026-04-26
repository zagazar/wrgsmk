/**
 * Typo Scroll Preview — Pinned commission section.
 *
 * Follows the Osmo/Dashly "Big Typo Scroll Preview" pattern: each project has
 * its own fixed-position preview image appended to <body>. Only the active
 * one is visible. Switching items crossfades via CSS transitions.
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() that removes body-level previews and all listeners.
 */
export function initTypoScrollPreview() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return () => {};

  const section = document.querySelector('.wrgsmk-comission');
  if (!section) return () => {};

  const wrap = section.querySelector('.wrgsmk-comission_wrap');
  const list = section.querySelector('.wrgsmk-comission_list');
  if (!wrap || !list) return () => {};

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const oldContainer = section.querySelector('.comission-img-container');
  if (oldContainer) oldContainer.remove();

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
    // Strip Webflow-IX inline state and the data-w-id that would let IX3
    // re-bind to the clone and re-apply that state. The Body-level preview
    // is fully driven by .typo-preview.is-active; we don't want any IX
    // animation on it.
    preview.removeAttribute('style');
    preview.removeAttribute('data-w-id');
    document.body.appendChild(preview);
    previews.push(preview);
  });

  const allItems = wrap.querySelectorAll('.wrgsmk-comission_item');

  section.style.overflow = 'hidden';
  section.style.position = 'relative';
  section.style.zIndex = '2';
  wrap.style.position = 'relative';
  wrap.style.zIndex = '2';
  requestAnimationFrame(() => {
    const pinSpacer = section.closest('.pin-spacer');
    if (pinSpacer) pinSpacer.style.zIndex = '2';
  });

  const getScrollDistance = () => Math.max(list.offsetHeight - window.innerHeight, 0);

  const tween = gsap.fromTo(
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

  let activeItem = null;

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
    previews.forEach((p, i) => { if (p) p.classList.toggle('is-active', i === idx); });
  }

  function deactivate() {
    if (activeItem) activeItem.classList.remove('is-active');
    activeItem = null;
    previews.forEach((p) => p?.classList.remove('is-active'));
  }

  const hoverHandlers = [];
  if (!isTouch) {
    allItems.forEach((item) => {
      const onEnter = () => activate(item);
      item.addEventListener('mouseenter', onEnter);
      hoverHandlers.push({ item, onEnter });
    });
    section.addEventListener('mouseleave', deactivate);
  }

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

    if (closest && minDist < window.innerHeight / 3) activate(closest);
  }

  return function destroy() {
    if (tween) tween.kill();
    previews.forEach((p) => p?.remove());
    hoverHandlers.forEach(({ item, onEnter }) => item.removeEventListener('mouseenter', onEnter));
    if (!isTouch) section.removeEventListener('mouseleave', deactivate);
  };
}
