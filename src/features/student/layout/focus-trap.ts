export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Index to move focus to when Tab would leave the dialog; null lets the browser move it.
export function getFocusTrapTarget(activeIndex: number, count: number, backwards: boolean) {
  if (count === 0) return null;
  if (activeIndex === -1) return backwards ? count - 1 : 0;
  if (backwards) return activeIndex === 0 ? count - 1 : null;
  return activeIndex === count - 1 ? 0 : null;
}
