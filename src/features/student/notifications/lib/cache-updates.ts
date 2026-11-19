import type { InfiniteData } from '@tanstack/react-query';
import type { NotificationPage, StudentNotification } from '../model/types';

// Pure updaters for the list cache and the unread count, used by the optimistic mutations.
// Every one tolerates a missing cache entry: the list uses gcTime 0, so it can be gone when
// an action has already navigated away, and the count may not have loaded.

export type NotificationPages = InfiniteData<NotificationPage, number>;

export interface UnreadCountData {
  unreadCount: number;
}

const mapItems = (
  data: NotificationPages,
  fn: (item: StudentNotification) => StudentNotification
): NotificationPages => ({
  ...data,
  pages: data.pages.map((page) => ({ ...page, items: page.items.map(fn) })),
});

export function findNotification(
  data: NotificationPages | undefined,
  id: number
): StudentNotification | undefined {
  for (const page of data?.pages ?? []) {
    const found = page.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

// Every loaded notification, once: the first copy of an id wins (new items can shift pages).
export function mergePages(pages: readonly NotificationPage[]): StudentNotification[] {
  const seen = new Set<number>();
  const merged: StudentNotification[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

export const hasUnread = (data: NotificationPages | undefined): boolean =>
  (data?.pages ?? []).some((page) => page.items.some((item) => !item.isRead));

// Flips one unread notification to read. `flipped` is false when there was nothing to change
// (not loaded, or already read), so the caller leaves the count alone.
export function markReadInPages(
  data: NotificationPages | undefined,
  id: number
): { data: NotificationPages | undefined; flipped: boolean } {
  const target = findNotification(data, id);
  if (!data || !target || target.isRead) return { data, flipped: false };
  return {
    data: mapItems(data, (item) => (item.id === id ? { ...item, isRead: true } : item)),
    flipped: true,
  };
}

// Flips every loaded unread notification; `flippedIds` is exactly what an error must restore.
export function markAllInPages(data: NotificationPages | undefined): {
  data: NotificationPages | undefined;
  flippedIds: number[];
} {
  if (!data) return { data, flippedIds: [] };
  const flippedIds: number[] = [];
  const next = mapItems(data, (item) => {
    if (item.isRead) return item;
    flippedIds.push(item.id);
    return { ...item, isRead: true };
  });
  return { data: flippedIds.length > 0 ? next : data, flippedIds };
}

// The inverse of the two functions above, for exactly the ids they flipped.
export function restoreUnread(
  data: NotificationPages | undefined,
  ids: readonly number[]
): NotificationPages | undefined {
  if (!data || ids.length === 0) return data;
  const restore = new Set(ids);
  return mapItems(data, (item) => (restore.has(item.id) ? { ...item, isRead: false } : item));
}

// A 404 on a mark means the notification is already gone: drop it from the loaded list.
export function removeFromPages(
  data: NotificationPages | undefined,
  id: number
): NotificationPages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => item.id !== id),
    })),
  };
}

// The unread count never goes below 0 and is not touched when it has not loaded.
export function adjustCount(
  count: UnreadCountData | undefined,
  delta: number
): UnreadCountData | undefined {
  if (!count) return count;
  return { unreadCount: Math.max(0, count.unreadCount + delta) };
}
