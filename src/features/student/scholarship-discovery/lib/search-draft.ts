import { normalizeSearchText } from './discovery-query-state';

// Keep what the student is typing while it still means the URL's search (e.g. a
// trailing space); otherwise take the URL value, as after Back/Forward.
export const resolveDraftFromUrl = (draft: string, urlSearch: string | undefined) =>
  normalizeSearchText(draft) === urlSearch ? draft : (urlSearch ?? '');
