'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface DiscoveryEmptyStateProps {
  variant: 'noScholarships' | 'noMatches';
  canClearFilters: boolean;
  onEditSearch: () => void;
  onClearFilters: () => void;
}

// Figma empty state (2264:4108). The design's "back to home" action has no route,
// so the actions are "edit search" and "clear filters" (spec US5.2).
export function DiscoveryEmptyState({
  variant,
  canClearFilters,
  onEditSearch,
  onClearFilters,
}: DiscoveryEmptyStateProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  return (
    <div role="status" className="flex flex-col items-center gap-6 px-4 py-10 text-center">
      <Image
        src="/images/student/scholarship-empty-state.svg"
        alt=""
        width={200}
        height={200}
        className="size-[200px]"
      />
      <div className="flex flex-col items-center gap-3">
        <p className="text-xl font-bold text-[#274383]">{t(`empty.${variant}.title`)}</p>
        <p className="max-w-[420px] text-sm leading-6 text-gray-500">
          {t(`empty.${variant}.description`)}
        </p>
      </div>
      {variant === 'noMatches' ? (
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={onEditSearch}
            className="h-12 rounded-full bg-gray-300 px-6 text-base font-medium text-[#434343] transition-colors hover:bg-[#d5dde8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {t('empty.noMatches.editSearch')}
          </button>
          {canClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="h-12 rounded-full bg-orange-500 px-6 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#274383]"
            >
              {t('empty.noMatches.clearFilters')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
