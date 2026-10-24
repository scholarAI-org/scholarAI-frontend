'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getStudentDisplayName } from '@/features/student/layout/student-identity';
import {
  useHomeSummary,
  useLatestScholarshipsQuery,
  useProfileCompletionQuery,
} from '../hooks/useHomeQueries';
import { useToday } from '../hooks/useToday';
import { useUnauthorizedRedirect } from '../hooks/useUnauthorizedRedirect';
import { firstName } from '../lib/identity';
import { buildRecommendationsView } from '../lib/recommendations-view';
import { getSectionState, retryFailed } from '../lib/section-state';
import { isRecommendationsUnlocked } from '../lib/unlock';
import type { SectionState } from '../lib/section-state';
import { LatestRecommendations, type RecommendationsView } from './LatestRecommendations';
import { StatCards } from './StatCards';
import type { StatView } from './StatCard';
import { UpcomingDeadlines, type DeadlinesView } from './UpcomingDeadlines';
import { WelcomeCard, type CompletionView } from './WelcomeCard';

interface StudentHomePageProps {
  // From server-only flags, read in the route (never hard-coded here).
  detailsEnabled?: boolean;
  savedEnabled?: boolean;
}

const toStatView = (
  part: { state: SectionState; value: number },
  onRetry: () => void,
  href?: string | null
): StatView =>
  part.state === 'error'
    ? { state: 'error', onRetry }
    : part.state === 'ready'
      ? { state: 'ready', value: part.value, href }
      : { state: 'loading' };

export function StudentHomePage({
  detailsEnabled = false,
  savedEnabled = false,
}: StudentHomePageProps) {
  const tLayout = useTranslations('StudentLayout');
  const { user } = useAuth();
  const today = useToday();
  const profile = useProfileCompletionQuery();
  const { summary, saved, tracked } = useHomeSummary(today);

  const latest = useLatestScholarshipsQuery(isRecommendationsUnlocked(profile.data));

  useUnauthorizedRedirect([profile, saved, tracked, latest]);

  const displayName = getStudentDisplayName(user, tLayout('identity.fallbackName'));

  const completionState = getSectionState([profile]);
  const completion: CompletionView =
    completionState === 'error'
      ? { state: 'error', onRetry: () => void profile.refetch() }
      : completionState === 'ready' && typeof profile.data === 'number'
        ? { state: 'ready', percent: profile.data }
        : { state: 'loading' };

  const retryDependent = () => void retryFailed([saved, tracked]);
  const deadlines: DeadlinesView =
    summary.deadlines.state === 'error'
      ? { state: 'error', onRetry: retryDependent }
      : summary.deadlines.state === 'empty'
        ? { state: 'empty' }
        : summary.deadlines.state === 'ready'
          ? { state: 'ready', items: summary.deadlines.items }
          : { state: 'loading' };

  const recommendationsView = buildRecommendationsView({ profile, latest });
  const recommendations: RecommendationsView =
    recommendationsView.state === 'error'
      ? { state: 'error', onRetry: () => void latest.refetch() }
      : recommendationsView.state === 'ready'
        ? { state: 'ready', items: recommendationsView.items }
        : { state: recommendationsView.state };

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-6">
      <WelcomeCard
        displayName={displayName}
        firstName={firstName(user?.name)}
        today={today}
        completion={completion}
      />
      <StatCards
        saved={toStatView(
          summary.saved,
          () => void saved.refetch(),
          savedEnabled ? '/student/saved' : null
        )}
        inProgress={toStatView(summary.inProgress, () => void tracked.refetch())}
        upcoming={toStatView(summary.upcoming, retryDependent)}
      />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)]">
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-1">
          <UpcomingDeadlines view={deadlines} detailsEnabled={detailsEnabled} />
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <LatestRecommendations
            view={recommendations}
            detailsEnabled={detailsEnabled}
            today={today}
          />
        </div>
      </div>
    </div>
  );
}
