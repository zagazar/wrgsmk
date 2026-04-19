/**
 * Commission Detail — pinned image + scroll-driven swap
 *
 * Layout: one pinned main image (.comission_img) with a vertical list of
 * .wrgsmk-comission_item entries. As each item enters the viewport center,
 * its preview image source becomes the main image, with a small pulse
 * animation on change.
 *
 * Expects globals: gsap, ScrollTrigger
 * Returns: destroy() that removes listeners (ScrollTriggers killed via global hook).
 */
export function initPinImageSwap() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return () => {};

  const selWorkItem = '.wrgsmk-comission_item';
  const selWorkImg = '.wrgsmk-comission_img, img';
  const imageEl = document.querySelector('.comission_img');
  if (!imageEl) return () => {};

  const items = Array.from(document.querySelectorAll(selWorkItem));
  if (!items.length) return () => {};

  const lastIdx = items.length - 1;

  gsap.to('.comission_img', {
    scrollTrigger: {
      trigger: '.comission_img',
      start: 'center center',
      endTrigger: '.wrgsmk-comission_wrap',
      end: 'bottom bottom',
      pin: true,
      pinSpacing: false,
    },
  });

  const extractUrlFromBg = (bg) => {
    if (!bg || bg === 'none') return null;
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    return m ? m[1] : null;
  };

  const getDisplayedUrl = (target) => {
    if (!target) return null;
    if (target.tagName === 'IMG') return target.currentSrc || target.src || null;
    return extractUrlFromBg(getComputedStyle(target).backgroundImage);
  };

  function setMainImageFromEl(sourceEl, target) {
    if (!sourceEl || !target) return false;

    const imgEl = sourceEl.tagName === 'IMG' ? sourceEl : sourceEl.querySelector('img');
    let newUrl = imgEl?.currentSrc || imgEl?.src;
    if (!newUrl) newUrl = extractUrlFromBg(getComputedStyle(sourceEl).backgroundImage);
    if (!newUrl) return false;

    if (getDisplayedUrl(target) === newUrl) return false;

    if (target.tagName === 'IMG') target.src = newUrl;
    else target.style.backgroundImage = `url("${newUrl}")`;
    return true;
  }

  function animateSwap(target) {
    gsap.killTweensOf(target);
    gsap.set(target, { transformOrigin: '50% 50%' });
    gsap.fromTo(target, { scale: 0.9 }, { scale: 1, duration: 0.166, ease: 'back.out' });
  }

  items.forEach((el) => el.classList.remove('active'));
  items[0].classList.add('active');
  setMainImageFromEl(items[0].querySelector(selWorkImg), imageEl);

  let lastActiveIdx = 0;

  function activate(item) {
    const idx = items.indexOf(item);
    if (idx === -1) return;
    items.forEach((el) => el.classList.remove('active'));
    item.classList.add('active');

    const changed = setMainImageFromEl(item.querySelector(selWorkImg), imageEl);
    if (changed && idx !== lastActiveIdx) animateSwap(imageEl);
    lastActiveIdx = idx;
  }

  items.forEach((item, idx) => {
    if (idx === lastIdx) return;
    ScrollTrigger.create({
      trigger: item,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => { if (self.isActive) activate(item); },
    });
  });

  const lastItem = items[lastIdx];
  ScrollTrigger.create({
    trigger: lastItem,
    start: 'top center',
    end: 'max',
    onEnter: () => activate(lastItem),
    onEnterBack: () => activate(lastItem),
  });

  const firstInView = items.find((it) => {
    const r = it.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * 0.5 && r.bottom > vh * 0.5;
  });
  if (firstInView) activate(firstInView);

  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener('load', onLoad);

  return function destroy() {
    window.removeEventListener('load', onLoad);
  };
}
