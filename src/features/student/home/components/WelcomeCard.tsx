'use client';

import { useId } from 'react';
import { Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getStudentInitial } from '@/features/student/layout/student-identity';
import { formatTodayLabel } from '../lib/today';
import { toDisplayPercent } from '../lib/unlock';
import { ProfileCompletionBar } from './ProfileCompletionBar';
import { SectionError } from './SectionError';
import { Skeleton } from './Skeleton';

export type CompletionView =
  | { state: 'loading' }
  | { state: 'error'; onRetry: () => void }
  | { state: 'ready'; percent: number };

interface WelcomeCardProps {
  displayName: string;
  firstName: string | null;
  // Null until the client has mounted: the date is the student's local day, so it
  // is never rendered on the server.
  today: Date | null;
  completion: CompletionView;
}

// Figma 2353:5389 (desktop): identity at the start, profile completion at the end.
export function WelcomeCard({ displayName, firstName, today, completion }: WelcomeCardProps) {
  const t = useTranslations('StudentHome');
  const locale = useLocale();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-6 rounded-2xl border border-gray-300 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-700 text-xl text-white"
        >
          {getStudentInitial(displayName)}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <h2 id={headingId} className="text-xl font-bold text-[#274383]">
            {firstName ? t('welcome.title', { name: firstName }) : t('welcome.titleNoName')}
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-[#b5b5b5]">
            <Clock aria-hidden className="size-3.5 shrink-0" />
            {today ? (
              <span>{t('welcome.today', { date: formatTodayLabel(today, locale) })}</span>
            ) : (
              <Skeleton kind="date" className="h-4 w-40" />
            )}
          </p>
        </div>
      </div>

      <div className="w-full sm:max-w-64">
        {completion.state === 'loading' ? (
          <Skeleton kind="completion" className="h-10 w-full" />
        ) : completion.state === 'error' ? (
          <SectionError message={t('welcome.completionError')} onRetry={completion.onRetry} />
        ) : (
          <ProfileCompletionBar percent={toDisplayPercent(completion.percent)} />
        )}
      </div>
    </section>
  );
}
