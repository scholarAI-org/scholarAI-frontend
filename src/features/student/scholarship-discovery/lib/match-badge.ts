import type { ScholarshipMatchInfo } from '../types';

export interface MatchBadgeDisplay {
  level?: 'high' | 'medium' | 'low';
  score?: number;
}

// Shows only authoritative backend match data; returns null when there is none.
// Nothing is estimated or defaulted in the browser.
export function getMatchBadgeDisplay(
  match: ScholarshipMatchInfo | null | undefined
): MatchBadgeDisplay | null {
  if (!match) return null;
  const level =
    match.level === 'high' || match.level === 'medium' || match.level === 'low'
      ? match.level
      : undefined;
  const score =
    typeof match.score === 'number' && Number.isFinite(match.score)
      ? Math.round(match.score)
      : undefined;
  return level || score !== undefined ? { level, score } : null;
}
