/**
 * Typo Scroll Preview — Pinned commission section with repeating project list
 * and hover/scroll-activated image preview with clip-path animation.
 *
 * Expects globals: gsap, ScrollTrigger
 *
 * Webflow classes used:
 * - .wrgsmk-comission        (section, gets pinned)
 * - .wrgsmk-comission_wrap   (inner wrapper, gets translated)
 * - .wrgsmk-comission_list   (project list, gets cloned N-1 times)
 * - .wrgsmk-comission_item   (each project entry)
 * - .wrgsmk-comission_img    (image inside each item)
 * - .comission-img-container (preview container, moved to body behind section)
 * - .comission_img            (the preview image element)
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
  const imgContainer = section.querySelector('.comission-img-container');
  const previewImg = imgContainer?.querySelector('.comission_img');
  if (!wrap || !list || !imgContainer || !previewImg) return;

  const REPEAT_COUNT = parseInt(section.dataset.comissionRepeats || '3', 10);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Move preview container to body — it uses position:fixed and sits
  // BEHIND the pinned section (lower z-index). The section's titles
  // use mix-blend-mode:difference to interact with the image visually.
  document.body.appendChild(imgContainer);

  // Clone the list N-1 times for repeated scroll effect
  for (let i = 0; i < REPEAT_COUNT - 1; i++) {
    const clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    wrap.appendChild(clone);
  }

  const allItems = wrap.querySelectorAll('.wrgsmk-comission_item');

  // Section must clip the overflowing list content
  section.style.overflow = 'hidden';

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

  // --- Preview image logic ---
  let activeItem = null;

  function activate(item) {
    if (item === activeItem) return;
    if (activeItem) activeItem.classList.remove('is-active');

    activeItem = item;
    item.classList.add('is-active');

    // Swap preview image to match hovered/active item
    const itemImg = item.querySelector('.wrgsmk-comission_img');
    if (itemImg) {
      previewImg.src = itemImg.src;
      previewImg.alt = itemImg.alt || '';
      if (itemImg.srcset) previewImg.srcset = itemImg.srcset;
      if (itemImg.sizes) previewImg.sizes = itemImg.sizes;
    }

    // Brief close→reopen when switching, or just reveal on first hover
    if (imgContainer.classList.contains('is-revealed')) {
      imgContainer.classList.remove('is-revealed');
      setTimeout(() => {
        imgContainer.classList.add('is-revealed');
      }, 120);
    } else {
      imgContainer.classList.add('is-revealed');
    }
  }

  function deactivate() {
    if (activeItem) activeItem.classList.remove('is-active');
    activeItem = null;
    imgContainer.classList.remove('is-revealed');
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
