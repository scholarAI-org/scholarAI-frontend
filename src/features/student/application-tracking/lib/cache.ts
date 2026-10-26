import type { TrackedItem, TrackedList, TrackingStatus } from '../types';

// Pure transforms over the cached tracked list, used for optimistic updates and
// their rollback. Each returns a new list and never touches the network.

export interface RemovedItem {
  item: TrackedItem;
  index: number;
}

// A blank note is "no note", matching how the backend clears on '' or null.
export const normalizeNotes = (notes: string): string | null =>
  notes.trim() === '' ? null : notes;

const mapItem = (list: TrackedList, id: number, change: (item: TrackedItem) => TrackedItem) => ({
  ...list,
  items: list.items.map((item) => (item.id === id ? change(item) : item)),
});

// Timestamps are left alone: the client never invents the backend's time.
export const setItemStatus = (list: TrackedList, id: number, status: TrackingStatus) =>
  mapItem(list, id, (item) => ({ ...item, status }));

export const setItemNotes = (list: TrackedList, id: number, notes: string | null) =>
  mapItem(list, id, (item) => ({ ...item, notes }));

export function removeItem(
  list: TrackedList,
  id: number
): { list: TrackedList; removed: RemovedItem | null } {
  const index = list.items.findIndex((item) => item.id === id);
  if (index === -1) return { list, removed: null };
  return {
    list: { ...list, items: list.items.filter((item) => item.id !== id) },
    removed: { item: list.items[index], index },
  };
}

// Puts a removed row back at its exact position (clamped if the list shrank).
// A row that is already present is left alone.
export function restoreItem(list: TrackedList, removed: RemovedItem): TrackedList {
  if (list.items.some((item) => item.id === removed.item.id)) return list;
  const items = [...list.items];
  items.splice(Math.min(removed.index, items.length), 0, removed.item);
  return { ...list, items };
}

// Roll back only if the row still shows the value this mutation applied. A later
// change to the same row (another status, another note) is never overwritten.
export function rollbackStatus(
  list: TrackedList,
  id: number,
  attempted: TrackingStatus,
  previous: TrackingStatus
): TrackedList {
  const current = list.items.find((item) => item.id === id);
  return current && current.status === attempted ? setItemStatus(list, id, previous) : list;
}

export function rollbackNotes(
  list: TrackedList,
  id: number,
  attempted: string | null,
  previous: string | null
): TrackedList {
  const current = list.items.find((item) => item.id === id);
  return current && current.notes === attempted ? setItemNotes(list, id, previous) : list;
}
