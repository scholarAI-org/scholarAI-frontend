'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/Checkbox';
import { academicLevels, fundingTypes, opportunityTypes } from '../constants';
import { toggleValue } from '../lib/filter-values';
import type { DiscoveryFilterPatch, DiscoveryQuery } from '../types';

const enumGroups = [
  { key: 'academicLevel', field: 'academicLevels', values: academicLevels },
  { key: 'funding', field: 'fundingTypes', values: fundingTypes },
  { key: 'opportunity', field: 'opportunityTypes', values: opportunityTypes },
] as const;

interface DiscoveryFiltersProps {
  query: DiscoveryQuery;
  onChange: (patch: DiscoveryFilterPatch) => void;
  onClear: () => void;
  countryFilter?: ReactNode;
}

export function DiscoveryFilters({
  query,
  onChange,
  onClear,
  countryFilter,
}: DiscoveryFiltersProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const hasFilters =
    enumGroups.some(({ field }) => query[field].length > 0) || query.countries.length > 0;

  return (
    <aside
      aria-labelledby="scholarship-discovery-filters-heading"
      className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_12px_rgba(2,38,71,0.04)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="scholarship-discovery-filters-heading"
          className="text-base font-bold text-[#434343]"
        >
          {t('filters.title')}
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
          className="rounded-full px-3 py-1 text-sm font-medium text-[#f97316] hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316] disabled:cursor-not-allowed disabled:text-[#b5b5b5] disabled:hover:bg-transparent"
        >
          {t('filters.clearAll')}
        </button>
      </div>

      <div className="mt-4 space-y-5">
        {enumGroups.map((group) => {
          const selected: readonly string[] = query[group.field];
          return (
            <fieldset key={group.key} className="space-y-2 border-t border-[#f1f5f9] pt-4">
              <legend className="mb-2 text-sm font-medium text-[#274383]">
                {t(`filters.${group.key}.legend`)}
              </legend>
              {group.values.map((value) => (
                <Checkbox
                  key={value}
                  name={group.field}
                  value={value}
                  checked={selected.includes(value)}
                  onChange={() =>
                    onChange({
                      [group.field]: toggleValue(selected, value),
                    } as DiscoveryFilterPatch)
                  }
                  label={t(`filters.${group.key}.${value}`)}
                  className="size-4"
                />
              ))}
            </fieldset>
          );
        })}
        {countryFilter}
      </div>
    </aside>
  );
}
