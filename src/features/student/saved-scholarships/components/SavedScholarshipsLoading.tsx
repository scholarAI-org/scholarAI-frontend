'use client';

import { useTranslations } from 'next-intl';
import { ScholarshipSkeletons } from '@/features/student/scholarship-discovery/components/ScholarshipSkeletons';

// Loading placeholder. Count is announced as unknown via the header's absence
// of a count line; a status region announces the state politely so screen
// readers do not read "zero" during the pending request.
export function SavedScholarshipsLoading() {
  const t = useTranslations('StudentSavedScholarships');
  return (
    <div data-testid="saved-loading">
      <span className="sr-only" role="status" aria-live="polite">
        {t('loading')}
      </span>
      <ScholarshipSkeletons view="grid" />
    </div>
  );
}
