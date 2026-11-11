import { ApiError } from '@/lib/api-client';

// Route IDs must be canonical positive integers: "7", not "07", "7.0", "-7",
// "0" or "abc". Anything else is the same not-found state and never reaches
// the API.
export function parseRouteId(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && String(id) === raw ? id : null;
}

export type DetailsErrorReason = 'unauthorized' | 'forbidden' | 'generic';

// Works for either details endpoint: both answer with a numeric id.
type WithId = { id: number };

export type DetailsViewState<T extends WithId = WithId> =
  | { kind: 'notFound' }
  | { kind: 'loading' }
  | { kind: 'error'; reason: DetailsErrorReason }
  | { kind: 'ready'; data: T };

function errorReason(error: unknown): DetailsErrorReason {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'unauthorized';
    if (error.status === 403) return 'forbidden';
  }
  return 'generic';
}

interface DetailsStateInput<T extends WithId> {
  id: number | null;
  data: T | undefined;
  error: unknown;
  isFetching: boolean;
}

// One place decides what the details route shows. The backend answers the same
// 404 for a missing and for a not-visible scholarship, and an invalid id never
// leaves the browser: all three are one not-found state. Cached data stays
// visible while a background refetch fails, but revoked access and removed
// records replace it.
export function getDetailsViewState<T extends WithId>({
  id,
  data,
  error,
  isFetching,
}: DetailsStateInput<T>): DetailsViewState<T> {
  if (id === null) return { kind: 'notFound' };
  if (!isFetching && error instanceof ApiError) {
    if (error.status === 404) return { kind: 'notFound' };
    if (error.status === 401 || error.status === 403) {
      return { kind: 'error', reason: errorReason(error) };
    }
  }
  if (data !== undefined) {
    return data.id === id ? { kind: 'ready', data } : { kind: 'error', reason: 'generic' };
  }
  if (isFetching) return { kind: 'loading' };
  return error ? { kind: 'error', reason: errorReason(error) } : { kind: 'loading' };
}
