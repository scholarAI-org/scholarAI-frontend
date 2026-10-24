'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getStudentDisplayName } from '@/features/student/layout/student-identity';
import { useProfileCompletionQuery } from '../hooks/useHomeQueries';
import { useToday } from '../hooks/useToday';
import { useUnauthorizedRedirect } from '../hooks/useUnauthorizedRedirect';
import { firstName } from '../lib/identity';
import { getSectionState } from '../lib/section-state';
import { WelcomeCard, type CompletionView } from './WelcomeCard';

export function StudentHomePage() {
  const tLayout = useTranslations('StudentLayout');
  const { user } = useAuth();
  const today = useToday();
  const profile = useProfileCompletionQuery();

  useUnauthorizedRedirect([profile]);

  const displayName = getStudentDisplayName(user, tLayout('identity.fallbackName'));
  const completionState = getSectionState([profile]);
  const completion: CompletionView =
    completionState === 'error'
      ? { state: 'error', onRetry: () => void profile.refetch() }
      : completionState === 'ready' && typeof profile.data === 'number'
        ? { state: 'ready', percent: profile.data }
        : { state: 'loading' };

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-6">
      <WelcomeCard
        displayName={displayName}
        firstName={firstName(user?.name)}
        today={today}
        completion={completion}
      />
    </div>
  );
}
