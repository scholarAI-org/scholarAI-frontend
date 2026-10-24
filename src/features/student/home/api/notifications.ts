import { apiClient } from '@/lib/api-client';
import {
  parseUnreadNotifications,
  type UnreadNotifications,
} from '../schemas/notifications.schema';

// REQUESTED endpoint (backend ask: student notifications unread count). Unreachable
// until HOME_API_AVAILABILITY.notifications is set to true.
export async function getUnreadNotifications(signal?: AbortSignal): Promise<UnreadNotifications> {
  return parseUnreadNotifications(
    await apiClient<unknown>('/api/notifications/unread-count', { signal })
  );
}
