/**
 * Mouse-Pan + Edge-Scale Module
 * Moves .masonry-container opposite to cursor, scales .edge-scale items on viewport enter/leave.
 *
 * Expects global: gsap
 * Returns: destroy() that disconnects IO, removes all listeners.
 */
export function initMousePan() {
  if (typeof gsap === 'undefined') {
    console.warn('[WRGSMK] GSAP not found — skipping mouse-pan.');
    return () => {};
  }

  const gs = gsap;
  const container = document.querySelector('.illustration-wide .masonry-container');
  if (!container) return () => {};
  if (container.dataset.gsInited) return () => {};
  container.dataset.gsInited = '1';

  const items = Array.from(container.querySelectorAll('.edge-scale'));

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

  const VISIBLE_SCALE = { scaleX: 1, scaleY: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' };
  const HIDDEN_SCALE = { scaleX: 0.7, scaleY: 0.7, duration: 0.35, ease: 'power2.inOut', overwrite: 'auto' };

  let io = null;
  let fallbackCheck = null;

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          gs.to(entry.target, entry.isIntersecting ? VISIBLE_SCALE : HIDDEN_SCALE);
        }
      },
      { root: null, rootMargin: '0px 10%', threshold: 0.15 }
    );
    items.forEach((edge) => io.observe(edge));
  } else {
    fallbackCheck = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      items.forEach((edge) => {
        const r = edge.getBoundingClientRect();
        const inView = r.right > 0 && r.left < w && r.bottom > 0 && r.top < h;
        gs.to(edge, inView ? VISIBLE_SCALE : HIDDEN_SCALE);
      });
    };
    fallbackCheck();
    window.addEventListener('resize', fallbackCheck, { passive: true });
  }

  let halfRange = 0;
  let centerX = 0;
  let clampX = (v) => v;

  function parsePan(val, vw) {
    if (!val) return vw;
    val = String(val).trim().toLowerCase();
    const num = parseFloat(val);
    if (isNaN(num)) return vw;
    if (val.endsWith('vw')) return vw * (num / 100);
    if (val.endsWith('px')) return num;
    return num;
  }

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

  const mouseHandler = (e) => handlePointer(e.clientX);
  const touchHandler = (e) => {
    if (e.touches && e.touches[0]) handlePointer(e.touches[0].clientX);
  };
  window.addEventListener('mousemove', mouseHandler, { passive: true });
  window.addEventListener('touchmove', touchHandler, { passive: true });

  setX(centerX);

  const recompute = () => { computeBounds(); setX(centerX); };
  window.addEventListener('resize', recompute, { passive: true });
  window.addEventListener('orientationchange', recompute, { passive: true });

  return function destroy() {
    if (io) io.disconnect();
    if (fallbackCheck) window.removeEventListener('resize', fallbackCheck);
    window.removeEventListener('mousemove', mouseHandler);
    window.removeEventListener('touchmove', touchHandler);
    window.removeEventListener('resize', recompute);
    window.removeEventListener('orientationchange', recompute);
    delete container.dataset.gsInited;
  };
}
