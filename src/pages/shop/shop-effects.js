/**
 * Shop — Product hover scale effect
 *
 * Expects global: gsap
 * Returns: destroy() that removes hover listeners.
 */
export function initShopEffects() {
  if (typeof gsap === 'undefined') return () => {};

  const handlers = [];
  document.querySelectorAll('.product-list--product').forEach((link) => {
    const img = link.querySelector('.product-list--img');
    if (!img) return;

    const onEnter = () => gsap.to(img, { duration: 0.15, scale: 0.95, transformOrigin: 'center center', ease: 'power1.out' });
    const onLeave = () => gsap.to(img, { duration: 0.15, scale: 1, transformOrigin: 'center center', ease: 'power1.out' });

    link.addEventListener('mouseenter', onEnter);
    link.addEventListener('mouseleave', onLeave);
    handlers.push({ link, onEnter, onLeave });
  });

  return function destroy() {
    handlers.forEach(({ link, onEnter, onLeave }) => {
      link.removeEventListener('mouseenter', onEnter);
      link.removeEventListener('mouseleave', onLeave);
    });
  };
}
