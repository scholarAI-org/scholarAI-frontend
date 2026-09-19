'use client';

import { Clock3, GraduationCap, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDashboardStatistics } from '../hooks/useDashboardStatistics';
import { formatDashboardNumber } from '../lib/formatters';
import { DashboardSectionState } from './DashboardSectionState';
import { DashboardStatCard } from './DashboardStatCard';

export function DashboardStats() {
  const locale = useLocale();
  const t = useTranslations('AdminDashboard');
  const { data, isPending, isError, refetch } = useDashboardStatistics();

  if (isPending) {
    return <DashboardSectionState kind="loading" message={t('states.loading')} />;
  }

  if (isError || !data) {
    return (
      <DashboardSectionState
        kind="error"
        message={t('errors.statistics')}
        retryLabel={t('actions.retry')}
        onRetry={() => void refetch()}
      />
    );
  }

  const unavailable = t('states.unavailable');
  return (
    <section aria-label={t('overview')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardStatCard
        label={t('metrics.pendingScholarships')}
        value={formatDashboardNumber(data.pending_scholarships, locale) ?? unavailable}
        icon={<Clock3 className="size-5" aria-hidden="true" />}
      />
      <DashboardStatCard
        label={t('metrics.publishedScholarships')}
        value={formatDashboardNumber(data.published_scholarships, locale) ?? unavailable}
        icon={<GraduationCap className="size-5" aria-hidden="true" />}
      />
      <DashboardStatCard
        label={t('metrics.totalUsers')}
        value={formatDashboardNumber(data.users, locale) ?? unavailable}
        icon={<Users className="size-5" aria-hidden="true" />}
      />
    </section>
  );
}
