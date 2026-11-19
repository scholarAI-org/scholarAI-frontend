import { ApiError } from '@/lib/api-client';

// About once a minute while the tab is visible (the brief).
export const POLL_INTERVAL_MS = 60_000;

// A count request that answers one of these will not get better by asking again: polling and
// focus refetching stop until a manual retry succeeds or the page is reloaded.
export const TERMINAL_STATUSES: readonly number[] = [401, 403, 404];

export const isTerminalStatus = (error: unknown): boolean =>
  error instanceof ApiError && TERMINAL_STATUSES.includes(error.status ?? 0);

interface PollState {
  terminal: boolean;
  // A mark request is pending: a poll answer requested before it settled could overwrite the
  // optimistic number, so interval and focus refetches wait (the skipped tick is not queued).
  marking: boolean;
}

export const pollingInterval = ({ terminal, marking }: PollState): number | false =>
  terminal || marking ? false : POLL_INTERVAL_MS;

export const shouldFocusRefetch = ({ terminal, marking }: PollState): boolean =>
  !terminal && !marking;
