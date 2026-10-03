import { ApiError } from '@/lib/api-client';
import type { DiscoveryQuery, ScholarshipDiscoveryResponse } from '../types';
import { getOutOfRangeTarget } from './pagination';

export type DiscoveryErrorReason = 'unauthorized' | 'forbidden' | 'validation' | 'generic';

export type DiscoveryResultsState =
  | { kind: 'loading' }
  | { kind: 'error'; reason: DiscoveryErrorReason }
  | { kind: 'outOfRange'; lastPage: number }
  | { kind: 'empty'; variant: 'noScholarships' | 'noMatches' }
  | { kind: 'results'; updating: boolean; refreshError: DiscoveryErrorReason | null };

export function getDiscoveryErrorReason(error: unknown): DiscoveryErrorReason {
  if (!(error instanceof ApiError)) return 'generic';
  if (error.status === 401) return 'unauthorized';
  if (error.status === 403) return 'forbidden';
  if (error.status === 422) return 'validation';
  return 'generic';
}

export const hasActiveFilters = (query: DiscoveryQuery) =>
  query.academicLevels.length > 0 ||
  query.fundingTypes.length > 0 ||
  query.opportunityTypes.length > 0 ||
  query.countries.length > 0;

export const hasActiveSearchOrFilters = (query: DiscoveryQuery) =>
  Boolean(query.search) || hasActiveFilters(query);

export function isDiscoveryResponse(data: unknown): data is ScholarshipDiscoveryResponse {
  if (!data || typeof data !== 'object') return false;
  const response = data as Record<string, unknown>;
  return (
    Array.isArray(response.items) &&
    [response.total, response.page, response.total_pages].every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )
  );
}

interface ResultsStateInput {
  query: DiscoveryQuery;
  data: unknown;
  error: unknown;
  isFetching: boolean;
  isPlaceholderData: boolean;
}

// One place decides what the results area shows. Errors never masquerade as empty
// results, and previous results stay visible while a new page or query loads.
export function getDiscoveryResultsState({
  query,
  data,
  error,
  isFetching,
  isPlaceholderData,
}: ResultsStateInput): DiscoveryResultsState {
  if (data === undefined || data === null) {
    return error ? { kind: 'error', reason: getDiscoveryErrorReason(error) } : { kind: 'loading' };
  }
  if (!isDiscoveryResponse(data)) return { kind: 'error', reason: 'generic' };
  if (isPlaceholderData) {
    return data.items.length > 0
      ? { kind: 'results', updating: true, refreshError: null }
      : { kind: 'loading' };
  }
  const lastPage = getOutOfRangeTarget(query.page, data.total_pages);
  if (lastPage !== null) return { kind: 'outOfRange', lastPage };
  if (data.items.length === 0) {
    return {
      kind: 'empty',
      variant: hasActiveSearchOrFilters(query) ? 'noMatches' : 'noScholarships',
    };
  }
  return {
    kind: 'results',
    updating: isFetching,
    refreshError: error && !isFetching ? getDiscoveryErrorReason(error) : null,
  };
}
