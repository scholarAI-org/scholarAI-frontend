'use client';

import { useQuery } from '@tanstack/react-query';
import type { HomeSectionId } from '@/features/student/home/config/home-sections';
import { isTerminalStatus } from '../lib/polling';
import { unreadQueryOptions, useUnreadSource } from '../lib/unread-source';

interface UnreadCountInput {
  notificationsEnabled: boolean;
  mockSections?: readonly HomeSectionId[];
}

// A PASSIVE reader of the unread count: it renders from the shared query and re-renders when
// the poller (useUnreadCountDriver) updates it, but never fetches or polls itself. One poller
// serves the badge, both bells and Home's card; many observers with an interval each would
// multiply the requests.
//
// `count` is null while the count has not loaded, and after a 401, 403 or 404 stopped it: no
// number is ever invented or kept once the source is known to be unavailable (FR-044, FR-045).
export function useUnreadCount({ notificationsEnabled, mockSections = [] }: UnreadCountInput) {
  const source = useUnreadSource({ notificationsEnabled, mockSections });
  const query = useQuery({ ...unreadQueryOptions(source), enabled: false });
  const stopped = isTerminalStatus(query.error);
  return { count: stopped ? null : (query.data?.unreadCount ?? null), stopped };
}
