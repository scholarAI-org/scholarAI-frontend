// Keys of the notification list and its mutations. The unread count shares Home's source key
// (see lib/unread-source.ts), so the badge, the bells and Home's card read one query.
export const studentNotificationsKeys = {
  all: ['student-notifications'] as const,
  list: () => [...studentNotificationsKeys.all, 'list'] as const,
  // Prefix of every mark mutation, for useIsMutating.
  marks: () => [...studentNotificationsKeys.all, 'mark'] as const,
  mark: (id: number) => [...studentNotificationsKeys.marks(), id] as const,
  markAll: () => [...studentNotificationsKeys.marks(), 'all'] as const,
};
