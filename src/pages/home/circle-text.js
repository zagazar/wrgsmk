/**
 * CircleType text init
 * Wraps #circletext into a circle using the CircleType library.
 *
 * Expects global: CircleType
 * Returns: destroy() that removes the pageshow listener.
 */
export function initCircleText() {
  const apply = () => {
    const el = document.getElementById('circletext');
    if (el && window.CircleType) new CircleType(el);
  };

  apply();
  window.addEventListener('pageshow', apply);

  return function destroy() {
    window.removeEventListener('pageshow', apply);
  };
}
