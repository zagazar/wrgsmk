/**
 * WRGSMK — Webflow Inline Backup: ILLUSTRATION PAGE (Body Custom Code)
 * Captured: 2026-04-16 from https://www.wuergsamkeiten.com/illustration
 *
 * NOTE: Site-wide scripts (Lenis, Parallax, GSAP register) are in home-body.js
 * This file only contains illustration-specific code.
 */

// === ILLUSTRATION-ONLY: Mouse-Pan + Edge-Scale Module ===
(function () {
  // --- kleine Helfer
  function onReady(fn){document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn);}
  function ensureGSAP(cb){
    if (window.gsap) return cb();
    var s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  // --- NEU: Range-Parser für data-pan (z.B. "40vw" oder "320px")
  function parsePan(val, vw) {
    if (!val) return vw; // Default: 100vw (wie vorher)
    val = String(val).trim().toLowerCase();
    const num = parseFloat(val);
    if (isNaN(num)) return vw;
    if (val.endsWith('vw')) return vw * (num / 100);
    if (val.endsWith('px')) return num;
    return num; // nackte Zahl als px
  }

  onReady(function(){
    ensureGSAP(function(){
      const gs = gsap;

      const container = document.querySelector('.illustration-wide .masonry-container');
      if (!container) { console.warn('[GSAP] .illustration-wide nicht gefunden'); return; }
      if (container.dataset.gsInited) return;         // Guard gegen Doppel-Init (Webflow)
      container.dataset.gsInited = "1";

      const items = Array.from(container.querySelectorAll('.edge-scale'));
      if (!items.length) { console.warn('[GSAP] Keine .edge-scale Elemente gefunden'); }

      // ---- Startzustände (nur einmal)
      gs.set(container, { force3D: true, willChange: 'transform' });
      items.forEach(edge => {
        // CSS-Property 'scale' entfernen, damit GSAP-Transform zuverlässig wirkt
        edge.style.scale = "";
        gs.set(edge, { transformOrigin: '50% 50%', scaleX: 0.7, scaleY: 0.7, willChange: 'transform' });
      });

      // ---- Viewport-Erkennung → 0.7 ↔︎ 1 (Transform-Scale, nicht CSS 'scale')
      const VISIBLE_SCALE = { scaleX: 1,   scaleY: 1,   duration: 0.35, ease: "power2.out", overwrite: "auto" };
      const HIDDEN_SCALE  = { scaleX: 0.7, scaleY: 0.7, duration: 0.35, ease: "power2.inOut", overwrite: "auto" };

      let teardownIO = null;
      (function setupInView(){
        if ("IntersectionObserver" in window) {
          const io = new IntersectionObserver((entries)=>{
            for (const entry of entries) {
              if (entry.isIntersecting) {
                gs.to(entry.target, VISIBLE_SCALE);
              } else {
                gs.to(entry.target, HIDDEN_SCALE);
              }
            }
          }, { root: null, rootMargin: "0px 10%", threshold: 0.15 });
          items.forEach(edge => io.observe(edge));
          teardownIO = () => io.disconnect();
        } else {
          // Fallback ohne IO
          const check = () => {
            const w = window.innerWidth, h = window.innerHeight;
            items.forEach(edge => {
              const r = edge.getBoundingClientRect();
              const inView = r.right > 0 && r.left < w && r.bottom > 0 && r.top < h;
              gs.to(edge, inView ? VISIBLE_SCALE : HIDDEN_SCALE);
            });
          };
          check();
          window.addEventListener('resize', check, { passive:true });
          teardownIO = () => window.removeEventListener('resize', check);
        }
      })();

      // ---- Maussteuerung: ENTGEGEN der Maus, Range konfigurierbar via data-pan
      let halfRange = 0, centerX = 0, leftX = 20, rightX = 20, clampX = (v)=>v;
      function computeBounds(){
        const vw = Math.max(1, window.innerWidth);
        const userHalf = parsePan(container.getAttribute('data-pan'), vw);
        halfRange = userHalf;
        centerX   = 0;
        leftX     = -halfRange;
        rightX    =  halfRange;
        clampX    = gs.utils.clamp(leftX, rightX);
      }
      computeBounds();

      const setX = gs.quickTo(container, "x", { duration: 0.6, ease: "power3.out" });

      function handlePointer(clientX){
        const vw = Math.max(1, window.innerWidth);
        let s = (clientX / vw) * 2 - 1;
        if (s < -1) s = -1; if (s > 1) s = 1;
        const x = clampX(centerX - s * halfRange);
        setX(x);
      }

      window.addEventListener('mousemove', (e)=> handlePointer(e.clientX), { passive:true });
      window.addEventListener('touchmove', (e)=>{ if(e.touches && e.touches[0]) handlePointer(e.touches[0].clientX); }, { passive:true });

      // Start zentriert
      setX(centerX);

      // Recompute bei Resize/Orientation
      const recompute = () => { computeBounds(); setX(centerX); };
      window.addEventListener('resize', recompute, { passive:true });
      window.addEventListener('orientationchange', recompute, { passive:true });
    });
  });
})();

// === ILLUSTRATION-ONLY: Rotating Words (SplitText) ===
gsap.registerPlugin(SplitText);

(function () {
  const words = gsap.utils.toArray(".rotating-words .word");
  if (!words.length) return;

  // --- Splitten (SplitText, sonst Fallback) ---
  function splitFallback(el){
    const t = el.textContent;
    el.textContent = "";
    for (const c of t) {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = c === " " ? "\u00A0" : c;
      el.appendChild(span);
    }
    el.chars = el.querySelectorAll(".char");
  }
  if (window.SplitText) {
    gsap.registerPlugin(SplitText);
    words.forEach(w => {
      const st = new SplitText(w, { type: "chars" });
      w.chars = st.chars;
    });
  } else {
    words.forEach(splitFallback);
  }

  // --- Höhe fixieren (kein Layout-Jump) ---
  const container = document.querySelector(".rotating-words");
  let maxH = 0;
  words.forEach(w=>{
    const p = w.style.position, v = w.style.visibility;
    w.style.position = "relative"; w.style.visibility = "hidden"; w.style.transform = "translateY(0)";
    maxH = Math.max(maxH, w.offsetHeight);
    w.style.position = p || "absolute"; w.style.visibility = v || "";
  });
  container.style.height = maxH + "px";

  // --- Geschwindigkeiten ---
  const charStagger = 0.01;
  const enterDur   = 0.266;
  const hold       = 1.66;
  const exitDur    = 0.266;
  const chase      = 0.166;

  // --- definierter Startzustand ---
  const allChars = words.flatMap(w => Array.from(w.chars));
  gsap.set(allChars, { y: 100 });
  gsap.set(words[0].chars, { y: 0 });

  // --- Timeline mit Overlap (hinterher) ---
  const tl = gsap.timeline({ repeat: -1 });

  tl.to({}, { duration: hold });

  function step(prevIndex, currIndex) {
    const prev = words[prevIndex];
    const curr = words[currIndex];

    tl.to(prev.chars, {
      y: 100,
      ease: "expo.in",
      duration: exitDur,
      stagger: charStagger,
      overwrite: "auto"
    }, ">");

    tl.fromTo(curr.chars,
      { y: -100 },
      {
        y: 0,
        ease: "expo.out",
        duration: enterDur,
        stagger: charStagger,
        overwrite: "auto",
        immediateRender: false
      },
      `<+=${chase}`
    );

    tl.to({}, { duration: hold });
  }

  for (let i = 1; i < words.length; i++) step(i - 1, i);
  step(words.length - 1, 0);

})();
