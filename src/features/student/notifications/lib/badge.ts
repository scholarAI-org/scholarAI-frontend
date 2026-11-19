export const BADGE_CAP = 99;

// What the sidebar pill shows: nothing for no count, 0 or a negative number; the number from
// 1 to 99; "99+" above. The caller decides what to do with an empty string (render nothing).
export function formatBadge(count: number | null | undefined): string {
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 1) return '';
  const whole = Math.floor(count);
  return whole > BADGE_CAP ? `${BADGE_CAP}+` : String(whole);
}
