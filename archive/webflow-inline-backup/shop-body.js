/**
 * WRGSMK — Webflow Inline Backup: SHOP PAGE (Body Custom Code)
 * Captured: 2026-04-16 from https://www.wuergsamkeiten.com/shop
 *
 * NOTE: Site-wide scripts (Lenis, Parallax, GSAP register) are in home-body.js
 * This file only contains shop-specific code.
 */

// === SHOP-ONLY: ScrollSmoother + Product Hover ===
document.addEventListener("DOMContentLoaded", (e) => {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  // create the scrollSmoother before your scrollTriggers
  ScrollSmoother.create({
    smooth: 0.8,
    effects: true,
    smoothTouch: 0.2,
  });

  // Für alle Produkt-Links
  document.querySelectorAll('.product-list--product').forEach(link => {
    const img = link.querySelector('.product-list--img');
    if (!img) return;

    link.addEventListener('mouseenter', () => {
      gsap.to(img, {
        duration: 0.15,
        scale: 0.95,
        transformOrigin: 'center center',
        ease: 'power1.out'
      });
    });

    link.addEventListener('mouseleave', () => {
      gsap.to(img, {
        duration: 0.15,
        scale: 1,
        transformOrigin: 'center center',
        ease: 'power1.out'
      });
    });
  });
});
