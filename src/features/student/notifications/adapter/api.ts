import { apiClient } from '@/lib/api-client';
import type { NotificationPage } from '../model/types';
import { parseNotificationPage } from './parse-page';
import { markReadAnswerSchema, parseWire, readAllAnswerSchema } from './wire';

// BE-13 (not built yet; the app is tested against the e2e fake backend). The admin endpoints
// (/admin/notifications...) have the same shape but are admin-only and are never called.

// The server accepts 1 to 100 and defaults to 20.
export const NOTIFICATIONS_PAGE_SIZE = 20;

export async function fetchNotificationPage(
  page: number,
  signal?: AbortSignal
): Promise<NotificationPage> {
  return parseNotificationPage(
    await apiClient<unknown>(
      `/api/notifications?page=${page}&page_size=${NOTIFICATIONS_PAGE_SIZE}`,
      {
        signal,
      }
    )
  );
}

// Idempotent. A 404 (missing, or not the student's) reaches the caller as an ApiError.
export async function markNotificationRead(id: number): Promise<{ id: number; isRead: boolean }> {
  const answer = parseWire(
    'mark-read',
    markReadAnswerSchema,
    await apiClient<unknown>(`/api/notifications/${id}/read`, { method: 'PATCH' })
  );
  return { id: answer.id, isRead: answer.is_read };
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return parseWire(
    'read-all',
    readAllAnswerSchema,
    await apiClient<unknown>('/api/notifications/read-all', { method: 'PATCH' })
  );
}
