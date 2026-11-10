import { parseDiscoveryQuery } from './discovery-query-state';
import type { DiscoveryQuery } from '../types';

// Discovery writes the URL with history.pushState/replaceState. Since Next.js 16.4
// useSearchParams picks that change up in a later render, not in the click that
// made it, so the URL alone lags one render behind the user. Two problems follow:
// a controlled checkbox snaps back until the URL catches up, and a second click in
// that window is computed from the stale query and drops the first change.
// The hook therefore keeps the query it just navigated to as "pending" and shows
// it until useSearchParams reports that same URL.

export interface PendingDiscoveryQuery {
  /** URLSearchParams string of the URL the navigation wrote. */
  targetKey: string;
  query: DiscoveryQuery;
}

export function searchKeyOf(href: string): string {
  const index = href.indexOf('?');
  return new URLSearchParams(index === -1 ? '' : href.slice(index + 1)).toString();
}

export function pendingFromHref(href: string): PendingDiscoveryQuery {
  const targetKey = searchKeyOf(href);
  return { targetKey, query: parseDiscoveryQuery(new URLSearchParams(targetKey)) };
}

/** The pending query wins until the URL reports its target; then the URL is the truth again. */
export function resolveDiscoveryQuery(
  urlKey: string,
  urlQuery: DiscoveryQuery,
  pending: PendingDiscoveryQuery | null
): DiscoveryQuery {
  return pending && pending.targetKey !== new URLSearchParams(urlKey).toString()
    ? pending.query
    : urlQuery;
}
