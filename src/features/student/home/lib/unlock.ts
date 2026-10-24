import { RECOMMENDATIONS_UNLOCK_PERCENT } from '../constants';

// Unknown or unmeasurable completion never unlocks. The test uses the unrounded
// value, so 69.6% stays locked even though it displays as 70%.
export function isRecommendationsUnlocked(percent: number | null | undefined): boolean {
  return (
    typeof percent === 'number' &&
    Number.isFinite(percent) &&
    percent >= RECOMMENDATIONS_UNLOCK_PERCENT
  );
}

// Whole number in 0..100 for display and the progress bar.
export function toDisplayPercent(percent: number | null | undefined): number {
  if (typeof percent !== 'number' || !Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}
