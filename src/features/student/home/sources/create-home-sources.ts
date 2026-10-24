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

// Selection per section: real API if it exists, else demo data (local development
// only, only when listed), else unavailable (the section is hidden).
export function createHomeSources({
  mockSections,
  availability = HOME_API_AVAILABILITY,
}: CreateHomeSourcesInput): HomeSources {
  // Read at call time. Next inlines NODE_ENV in builds, so the demo branch is dead
  // code (and its chunk is dropped) in production.
  const demoAllowed = process.env.NODE_ENV !== 'production';

  function pick<T>(
    section: HomeSectionId,
    real: (signal?: AbortSignal) => Promise<T>,
    demo: () => Promise<T>
  ): HomeSource<T> {
    if (availability[section]) return { kind: 'real', load: real };
    if (demoAllowed && mockSections.includes(section)) return { kind: 'mock', load: demo };
    return { kind: 'unavailable' };
  }

  return {
    notifications: pick('notifications', getUnreadNotifications, async () => {
      const { mockLoaders } = await import('../mocks');
      return parseUnreadNotifications(mockLoaders.notificationsRaw());
    }),
    activity: pick('activity', getRecentActivity, async () => {
      const { mockLoaders } = await import('../mocks');
      return parseActivityFeed(mockLoaders.activityRaw(new Date()));
    }),
    recommendations: pick('recommendations', getRecommendations, async () => {
      const { mockLoaders } = await import('../mocks');
      return parseRecommendations(mockLoaders.recommendationsRaw());
    }),
  };
}
