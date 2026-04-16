/**
 * Shop — Product hover scale effect
 * Scales product images on hover. No ScrollSmoother dependency (uses Lenis from core).
 *
 * Expects global: gsap
 */
export function initShopEffects() {
  if (typeof gsap === 'undefined') return;

  document.querySelectorAll('.product-list--product').forEach((link) => {
    const img = link.querySelector('.product-list--img');
    if (!img) return;

    link.addEventListener('mouseenter', () => {
      gsap.to(img, {
        duration: 0.15,
        scale: 0.95,
        transformOrigin: 'center center',
        ease: 'power1.out',
      });
    });

    link.addEventListener('mouseleave', () => {
      gsap.to(img, {
        duration: 0.15,
        scale: 1,
        transformOrigin: 'center center',
        ease: 'power1.out',
      });
    });
  });
}
