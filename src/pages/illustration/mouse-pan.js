/**
 * Mouse-Pan + Edge-Scale Module
 * Moves .masonry-container opposite to cursor, scales .edge-scale items on viewport enter/leave.
 * Configurable pan range via data-pan attribute (e.g. "40vw", "320px").
 *
 * Expects global: gsap
 */
export function initMousePan() {
  function parsePan(val, vw) {
    if (!val) return vw;
    val = String(val).trim().toLowerCase();
    const num = parseFloat(val);
    if (isNaN(num)) return vw;
    if (val.endsWith('vw')) return vw * (num / 100);
    if (val.endsWith('px')) return num;
    return num;
  }

  function onReady(fn) {
    document.readyState !== 'loading'
      ? fn()
      : document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    if (typeof gsap === 'undefined') {
      console.warn('[WRGSMK] GSAP not found — skipping mouse-pan.');
      return;
    }

    const gs = gsap;
    const container = document.querySelector('.illustration-wide .masonry-container');
    if (!container) return;
    if (container.dataset.gsInited) return;
    container.dataset.gsInited = '1';

    const items = Array.from(container.querySelectorAll('.edge-scale'));

    // --- Initial states
    gs.set(container, { force3D: true, willChange: 'transform' });
    items.forEach((edge) => {
      edge.style.scale = '';
      gs.set(edge, {
        transformOrigin: '50% 50%',
        scaleX: 0.7,
        scaleY: 0.7,
        willChange: 'transform',
      });
    });

    // --- Viewport detection: scale 0.7 ↔ 1
    const VISIBLE_SCALE = { scaleX: 1, scaleY: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' };
    const HIDDEN_SCALE = { scaleX: 0.7, scaleY: 0.7, duration: 0.35, ease: 'power2.inOut', overwrite: 'auto' };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            gs.to(entry.target, entry.isIntersecting ? VISIBLE_SCALE : HIDDEN_SCALE);
          }
        },
        { root: null, rootMargin: '0px 10%', threshold: 0.15 }
      );
      items.forEach((edge) => io.observe(edge));
    } else {
      // Fallback
      const check = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        items.forEach((edge) => {
          const r = edge.getBoundingClientRect();
          const inView = r.right > 0 && r.left < w && r.bottom > 0 && r.top < h;
          gs.to(edge, inView ? VISIBLE_SCALE : HIDDEN_SCALE);
        });
      };
      check();
      window.addEventListener('resize', check, { passive: true });
    }

    // --- Mouse-driven pan (opposite direction)
    let halfRange = 0;
    let centerX = 0;
    let clampX = (v) => v;

    function computeBounds() {
      const vw = Math.max(1, window.innerWidth);
      halfRange = parsePan(container.getAttribute('data-pan'), vw);
      centerX = 0;
      clampX = gs.utils.clamp(-halfRange, halfRange);
    }
    computeBounds();

    const setX = gs.quickTo(container, 'x', { duration: 0.6, ease: 'power3.out' });

    function handlePointer(clientX) {
      const vw = Math.max(1, window.innerWidth);
      let s = (clientX / vw) * 2 - 1;
      if (s < -1) s = -1;
      if (s > 1) s = 1;
      setX(clampX(centerX - s * halfRange));
    }

    window.addEventListener('mousemove', (e) => handlePointer(e.clientX), { passive: true });
    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches && e.touches[0]) handlePointer(e.touches[0].clientX);
      },
      { passive: true }
    );

    setX(centerX);

    const recompute = () => { computeBounds(); setX(centerX); };
    window.addEventListener('resize', recompute, { passive: true });
    window.addEventListener('orientationchange', recompute, { passive: true });
  });
}
