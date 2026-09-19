'use client';

import { AlertCircle, CheckCircle2, Clock3, ExternalLink, Link2Off, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { formatDashboardNumber } from '@/features/admin/dashboard/lib/formatters';
import {
  displayText,
  formatDateTime,
  getSafeExternalUrl,
  getSourceDomain,
} from '../lib/formatters';
import {
  useScholarshipReviewList,
  useScholarshipReviewStatistics,
} from '../hooks/useScholarshipReview';
import type { ScholarshipReviewItem } from '../types';

const PAGE_SIZE = 10;

function SectionState({
  kind,
  message,
  onRetry,
  retryLabel,
}: {
  kind: 'loading' | 'error' | 'empty';
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      className="flex min-h-36 flex-col items-center justify-center gap-3 px-4 py-6 text-center"
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {kind === 'loading' ? (
        <Loader2 className="size-5 animate-spin text-[#f97316]" aria-hidden="true" />
      ) : null}
      <p
        className={
          kind === 'error'
            ? 'text-sm text-[var(--color-text-error)]'
            : 'text-sm text-[var(--color-text-secondary)]'
        }
      >
        {message}
      </p>
      {onRetry && retryLabel ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

function ReviewStatistics() {
  const t = useTranslations('AdminScholarshipReview');
  const locale = useLocale();
  const query = useScholarshipReviewStatistics();
  if (query.isPending)
    return <SectionState kind="loading" message={t('states.loadingStatistics')} />;
  if (query.isError || !query.data)
    return (
      <SectionState
        kind="error"
        message={t('errors.statistics')}
        retryLabel={t('actions.retry')}
        onRetry={() => void query.refetch()}
      />
    );
  const cards = [
    {
      label: t('metrics.pending'),
      value: query.data.pending_count,
      icon: <Clock3 className="size-5" />,
    },
    {
      label: t('metrics.approvedThisWeek'),
      value: query.data.approved_this_week,
      icon: <CheckCircle2 className="size-5" />,
    },
    {
      label: t('metrics.missingSourceUrl'),
      value: query.data.missing_source_url_count,
      icon: <Link2Off className="size-5" />,
    },
  ];
  return (
    <section aria-label={t('statisticsLabel')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex min-h-32 items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_12px_rgba(2,38,71,0.04)]"
        >
          <dl>
            <dt className="text-sm text-[#979797]">{card.label}</dt>
            <dd className="mt-3 text-2xl font-bold text-[#274383]">
              {formatDashboardNumber(card.value, locale)}
            </dd>
          </dl>
          <span
            className="inline-flex size-11 items-center justify-center rounded-full bg-[rgba(249,115,22,0.1)] text-[#f97316]"
            aria-hidden="true"
          >
            {card.icon}
          </span>
        </div>
      ))}
    </section>
  );
}

function Status({ value }: { value: string }) {
  const t = useTranslations('AdminScholarshipReview');
  const known = ['pending', 'approved', 'rejected'].includes(value);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[#434343]">
      <span className="size-2 rounded-full bg-[#f59e0b]" aria-hidden="true" />
      {known ? t(`status.${value}`) : t('status.unknown')}
    </span>
  );
}

function Source({ item }: { item: ScholarshipReviewItem }) {
  const t = useTranslations('AdminScholarshipReview');
  const url = getSafeExternalUrl(item.source_url);
  const label =
    getSourceDomain(item.source_url) ?? displayText(item.source) ?? t('values.missingSource');
  if (!url) return <span className="text-[#979797]">{label}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('actions.openSource')}: ${label}`}
      className="inline-flex items-center gap-1 text-[#274383] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
    >
      <span>{label}</span>
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function Timestamp({ value }: { value: string | null }) {
  const t = useTranslations('AdminScholarshipReview');
  const locale = useLocale();
  const rendered = formatDateTime(value, locale);
  return rendered ? (
    <time dateTime={value ?? undefined}>{rendered}</time>
  ) : (
    <span className="text-[#979797]">{t('values.unavailable')}</span>
  );
}

function ReviewTable({ items, page }: { items: ScholarshipReviewItem[]; page: number }) {
  const t = useTranslations('AdminScholarshipReview');
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[840px] border-collapse text-start text-sm">
          <thead className="bg-[#f8fafc] text-[#635f80]">
            <tr>
              {['index', 'title', 'organization', 'source', 'scrapedAt', 'status', 'action'].map(
                (field) => (
                  <th key={field} scope="col" className="px-4 py-3 text-start font-medium">
                    {t(`fields.${field}`)}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] text-[#434343]">
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="px-4 py-4 text-[#979797]">{(page - 1) * PAGE_SIZE + index + 1}</td>
                <td className="px-4 py-4 font-medium">
                  {displayText(item.title) ?? t('values.unavailable')}
                </td>
                <td className="px-4 py-4">
                  {displayText(item.organization_name) ?? t('values.missingOrganization')}
                </td>
                <td className="px-4 py-4">
                  <Source item={item} />
                </td>
                <td className="px-4 py-4">
                  <Timestamp value={item.scraped_at} />
                </td>
                <td className="px-4 py-4">
                  <Status value={item.status} />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/scholarships/review/${item.id}`}
                    className="font-medium text-[#f97316] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
                  >
                    {t('actions.review')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-[#e2e8f0] md:hidden">
        {items.map((item, index) => (
          <li key={item.id} className="p-4">
            <article className="space-y-3">
              <p className="text-xs text-[#979797]">
                {t('fields.index')} {(page - 1) * PAGE_SIZE + index + 1}
              </p>
              <h3 className="font-semibold text-[#434343]">
                {displayText(item.title) ?? t('values.unavailable')}
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-[#979797]">{t('fields.organization')}</dt>
                  <dd className="mt-1">
                    {displayText(item.organization_name) ?? t('values.missingOrganization')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#979797]">{t('fields.status')}</dt>
                  <dd className="mt-1">
                    <Status value={item.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[#979797]">{t('fields.source')}</dt>
                  <dd className="mt-1">
                    <Source item={item} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[#979797]">{t('fields.scrapedAt')}</dt>
                  <dd className="mt-1">
                    <Timestamp value={item.scraped_at} />
                  </dd>
                </div>
              </dl>
              <Link
                href={`/admin/scholarships/review/${item.id}`}
                className="inline-flex rounded-full bg-[#f97316] px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#274383]"
              >
                {t('actions.review')}
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ScholarshipReviewPage() {
  const t = useTranslations('AdminScholarshipReview');
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const actionNotice = searchParams.get('notice');
  const successNotice =
    actionNotice === 'approved' || actionNotice === 'rejected' ? actionNotice : null;
  const search = searchParams.toString();
  useEffect(() => {
    if (!successNotice) return;
    const nextParams = new URLSearchParams(search);
    nextParams.delete('notice');
    const nextSearch = nextParams.toString();
    router.replace(
      nextSearch ? `/admin/scholarships/review?${nextSearch}` : '/admin/scholarships/review'
    );
  }, [router, search, successNotice]);
  const list = useScholarshipReviewList(page, PAGE_SIZE);
  const goToPage = (nextPage: number) =>
    router.replace(
      nextPage === 1 ? '/admin/scholarships/review' : `/admin/scholarships/review?page=${nextPage}`
    );
  const data = list.data;
  return (
    <div className="mx-auto max-w-[1156px] py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-[#434343]">{t('title')}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#979797] sm:text-base">
            {t('description')}
          </p>
        </div>
        {successNotice ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {t(`feedback.${successNotice}`)}
          </p>
        ) : null}
        <ReviewStatistics />
        <aside
          className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#7c3f00]"
          aria-label={t('noticeLabel')}
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#f97316]" aria-hidden="true" />
          <p>{t('notice')}</p>
        </aside>
        <section
          className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_12px_rgba(2,38,71,0.04)]"
          aria-labelledby="scholarship-review-list-title"
        >
          <header className="border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
            <h2 id="scholarship-review-list-title" className="text-lg font-bold text-[#434343]">
              {t('listTitle')}
            </h2>
          </header>
          {list.isPending ? (
            <SectionState kind="loading" message={t('states.loadingList')} />
          ) : null}
          {list.isError || !data ? (
            <SectionState
              kind="error"
              message={t('errors.list')}
              retryLabel={t('actions.retry')}
              onRetry={() => void list.refetch()}
            />
          ) : null}
          {data && !list.isError && data.items.length === 0 ? (
            <SectionState kind="empty" message={t('states.empty')} />
          ) : null}
          {data && !list.isError && data.items.length > 0 ? (
            <>
              <ReviewTable items={data.items} page={data.page} />
              <footer className="flex items-center justify-between gap-3 border-t border-[#e2e8f0] px-4 py-3">
                <p className="text-sm text-[#979797]" aria-live="polite">
                  {t('pagination.summary', { page: data.page, total: data.total })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => goToPage(data.page - 1)}
                  >
                    {t('pagination.previous')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={data.page >= data.total_pages}
                    onClick={() => goToPage(data.page + 1)}
                  >
                    {t('pagination.next')}
                  </Button>
                </div>
              </footer>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
