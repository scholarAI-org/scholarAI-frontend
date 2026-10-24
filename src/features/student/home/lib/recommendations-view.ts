import type { ScholarshipDiscoveryCard } from '@/features/student/scholarship-discovery/types';
import { RECOMMENDATIONS_LIST_LIMIT } from '../constants';
import type { QueryResult } from './home-summary';
import { getSectionState } from './section-state';
import { isRecommendationsUnlocked } from './unlock';

export type RecommendationsState = 'loading' | 'locked' | 'error' | 'empty' | 'ready';

// Locked below 70% completion and whenever completion is unknown or failed to load
// (a lock never opens on unknown data); loading while completion loads. Once unlocked
// the panel shows the newest published scholarships, capped at three.
export function buildRecommendationsView({
  profile,
  latest,
}: {
  profile: QueryResult<number>;
  latest: QueryResult<readonly ScholarshipDiscoveryCard[]>;
}): { state: RecommendationsState; items: ScholarshipDiscoveryCard[] } {
  const profileState = getSectionState([profile]);
  if (profileState === 'loading') return { state: 'loading', items: [] };
  if (profileState === 'error' || !isRecommendationsUnlocked(profile.data)) {
    return { state: 'locked', items: [] };
  }

  const items = (latest.data ?? []).slice(0, RECOMMENDATIONS_LIST_LIMIT);
  const state = getSectionState([latest], { empty: items.length === 0 });
  return { state: state === 'hidden' ? 'loading' : state, items };
}
