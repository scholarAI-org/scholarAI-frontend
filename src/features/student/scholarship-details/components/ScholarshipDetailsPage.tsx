'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, SearchX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import { Link } from '@/i18n/navigation';
import { toScholarshipDetails } from '@/features/student/scholarship-discovery/adapters/scholarship';
import {
  getDetailsViewState,
  parseScholarshipId,
} from '@/features/student/scholarship-discovery/lib/details-state';
import {
  getDiscoveryReturnHref,
  getRememberedDiscoverySearch,
} from '@/features/student/scholarship-discovery/lib/discovery-return';
import { useScholarshipDetailsQuery } from '../hooks/useScholarshipDetailsQuery';
import { ScholarshipDetailsView } from './ScholarshipDetailsView';

function DetailsMessage({
  title,
  description,
  action,
  icon = 'alert',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: 'alert' | 'missing';
}) {
  const Icon = icon === 'missing' ? SearchX : AlertCircle;
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-[18px] border border-gray-300 bg-white px-4 py-10 text-center"
    >
      <Icon aria-hidden className="size-8 text-orange-500" />
      <h2 className="text-lg font-bold text-black">{title}</h2>
      {description ? <p className="text-sm text-[#64748b]">{description}</p> : null}
      {action}
    </div>
  );
}

// Same blocks as the loaded page: hero, then the apply card and the summary.
function ScholarshipDetailsSkeleton({ label }: { label: string }) {
  const block = 'rounded-[18px] bg-[#e2e8f0] motion-safe:animate-pulse';
  return (
    <div aria-busy="true" className="flex flex-col gap-5 lg:gap-6">
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-hidden className={`${block} h-[190px] sm:h-[260px] lg:h-[234px]`} />
      <div aria-hidden className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,449px)] lg:gap-6">
        <div className={`${block} h-[140px] lg:col-start-2 lg:row-start-1`} />
        <div className={`${block} h-[280px] lg:col-start-1 lg:row-start-1`} />
      </div>
    </div>
  );
}

export function ScholarshipDetailsPage({ rawId }: { rawId: string }) {
  const t = useTranslations('StudentScholarshipDetails');
  const tLayout = useTranslations('StudentLayout');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const id = parseScholarshipId(rawId);
  const detail = useScholarshipDetailsQuery(id ?? 0);
  const state = getDetailsViewState({
    id,
    data: detail.data,
    error: detail.error,
    isFetching: detail.isFetching,
  });
  const readyData = state.kind === 'ready' ? state.data : null;
  const details = useMemo(
    () => (readyData ? toScholarshipDetails(readyData, locale) : null),
    [readyData, locale]
  );
  // Read once: the discovery URL the student came from, if any (memory only).
  const [backHref] = useState(() => getDiscoveryReturnHref(getRememberedDiscoverySearch()));

  // 401: let the existing AuthProvider re-check the session (RoleGuard redirects).
  const unauthorized = state.kind === 'error' && state.reason === 'unauthorized';
  useEffect(() => {
    if (unauthorized) void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
  }, [unauthorized, queryClient]);

  const documentTitle = details?.title ?? tLayout('pages.scholarshipDetails.title');
  useEffect(() => {
    const previous = document.title;
    document.title = documentTitle;
    return () => {
      document.title = previous;
    };
  }, [documentTitle]);

  let content: ReactNode = null;
  if (state.kind === 'invalid') {
    content = <DetailsMessage icon="missing" title={t('invalidId')} />;
  } else if (state.kind === 'loading') {
    content = <ScholarshipDetailsSkeleton label={t('loading')} />;
  } else if (state.kind === 'error') {
    content =
      state.reason === 'notFound' ? (
        <DetailsMessage
          icon="missing"
          title={t('notFound.title')}
          description={t('notFound.description')}
        />
      ) : state.reason === 'generic' ? (
        <DetailsMessage
          title={t('errors.generic')}
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => void detail.refetch()}
            >
              {t('errors.retry')}
            </Button>
          }
        />
      ) : (
        <DetailsMessage title={t(`errors.${state.reason}`)} />
      );
  } else if (details) {
    content = <ScholarshipDetailsView details={details} />;
  }

  return (
    <div className="mx-auto flex max-w-[1156px] flex-col gap-4 lg:gap-5">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 rounded-full text-sm font-medium text-[#274383] hover:text-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        <ArrowRight aria-hidden className="size-4 shrink-0 ltr:rotate-180" />
        {t('backToDiscovery')}
      </Link>
      {content}
    </div>
  );
}
