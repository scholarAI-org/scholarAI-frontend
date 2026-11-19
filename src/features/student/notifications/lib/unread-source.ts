'use client';

// The ONLY file of this feature that touches Home's notifications-source abstraction for data
// (plan: three allow-listed files). The unread count is not fetched by a second client: it is
// Home's `notifications` source (GET /api/notifications/unread-count, validated by Home's
// parseUnreadNotifications), made `real` by the server-only notifications feature flag.
// The driver, the badge, the bells and Home's stat card all read this one query.

import type { HomeSectionId } from '@/features/student/home/config/home-sections';
import { useHomeSources } from '@/features/student/home/hooks/useHomeSources';
import { sourceQueryOptions } from '@/features/student/home/lib/source-query';
import { studentHomeKeys } from '@/features/student/home/query-keys';
import type { HomeSource } from '@/features/student/home/sources/types';
import type { UnreadNotifications } from '@/features/student/home/schemas/notifications.schema';

export type UnreadSource = HomeSource<UnreadNotifications>;

interface UnreadSourceInput {
  // The server flag, passed down as a prop (never read in the browser).
  notificationsEnabled: boolean;
  // From resolveHomeMockSections() on the server; ignored in a production build.
  mockSections?: readonly HomeSectionId[];
}

export function useUnreadSource({
  notificationsEnabled,
  mockSections = [],
}: UnreadSourceInput): UnreadSource {
  return useHomeSources(mockSections, { notificationsEnabled }).notifications;
}

// The query key of the real source. The optimistic updates write to it directly.
export const unreadCountQueryKey = () => studentHomeKeys.source('notifications', 'real');

// Home's own options for this section (key ends with the source kind, an unavailable source
// never runs, no retry on 401/403/404/422). The driver adds polling on top of them.
export const unreadQueryOptions = (source: UnreadSource) =>
  sourceQueryOptions('notifications', source);
