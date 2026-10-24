import { getRecentActivity } from '../api/activity';
import { getUnreadNotifications } from '../api/notifications';
import { getRecommendations } from '../api/recommendations';
import { HOME_API_AVAILABILITY, type HomeSectionId } from '../config/home-sections';
import { parseActivityFeed } from '../schemas/activity.schema';
import { parseUnreadNotifications } from '../schemas/notifications.schema';
import { parseRecommendations } from '../schemas/recommendations.schema';
import type { HomeSource, HomeSources } from './types';

interface CreateHomeSourcesInput {
  // From resolveHomeMockSections() on the server. Ignored in a production build.
  mockSections: readonly HomeSectionId[];
  // Test seam; defaults to the real availability table.
  availability?: Readonly<Record<HomeSectionId, boolean>>;
}

const UNAVAILABLE = { kind: 'unavailable' } as const;
const real = <T>(load: (signal?: AbortSignal) => Promise<T>): HomeSource<T> => ({
  kind: 'real',
  load,
});
const demo = <T>(load: () => Promise<T>): HomeSource<T> => ({ kind: 'mock', load });

// Selection per section: real API if it exists, else demo data (local development
// only, only when listed), else unavailable (the section is hidden).
//
// The `process.env.NODE_ENV !== 'production'` check is written inline in front of every
// demo import() on purpose. Next inlines NODE_ENV, the bundler folds the branch to
// `false`, and the demo chunk is then dropped from production builds. Hoisting the
// check into a variable, or building the demo closure before the branch, would keep the
// import reachable and ship the demo data (guarded by a test and the build grep in
// specs/009-student-home/verification.md).
export function createHomeSources({
  mockSections,
  availability = HOME_API_AVAILABILITY,
}: CreateHomeSourcesInput): HomeSources {
  return {
    notifications: availability.notifications
      ? real(getUnreadNotifications)
      : process.env.NODE_ENV !== 'production' && mockSections.includes('notifications')
        ? demo(async () => {
            const { mockLoaders } = await import('../mocks');
            return parseUnreadNotifications(mockLoaders.notificationsRaw());
          })
        : UNAVAILABLE,
    activity: availability.activity
      ? real(getRecentActivity)
      : process.env.NODE_ENV !== 'production' && mockSections.includes('activity')
        ? demo(async () => {
            const { mockLoaders } = await import('../mocks');
            return parseActivityFeed(mockLoaders.activityRaw(new Date()));
          })
        : UNAVAILABLE,
    recommendations: availability.recommendations
      ? real(getRecommendations)
      : process.env.NODE_ENV !== 'production' && mockSections.includes('recommendations')
        ? demo(async () => {
            const { mockLoaders } = await import('../mocks');
            return parseRecommendations(mockLoaders.recommendationsRaw());
          })
        : UNAVAILABLE,
  };
}
