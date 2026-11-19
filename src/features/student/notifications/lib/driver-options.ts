import { isTerminalStatus, pollingInterval, shouldFocusRefetch } from './polling';
import { unreadQueryOptions, type UnreadSource } from './unread-source';

// The options of the ONE observer that polls the unread count (see useUnreadCountDriver), as a
// plain builder so the rules can be tested with a QueryObserver and a controlled clock.
//
//  - `enabled` is false for an unavailable source and after a 401, 403 or 404: a disabled query
//    makes no automatic request (mount, interval or focus) but still answers refetch(), which is
//    how a manual retry resumes polling.
//  - `refetchInterval` is 60 s while the tab is visible (TanStack pauses it in a hidden tab because
//    refetchIntervalInBackground is false), and nothing while a terminal status stopped it or a
//    mark request is pending.
//  - `refetchOnWindowFocus: 'always'` requests again when the tab becomes visible again, except
//    when stopped or while marking.
export function unreadDriverOptions(source: UnreadSource, marking: boolean) {
  return {
    ...unreadQueryOptions(source),
    enabled: (current: { state: { error: unknown } }) =>
      source.kind !== 'unavailable' && !isTerminalStatus(current.state.error),
    refetchInterval: (current: { state: { error: unknown } }) =>
      pollingInterval({ terminal: isTerminalStatus(current.state.error), marking }),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: (current: { state: { error: unknown } }) =>
      shouldFocusRefetch({ terminal: isTerminalStatus(current.state.error), marking })
        ? ('always' as const)
        : false,
  };
}
