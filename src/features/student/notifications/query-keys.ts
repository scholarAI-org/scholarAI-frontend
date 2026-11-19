// Keys of the notification list and its mutations. The unread count shares Home's source key
// (see lib/unread-source.ts), so the badge, the bells and Home's card read one query.
export const studentNotificationsKeys = {
  all: ['student-notifications'] as const,
  list: () => [...studentNotificationsKeys.all, 'list'] as const,
  // Prefix of every mark mutation, for isMutating / useIsMutating.
  marks: () => [...studentNotificationsKeys.all, 'mark'] as const,
  markOne: () => [...studentNotificationsKeys.marks(), 'one'] as const,
  markAll: () => [...studentNotificationsKeys.marks(), 'all'] as const,
};
