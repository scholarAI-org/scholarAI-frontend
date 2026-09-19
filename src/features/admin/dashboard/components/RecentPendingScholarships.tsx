'use client';

import { useTranslations } from 'next-intl';
import { DASHBOARD_PREVIEW_LIMITS } from '../constants';
import { useRecentPendingScholarships } from '../hooks/useRecentPendingScholarships';
import { DashboardSectionState } from './DashboardSectionState';
import { RecentPendingScholarshipsTable } from './RecentPendingScholarshipsTable';

export function RecentPendingScholarships() {
  const t = useTranslations('AdminDashboard');
  const { data, isPending, isError, refetch } = useRecentPendingScholarships(
    DASHBOARD_PREVIEW_LIMITS.recentPendingScholarships
  );

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_12px_rgba(2,38,71,0.04)]"
      aria-labelledby="recent-pending-scholarships-title"
    >
      <header className="border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
        <h2 id="recent-pending-scholarships-title" className="text-lg font-bold text-[#434343]">
          {t('sections.recentPendingScholarships')}
        </h2>
      </header>
      {isPending ? <DashboardSectionState kind="loading" message={t('states.loading')} /> : null}
      {isError || !data ? (
        <DashboardSectionState
          kind="error"
          message={t('errors.pendingScholarships')}
          retryLabel={t('actions.retry')}
          onRetry={() => void refetch()}
        />
      ) : null}
      {data && !isError && data.items.length === 0 ? (
        <DashboardSectionState kind="empty" message={t('states.emptyPendingScholarships')} />
      ) : null}
      {data && !isError && data.items.length > 0 ? (
        <RecentPendingScholarshipsTable items={data.items} />
      ) : null}
    </section>
  );
}
