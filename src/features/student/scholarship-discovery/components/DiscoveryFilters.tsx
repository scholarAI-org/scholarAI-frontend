'use client';

import { Fragment, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { academicLevels, fundingTypes, opportunityTypes } from '../constants';
import { toggleValue } from '../lib/filter-values';
import type { DiscoveryFilterPatch, DiscoveryQuery } from '../types';
import { FilterCheckbox } from './FilterCheckbox';

const enumGroups = [
  { key: 'academicLevel', field: 'academicLevels', values: academicLevels },
  { key: 'funding', field: 'fundingTypes', values: fundingTypes },
  { key: 'opportunity', field: 'opportunityTypes', values: opportunityTypes },
] as const;

interface DiscoveryFiltersProps {
  // panel: the desktop side panel; dialog: groups only, inside the mobile dialog.
  variant?: 'panel' | 'dialog';
  query: Pick<DiscoveryQuery, 'academicLevels' | 'fundingTypes' | 'opportunityTypes' | 'countries'>;
  onChange: (patch: DiscoveryFilterPatch) => void;
  onClear: () => void;
  countryFilter?: ReactNode;
}

const Divider = () => <hr className="border-0 border-t border-[#f5f5fc]" />;

// Figma filters-panel (3100:7557): academic level, funding, country, opportunity.
export function DiscoveryFilters({
  variant = 'panel',
  query,
  onChange,
  onClear,
  countryFilter,
}: DiscoveryFiltersProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const hasFilters =
    enumGroups.some(({ field }) => query[field].length > 0) || query.countries.length > 0;

  const groups = (
    <>
      {enumGroups.map((group) => {
        const selected: readonly string[] = query[group.field];
        return (
          <Fragment key={group.key}>
            {group.key === 'opportunity' && countryFilter ? (
              <>
                <Divider />
                {countryFilter}
              </>
            ) : null}
            <Divider />
            <fieldset className="min-w-0">
              <legend className="text-sm text-black">{t(`filters.${group.key}.legend`)}</legend>
              <div className="mt-4 flex flex-col gap-2">
                {group.values.map((value) => (
                  <FilterCheckbox
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
                  />
                ))}
              </div>
            </fieldset>
          </Fragment>
        );
      })}
    </>
  );

  if (variant === 'dialog') return <div className="flex flex-col gap-4">{groups}</div>;

  return (
    <aside
      aria-labelledby="scholarship-discovery-filters-heading"
      className="flex flex-col gap-4 rounded-2xl border border-gray-300 bg-white px-4 py-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="scholarship-discovery-filters-heading" className="text-sm font-normal text-black">
          {t('filters.title')}
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
          className="-my-1 rounded-full px-2 py-1 text-[10px] text-orange-500 hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:text-[#b5b5b5] disabled:hover:bg-transparent"
        >
          {t('filters.clearAll')}
        </button>
      </div>

      {groups}
    </aside>
  );
}
