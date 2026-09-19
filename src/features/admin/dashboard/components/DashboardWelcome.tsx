'use client';

import { CalendarDays, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { formatDashboardDate } from '../lib/formatters';

export function DashboardWelcome() {
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations('AdminDashboard');
  const name = user?.name?.trim() || t('welcome.genericName');
  const now = new Date();
  const currentDate = formatDashboardDate(now.toISOString(), locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_12px_rgba(2,38,71,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#274383] text-sm font-extrabold text-white"
        >
          {name.slice(0, 1).toLocaleUpperCase()}
        </span>
        <div className="min-w-0 text-start">
          <h2 className="truncate text-xl font-bold text-[#434343]">
            {t('welcome.title', { name })}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#979797]">{t('welcome.summary')}</p>
          {currentDate ? (
            <div className="mt-1 flex items-center gap-2 text-xs text-[#635f80]">
              <CalendarDays className="size-3.5 text-[#f97316]" aria-hidden="true" />
              <span className="font-medium">{t('welcome.dateLabel')}:</span>
              <time dateTime={now.toISOString()}>{currentDate}</time>
            </div>
          ) : null}
        </div>
      </div>
      <div className="shrink-0">
        <Link
          href="/admin/scholarships/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
        >
          <Plus className="size-4 shrink-0" aria-hidden="true" />
          <span>{t('actions.addManualScholarship')}</span>
        </Link>
      </div>
    </section>
  );
}
