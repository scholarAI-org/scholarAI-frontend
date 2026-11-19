import { ApiError } from '@/lib/api-client';

// Pure decisions of the notification page, kept out of the component so they can be tested.

// The next page to request, or undefined after the last one. A page whose items were all skipped
// still counts as a page, so "Load more" stays until the server's last page.
export const getNextPageNumber = (last: {
  page: number;
  totalPages: number;
}): number | undefined => (last.page < last.totalPages ? last.page + 1 : undefined);

export type ListView = 'loading' | 'error' | 'empty' | 'list';

interface ListState {
  // The student's clock is known (false on the server and during hydration).
  clockReady: boolean;
  isPending: boolean;
  isError: boolean;
  hasData: boolean;
  // Notifications that are renderable (skipped ones are not counted).
  itemCount: number;
  hasNextPage: boolean;
}

// loading: before the first answer. error: the first page failed (a later page failing keeps
// the list). empty: the LAST page is loaded and nothing is renderable, never for a pending or
// failed request, and never while more pages may still hold renderable items.
export function getListView(state: ListState): ListView {
  if (state.isPending || !state.clockReady) return 'loading';
  if (state.isError && !state.hasData) return 'error';
  if (state.itemCount === 0 && !state.hasNextPage) return 'empty';
  return 'list';
}

// A 401 from any notification request re-checks the session (see useSessionRecheck).
export const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;
