import { ApiError } from '@/lib/api-client';

export type SectionState = 'hidden' | 'loading' | 'error' | 'empty' | 'ready';

export interface QueryLike {
  status: 'pending' | 'error' | 'success';
  error?: unknown;
}

const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401;

// One state per section from the queries it needs. A 401 is not shown as an error:
// the session re-check redirects to login, so the section keeps loading meanwhile.
export function getSectionState(
  queries: readonly QueryLike[],
  options: { hidden?: boolean; empty?: boolean } = {}
): SectionState {
  if (options.hidden) return 'hidden';
  if (queries.some((q) => q.status === 'error' && !isUnauthorized(q.error))) return 'error';
  if (queries.some((q) => q.status === 'pending' || q.status === 'error')) return 'loading';
  return options.empty ? 'empty' : 'ready';
}

export const shouldInvalidateSession = (queries: readonly QueryLike[]): boolean =>
  queries.some((q) => q.status === 'error' && isUnauthorized(q.error));

// Retry refetches only what failed; healthy queries are left alone.
export function retryFailed(
  queries: readonly (QueryLike & { refetch: () => Promise<unknown> })[]
): Promise<unknown[]> {
  return Promise.all(queries.filter((q) => q.status === 'error').map((q) => q.refetch()));
}
