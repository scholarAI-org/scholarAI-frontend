import { z } from 'zod';
import { parseWith } from './contract-error';

// REQUESTED contract (backend ask: student notifications unread count).
// See specs/009-student-home/contracts/requested-backend.openapi.yaml.
const unreadCountSchema = z.object({ unread_count: z.number().int().min(0) });

export interface UnreadNotifications {
  unreadCount: number;
}

export function parseUnreadNotifications(raw: unknown): UnreadNotifications {
  return { unreadCount: parseWith('notifications', unreadCountSchema, raw).unread_count };
}
