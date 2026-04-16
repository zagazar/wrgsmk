/**
 * Context Menu Guard (right-click disable)
 *
 * Simple deterrent against casual image downloads.
 */
export function initContextGuard() {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  }, false);
}
