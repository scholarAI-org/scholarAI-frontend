'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { toScholarshipCard } from '../adapters/scholarship';
import { useScholarshipDiscovery } from '../hooks/useScholarshipDiscovery';
import type { DiscoveryQuery, DiscoveryView } from '../types';
import { ScholarshipDeadline } from './ScholarshipDeadline';
import { ScholarshipGridCard } from './ScholarshipGridCard';
import { ScholarshipListRow } from './ScholarshipListRow';

interface ScholarshipResultsProps {
  query: DiscoveryQuery;
  view: DiscoveryView;
}

export const RESULTS_HEADING_ID = 'scholarship-discovery-results-heading';

// Grid and List consume the same normalized ScholarshipCardModel.
export function ScholarshipResults({ query, view }: ScholarshipResultsProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const locale = useLocale();
  const discovery = useScholarshipDiscovery(query);
  // One "today" per mounted list, so all deadlines agree.
  const [now] = useState(() => new Date());
  const cards = discovery.data?.items.map((item) => toScholarshipCard(item, locale)) ?? [];

  return (
    <section aria-labelledby={RESULTS_HEADING_ID} className="flex flex-col gap-4">
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <h2
          id={RESULTS_HEADING_ID}
          aria-live="polite"
          className="text-base font-bold text-[#434343]"
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
    </section>
  );
}
