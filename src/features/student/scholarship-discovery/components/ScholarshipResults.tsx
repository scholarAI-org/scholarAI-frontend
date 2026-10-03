'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { toScholarshipCard } from '../adapters/scholarship';
import { useScholarshipDiscovery } from '../hooks/useScholarshipDiscovery';
import { serializeDiscoveryQuery, withPage } from '../lib/discovery-query-state';
import {
  getOutOfRangeTarget,
  reduceOutOfRangeNotice,
  type OutOfRangeNotice,
} from '../lib/pagination';
import type { DiscoveryQuery, DiscoveryView } from '../types';
import { DiscoveryPagination } from './DiscoveryPagination';
import { ScholarshipDeadline } from './ScholarshipDeadline';
import { ScholarshipGridCard } from './ScholarshipGridCard';
import { ScholarshipListRow } from './ScholarshipListRow';

interface ScholarshipResultsProps {
  query: DiscoveryQuery;
  view: DiscoveryView;
  onPageChange: (page: number) => void;
  onReconcilePage: (page: number) => void;
}

export const RESULTS_HEADING_ID = 'scholarship-discovery-results-heading';

// Grid and List consume the same normalized ScholarshipCardModel.
export function ScholarshipResults({
  query,
  view,
  onPageChange,
  onReconcilePage,
}: ScholarshipResultsProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const locale = useLocale();
  const discovery = useScholarshipDiscovery(query);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // One "today" per mounted list, so all deadlines agree.
  const [now] = useState(() => new Date());
  const cards = discovery.data?.items.map((item) => toScholarshipCard(item, locale)) ?? [];

  // Spec US3.3 / T043: a URL page beyond the last server page is reconciled once
  // with a replace-mode URL update, and a visible notice says so.
  const current = discovery.isPlaceholderData ? undefined : discovery.data;
  const lastPage = current ? getOutOfRangeTarget(query.page, current.total_pages) : null;
  const queryKey = serializeDiscoveryQuery(query).toString();
  const [notice, setNotice] = useState<OutOfRangeNotice | null>(null);
  const nextNotice = reduceOutOfRangeNotice(
    notice,
    queryKey,
    lastPage === null
      ? null
      : {
          requested: query.page,
          page: lastPage,
          targetKey: serializeDiscoveryQuery(withPage(query, lastPage)).toString(),
        }
  );
  if (nextNotice !== notice) setNotice(nextNotice);
  useEffect(() => {
    if (lastPage !== null) onReconcilePage(lastPage);
  }, [lastPage, queryKey, onReconcilePage]);

  function changePage(page: number) {
    onPageChange(page);
    const heading = headingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  return (
    <section aria-labelledby={RESULTS_HEADING_ID} className="flex flex-col gap-4">
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <h2
          id={RESULTS_HEADING_ID}
          ref={headingRef}
          tabIndex={-1}
          aria-live="polite"
          className="scroll-mt-4 text-base font-bold text-[#434343] outline-none"
        >
          {discovery.data ? t('results.count', { count: discovery.data.total }) : null}
        </h2>
        {discovery.isFetching ? (
          <p role="status" className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 aria-hidden className="size-4 animate-spin text-orange-500" />
            {t('results.updating')}
          </p>
        ) : null}
      </div>

      {notice ? (
        <p role="status" className="rounded-xl bg-[#f8fafc] px-4 py-3 text-sm text-text-label">
          {t('pagination.outOfRange', { requested: notice.requested, page: notice.page })}
        </p>
      ) : null}

      {discovery.isError && !discovery.isFetching ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
          <AlertCircle aria-hidden className="size-5 shrink-0 text-orange-500" />
          <span className="text-[var(--color-text-error)]">{t('errors.generic')}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => void discovery.refetch()}
          >
            {t('errors.retry')}
          </Button>
        </div>
      ) : null}

      {cards.length > 0 ? (
        <ul
          aria-busy={discovery.isFetching}
          className={view === 'grid' ? 'grid gap-6 md:grid-cols-2' : 'flex flex-col gap-4'}
        >
          {cards.map((card) => (
            <li key={card.id} className="min-w-0">
              {view === 'grid' ? (
                <ScholarshipGridCard
                  card={card}
                  footer={<ScholarshipDeadline card={card} now={now} />}
                />
              ) : (
                <ScholarshipListRow
                  card={card}
                  footer={<ScholarshipDeadline card={card} now={now} />}
                />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {discovery.data && cards.length > 0 ? (
        <DiscoveryPagination
          page={discovery.data.page}
          totalPages={discovery.data.total_pages}
          onChange={changePage}
        />
      ) : null}
    </section>
  );
}
