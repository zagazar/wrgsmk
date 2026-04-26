/**
 * CSS for the title-wipe overlay.
 *
 * Bundled and injected on app start. Mirrors the inline <style> the
 * site-wide pre-paint snippet emits — kept in sync so the snippet's
 * painted overlay and the bundle's adopted overlay render identically.
 */
const CSS = `
#wrgsmk-wipe {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
#wrgsmk-wipe .wrgsmk-wipe__letter {
  display: inline-block;
  overflow: hidden;
  font-family: 'Anton', sans-serif;
  font-weight: 400;
  font-size: 100svh;
  line-height: 1;
  white-space: pre;
  flex-shrink: 0;
}
#wrgsmk-wipe .wrgsmk-wipe__inner {
  display: inline-block;
  transform-origin: right center;
  color: #f94500;
  will-change: transform, opacity;
}

/* Pre-paint state used by the inline snippet: overlay opaque, all
   letters in their natural visible state — matches the end-frame of
   leave()'s entry animation so the bundle can hand off invisibly. */
#wrgsmk-wipe.is-incoming { opacity: 1; }
`;

export function injectWipeStyles() {
  if (document.getElementById('wrgsmk-wipe-styles')) return;
  const style = document.createElement('style');
  style.id = 'wrgsmk-wipe-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}
