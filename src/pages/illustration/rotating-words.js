/**
 * Rotating Words — character-by-character text rotation
 * Uses GSAP SplitText to split words into chars and animate them in/out.
 *
 * Expects globals: gsap, SplitText
 */
export function initRotatingWords() {
  if (typeof gsap === 'undefined') return;

  const words = gsap.utils.toArray('.rotating-words .word');
  if (!words.length) return;

  // --- Split into chars (SplitText or manual fallback)
  function splitFallback(el) {
    const t = el.textContent;
    el.textContent = '';
    for (const c of t) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = c === ' ' ? '\u00A0' : c;
      el.appendChild(span);
    }
    el.chars = el.querySelectorAll('.char');
  }

  if (window.SplitText) {
    gsap.registerPlugin(SplitText);
    words.forEach((w) => {
      const st = new SplitText(w, { type: 'chars' });
      w.chars = st.chars;
    });
  } else {
    words.forEach(splitFallback);
  }

  // --- Fix container height (prevent layout jump)
  const container = document.querySelector('.rotating-words');
  let maxH = 0;
  words.forEach((w) => {
    const p = w.style.position;
    const v = w.style.visibility;
    w.style.position = 'relative';
    w.style.visibility = 'hidden';
    w.style.transform = 'translateY(0)';
    maxH = Math.max(maxH, w.offsetHeight);
    w.style.position = p || 'absolute';
    w.style.visibility = v || '';
  });
  container.style.height = maxH + 'px';

  // --- Timing config
  const charStagger = 0.01;
  const enterDur = 0.266;
  const hold = 1.66;
  const exitDur = 0.266;
  const chase = 0.166;

  // --- Initial state
  const allChars = words.flatMap((w) => Array.from(w.chars));
  gsap.set(allChars, { y: 100 });
  gsap.set(words[0].chars, { y: 0 });

  // --- Build timeline
  const tl = gsap.timeline({ repeat: -1 });
  tl.to({}, { duration: hold });

  function step(prevIndex, currIndex) {
    const prev = words[prevIndex];
    const curr = words[currIndex];

    tl.to(prev.chars, {
      y: 100,
      ease: 'expo.in',
      duration: exitDur,
      stagger: charStagger,
      overwrite: 'auto',
    }, '>');

    tl.fromTo(
      curr.chars,
      { y: -100 },
      {
        y: 0,
        ease: 'expo.out',
        duration: enterDur,
        stagger: charStagger,
        overwrite: 'auto',
        immediateRender: false,
      },
      `<+=${chase}`
    );

    tl.to({}, { duration: hold });
  }

  for (let i = 1; i < words.length; i++) step(i - 1, i);
  step(words.length - 1, 0);
}
