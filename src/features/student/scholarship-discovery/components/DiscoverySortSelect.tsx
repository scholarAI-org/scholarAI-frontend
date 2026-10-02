'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { discoverySortOptions, getVisibleSortOptions } from '../constants';
import type { DiscoverySort } from '../types';

interface DiscoverySortSelectProps {
  value: DiscoverySort;
  onChange: (sort: DiscoverySort) => void;
}

export function DiscoverySortSelect({ value, onChange }: DiscoverySortSelectProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const selectId = useId();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <label htmlFor={selectId} className="whitespace-nowrap text-sm text-[#979797]">
        {t('sort.label')}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value as DiscoverySort)}
        className="h-11 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#434343] outline-none transition-colors focus:border-[var(--color-border-focus)]"
      >
        {getVisibleSortOptions(discoverySortOptions).map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
