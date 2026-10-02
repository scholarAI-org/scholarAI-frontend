'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { useScholarshipDiscovery } from '../hooks/useScholarshipDiscovery';
import type { DiscoveryQuery } from '../types';

// This round renders only the server total and request state; cards come later (T030+).
export function DiscoveryResultsSummary({ query }: { query: DiscoveryQuery }) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const discovery = useScholarshipDiscovery(query);

  return (
    <section
      aria-labelledby="scholarship-discovery-results-heading"
      aria-busy={discovery.isFetching}
      className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_12px_rgba(2,38,71,0.04)] sm:p-6"
    >
      <h2
        id="scholarship-discovery-results-heading"
        aria-live="polite"
        className="text-lg font-bold text-[#434343]"
      >
        {discovery.data ? t('results.count', { count: discovery.data.total }) : null}
      </h2>
      {discovery.isFetching ? (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[#979797]">
          <Loader2 aria-hidden className="size-4 animate-spin text-[#f97316]" />
          {t('results.updating')}
        </p>
      ) : null}
      {discovery.isError && !discovery.isFetching ? (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <AlertCircle aria-hidden className="size-5 shrink-0 text-[#f97316]" />
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
    </section>
  );
}
