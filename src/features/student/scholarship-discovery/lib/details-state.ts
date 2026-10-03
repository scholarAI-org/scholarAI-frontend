import { ApiError } from '@/lib/api-client';
import { isDiscoveryCardShape } from '../adapters/scholarship';
import type { ScholarshipDetailsResponse } from '../types';

// Route IDs must be canonical positive integers: "7", not "07", "7.0", "-7",
// "0" or "abc". Anything else shows invalidId and never reaches the API.
export function parseScholarshipId(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

export type DetailsErrorReason = 'unauthorized' | 'forbidden' | 'notFound' | 'generic';

export type DetailsViewState =
  | { kind: 'invalid' }
  | { kind: 'loading' }
  | { kind: 'error'; reason: DetailsErrorReason }
  | { kind: 'ready'; data: ScholarshipDetailsResponse };

export function getDetailsErrorReason(error: unknown): DetailsErrorReason {
  if (!(error instanceof ApiError)) return 'generic';
  if (error.status === 401) return 'unauthorized';
  if (error.status === 403) return 'forbidden';
  if (error.status === 404) return 'notFound';
  return 'generic';
}

interface DetailsStateInput {
  id: number | null;
  data: unknown;
  error: unknown;
  isFetching: boolean;
}

// One place decides what the details route shows. Cached data stays visible
// while a background refetch fails; a malformed payload is a generic error; a
// retry after an error shows loading again.
export function getDetailsViewState({
  id,
  data,
  error,
  isFetching,
}: DetailsStateInput): DetailsViewState {
  if (id === null) return { kind: 'invalid' };
  // Revoked access and removed records must replace a previously cached summary.
  if (!isFetching && error instanceof ApiError && [401, 403, 404].includes(error.status ?? 0)) {
    return { kind: 'error', reason: getDetailsErrorReason(error) };
  }
  if (
    isDiscoveryCardShape(data) &&
    data.id === id &&
    typeof (data as ScholarshipDetailsResponse).source === 'string' &&
    ['manual', 'scraped'].includes((data as ScholarshipDetailsResponse).ingestion_type)
  ) {
    return { kind: 'ready', data: data as ScholarshipDetailsResponse };
  }
  if (isFetching) return { kind: 'loading' };
  if (data !== undefined) return { kind: 'error', reason: 'generic' };
  return error && !isFetching
    ? { kind: 'error', reason: getDetailsErrorReason(error) }
    : { kind: 'loading' };
}
