import { getScholarshipDetailsHref } from '@/features/student/scholarship-discovery/lib/details-link';
import type { NotificationAction, StudentNotification } from '../model/types';

interface ActionOptions {
  // SCHOLARSHIP_DETAILS_ENABLED, passed down from the Server Component.
  detailsEnabled: boolean;
}

// The backend `action` decides everything (A4): null shows nothing; its type is looked up in
// the closed list below. A destination that is not available shows nothing too, and the card
// is otherwise unchanged. A URL coming from the backend is never followed: links are built
// from fixed routes and integer ids only.
export function resolveAction(
  notification: Pick<StudentNotification, 'action'>,
  { detailsEnabled }: ActionOptions
): NotificationAction | null {
  const action = notification.action;
  if (!action) return null;

  switch (action.type) {
    case 'open_scholarship': {
      const href =
        action.targetId === null
          ? null
          : getScholarshipDetailsHref(action.targetId, detailsEnabled);
      return href ? { href, labelKey: 'actions.viewScholarship' } : null;
    }
    case 'open_profile':
      return { href: '/student/profile', labelKey: 'actions.completeProfile' };
    // open_document_analysis: the AI document page is not built in this release.
    default:
      return null;
  }
}
