import type { TrackedList } from '../types';

export type SectionState = 'loading' | 'error' | 'ready';

// Data already in the cache wins: a failed background refetch keeps showing the
// last good list instead of blanking the section.
export function getSectionState(query: { data: unknown; isError: boolean }): SectionState {
  if (query.data !== undefined) return 'ready';
  return query.isError ? 'error' : 'loading';
}

export type ListView = 'loading' | 'error' | 'empty' | 'list';

// The empty state is only for a confirmed empty list. If the backend returned
// rows but none could be read, that is a contract problem, not "nothing tracked".
export function getListView(state: SectionState, list: TrackedList | undefined): ListView {
  if (state === 'loading') return 'loading';
  if (state === 'error' || !list) return 'error';
  if (list.items.length > 0) return 'list';
  return list.skipped > 0 ? 'error' : 'empty';
}
