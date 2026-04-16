/**
 * CircleType text init
 * Wraps #circletext into a circle using the CircleType library.
 *
 * Expects global: CircleType
 */
export function initCircleText() {
  function init() {
    const el = document.getElementById('circletext');
    if (el && window.CircleType) {
      new CircleType(el);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Restore after BFCache navigation
  window.addEventListener('pageshow', init);
}
