'use client';

import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import { toScholarshipCardEntries } from '../adapters/scholarship';
import { useScholarshipDiscovery } from '../hooks/useScholarshipDiscovery';
import { serializeDiscoveryQuery, withPage } from '../lib/discovery-query-state';
import { reduceOutOfRangeNotice, type OutOfRangeNotice } from '../lib/pagination';
import {
  getDiscoveryResultsState,
  hasActiveFilters,
  isDiscoveryResponse,
} from '../lib/results-state';
import type { DiscoveryQuery, DiscoveryView } from '../types';
import { DiscoveryEmptyState } from './DiscoveryEmptyState';
import { DiscoveryErrorState } from './DiscoveryErrorState';
import { DiscoveryPagination } from './DiscoveryPagination';
import { DISCOVERY_SEARCH_INPUT_ID } from './DiscoverySearchField';
import { ScholarshipDeadline } from './ScholarshipDeadline';
import { ScholarshipGridCard } from './ScholarshipGridCard';
import { ScholarshipListRow } from './ScholarshipListRow';
import { ScholarshipSkeletons } from './ScholarshipSkeletons';

interface ScholarshipResultsProps {
  query: DiscoveryQuery;
  view: DiscoveryView;
  onPageChange: (page: number) => void;
  onReconcilePage: (page: number) => void;
  onClearFilters: () => void;
}

export const RESULTS_HEADING_ID = 'scholarship-discovery-results-heading';

// Grid and List consume the same normalized ScholarshipCardModel. What the area
// shows is decided by getDiscoveryResultsState (loading, results, error, empty,
// out of range).
export function ScholarshipResults({
  query,
  view,
  onPageChange,
  onReconcilePage,
  onClearFilters,
}: ScholarshipResultsProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const discovery = useScholarshipDiscovery(query);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // One "today" per mounted list, so all deadlines agree.
  const [now] = useState(() => new Date());

  const state = getDiscoveryResultsState({
    query,
    data: discovery.data,
    error: discovery.error,
    isFetching: discovery.isFetching,
    isPlaceholderData: discovery.isPlaceholderData,
  });
  const data = isDiscoveryResponse(discovery.data) ? discovery.data : undefined;
  const entries =
    state.kind === 'results' && data ? toScholarshipCardEntries(data.items, locale) : [];

  // 401: let the existing AuthProvider re-check the session; RoleGuard redirects.
  const unauthorized = state.kind === 'error' && state.reason === 'unauthorized';
  useEffect(() => {
    if (unauthorized) void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
  }, [unauthorized, queryClient]);

  // Spec US3.3 / T043: a URL page beyond the last server page is reconciled once
  // with a replace-mode URL update, and a visible notice says so.
  const lastPage = state.kind === 'outOfRange' ? state.lastPage : null;
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

  const busy =
    state.kind === 'loading' ||
    state.kind === 'outOfRange' ||
    (state.kind === 'results' && state.updating);
  const retry = () => void discovery.refetch();

  return (
    <section aria-labelledby={RESULTS_HEADING_ID} aria-busy={busy} className="flex flex-col gap-4">
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <h2
          id={RESULTS_HEADING_ID}
          ref={headingRef}
          tabIndex={-1}
          aria-live="polite"
          className={
            state.kind === 'results'
              ? 'scroll-mt-4 text-base font-bold text-[#434343] outline-none'
              : 'sr-only'
          }
        >
          {data ? t('results.count', { count: data.total }) : null}
        </h2>
        {busy ? (
          <p role="status" className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 aria-hidden className="size-4 animate-spin text-orange-500" />
            {state.kind === 'loading' ? t('results.loading') : t('results.updating')}
          </p>
        ) : null}
      </div>

      {notice ? (
        <p role="status" className="rounded-xl bg-[#f8fafc] px-4 py-3 text-sm text-text-label">
          {t('pagination.outOfRange', { requested: notice.requested, page: notice.page })}
        </p>
      ) : null}

      {state.kind === 'loading' ? <ScholarshipSkeletons view={view} /> : null}

      {state.kind === 'error' ? (
        <DiscoveryErrorState
          reason={state.reason}
          onRetry={retry}
          onClearFilters={onClearFilters}
        />
      ) : null}

      {state.kind === 'empty' ? (
        <DiscoveryEmptyState
          variant={state.variant}
          canClearFilters={hasActiveFilters(query)}
          onEditSearch={() => document.getElementById(DISCOVERY_SEARCH_INPUT_ID)?.focus()}
          onClearFilters={onClearFilters}
        />
      ) : null}

      {state.kind === 'results' ? (
        <>
          {state.refreshError ? (
            <DiscoveryErrorState
              compact
              reason={state.refreshError}
              onRetry={retry}
              onClearFilters={onClearFilters}
            />
          ) : null}
          <ul className={view === 'grid' ? 'grid gap-6 md:grid-cols-2' : 'flex flex-col gap-4'}>
            {entries.map((entry) =>
              entry.kind === 'malformed' ? (
                <li
                  key={entry.key}
                  role="note"
                  className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500"
                >
                  {t('errors.malformedCard')}
                </li>
              ) : (
                <li key={entry.card.id} className="min-w-0">
                  {view === 'grid' ? (
                    <ScholarshipGridCard
                      card={entry.card}
                      footer={<ScholarshipDeadline card={entry.card} now={now} />}
                    />
                  ) : (
                    <ScholarshipListRow
                      card={entry.card}
                      footer={<ScholarshipDeadline card={entry.card} now={now} />}
                    />
                  )}
                </li>
              )
            )}
          </ul>
          {data ? (
            <DiscoveryPagination
              page={data.page}
              totalPages={data.total_pages}
              onChange={changePage}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
