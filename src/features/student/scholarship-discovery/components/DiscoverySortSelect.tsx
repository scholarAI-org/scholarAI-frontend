'use client';

import { ArrowDownUp, ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { discoverySortOptions, getVisibleSortOptions } from '../constants';
import type { DiscoverySort } from '../types';

interface DiscoverySortSelectProps {
  value: DiscoverySort;
  onChange: (sort: DiscoverySort) => void;
}

// Figma sort pill (2287:3450). A native select keeps keyboard behaviour; the icons
// share its grid cell and ignore pointer events.
export function DiscoverySortSelect({ value, onChange }: DiscoverySortSelectProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const selectId = useId();

  return (
    <div className="grid h-[52px] shrink-0 items-center rounded-full border border-gray-300 bg-white transition-colors focus-within:border-[var(--color-border-focus)]">
      <label htmlFor={selectId} className="sr-only">
        {t('sort.label')}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value as DiscoverySort)}
        className="col-start-1 row-start-1 h-full w-full cursor-pointer appearance-none rounded-full bg-transparent ps-10 pe-11 text-sm text-text-label outline-none"
      >
        {getVisibleSortOptions(discoverySortOptions).map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
      <ArrowDownUp
        aria-hidden
        className="pointer-events-none col-start-1 row-start-1 ms-4 size-[15px] justify-self-start text-text-label"
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none col-start-1 row-start-1 me-4 size-5 justify-self-end text-text-label"
      />
    </div>
  );
}
