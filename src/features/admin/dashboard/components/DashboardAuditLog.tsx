'use client';

import { Clock3 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DASHBOARD_PREVIEW_LIMITS } from '../constants';
import { useDashboardAuditLogs } from '../hooks/useDashboardAuditLogs';
import { formatDashboardDateTime, getDisplayableDashboardText } from '../lib/formatters';
import { DashboardSectionState } from './DashboardSectionState';

export function DashboardAuditLog() {
  const locale = useLocale();
  const t = useTranslations('AdminDashboard');
  const { data, isPending, isError, refetch } = useDashboardAuditLogs({
    limit: DASHBOARD_PREVIEW_LIMITS.auditLogs,
    offset: DASHBOARD_PREVIEW_LIMITS.auditOffset,
  });

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_12px_rgba(2,38,71,0.04)]"
      aria-labelledby="dashboard-audit-log-title"
    >
      <header className="border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
        <h2 id="dashboard-audit-log-title" className="text-lg font-bold text-[#434343]">
          {t('sections.recentAuditLogs')}
        </h2>
      </header>
      {isPending ? <DashboardSectionState kind="loading" message={t('states.loading')} /> : null}
      {isError || !data ? (
        <DashboardSectionState
          kind="error"
          message={t('errors.auditLogs')}
          retryLabel={t('actions.retry')}
          onRetry={() => void refetch()}
        />
      ) : null}
      {data && !isError && data.items.length === 0 ? (
        <DashboardSectionState kind="empty" message={t('states.emptyAuditLogs')} />
      ) : null}
      {data && !isError && data.items.length > 0 ? (
        <ol className="divide-y divide-[#e2e8f0]">
          {data.items.map((item) => {
            const action =
              getDisplayableDashboardText(item.action_display) ??
              getDisplayableDashboardText(item.action) ??
              t('states.unknownAction');
            const actor = getDisplayableDashboardText(item.admin_name) ?? t('states.unavailable');
            const entity = getDisplayableDashboardText(item.entity_name) ?? t('states.unavailable');
            const timestamp = formatDashboardDateTime(item.created_at, locale);

            return (
              <li key={item.id} className="flex gap-3 px-5 py-4 sm:px-6">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[rgba(39,67,131,0.08)] text-[#274383]">
                  <Clock3 className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#434343]">{action}</p>
                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#635f80]">
                    <div className="flex gap-1">
                      <dt className="sr-only">{t('fields.administrator')}</dt>
                      <dd>{actor}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="sr-only">{t('fields.entity')}</dt>
                      <dd>{entity}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="sr-only">{t('fields.occurredAt')}</dt>
                      <dd>
                        {timestamp ? (
                          <time dateTime={item.created_at}>{timestamp}</time>
                        ) : (
                          t('states.unavailable')
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
