import type { ActivityItem } from '../schemas/activity.schema';
import type { UnreadNotifications } from '../schemas/notifications.schema';
import type { RecommendationsResult } from '../schemas/recommendations.schema';

// `load` always resolves to validated data, for real and demo sources alike.
export type HomeSource<T> =
  | { kind: 'real'; load: (signal?: AbortSignal) => Promise<T> }
  | { kind: 'mock'; load: (signal?: AbortSignal) => Promise<T> }
  | { kind: 'unavailable' };

export interface HomeSources {
  notifications: HomeSource<UnreadNotifications>;
  activity: HomeSource<ActivityItem[]>;
  recommendations: HomeSource<RecommendationsResult>;
}
