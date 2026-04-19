/**
 * CSS for the title-wipe overlay.
 *
 * Injected once on app start so the transition works on any page without
 * requiring Webflow stylesheet changes. The text inherits color/font-family
 * from its `.wrgsmk-comission_title` Webflow class; this module handles
 * overlay geometry and neutralizes properties that would break the wipe.
 */
const CSS = `
#wrgsmk-wipe {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
#wrgsmk-wipe .wrgsmk-wipe__text {
  display: inline-block;
  white-space: nowrap;
  font-size: 100svh;
  line-height: 1;
  will-change: transform;
  transform: translateX(100vw);
  /* Override the Webflow hover transitions — overlay text must not animate
     color/letter-spacing during the wipe. */
  transition: none !important;
}
#wrgsmk-wipe .wrgsmk-wipe__text:hover {
  letter-spacing: inherit !important;
}
`;

export function injectWipeStyles() {
  if (document.getElementById('wrgsmk-wipe-styles')) return;
  const style = document.createElement('style');
  style.id = 'wrgsmk-wipe-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}
