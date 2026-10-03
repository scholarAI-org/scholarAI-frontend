'use client';

import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useScholarshipFilterOptions } from '../hooks/useScholarshipFilterOptions';
import { mergeCountryOptions, toggleValue } from '../lib/filter-values';
import { FilterCheckbox } from './FilterCheckbox';

interface CountryFilterProps {
  selected: string[];
  onChange: (countries: string[]) => void;
}

// Options come only from GET /api/scholarships/filter-options. Its loading, empty
// and error states are independent of the discovery results. Figma shows a
// dropdown pill (3100:7594); it is a disclosure over a multi-select list.
export function CountryFilter({ selected, onChange }: CountryFilterProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const options = useScholarshipFilterOptions();
  const countries = mergeCountryOptions(options.data?.countries ?? [], selected);

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm text-black">{t('filters.country.legend')}</legend>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className="mt-4 flex w-full items-center justify-between gap-2 rounded-full border border-gray-300 bg-white px-3 py-2.5 text-start text-xs text-[#b5b5b5] transition-colors hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        <span className={selected.length > 0 ? 'text-text-label' : undefined}>
          {selected.length > 0
            ? t('filters.country.selected', { count: selected.length })
            : t('filters.country.placeholder')}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-[18px] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {options.isPending ? (
        <p role="status" className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 aria-hidden className="size-4 animate-spin text-orange-500" />
          {t('filters.country.loading')}
        </p>
      ) : null}

      {options.isError ? (
        <div
          role="alert"
          className="mt-2 space-y-2 rounded-xl bg-orange-50 p-3 text-xs text-[#7c3f00]"
        >
          <p className="flex items-center gap-2">
            <AlertCircle aria-hidden className="size-4 shrink-0 text-orange-500" />
            {t('filters.country.unavailable')}
          </p>
          <button
            type="button"
            disabled={options.isFetching}
            onClick={() => void options.refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 font-medium text-text-label hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-60"
          >
            {options.isFetching ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
            {t('filters.country.retry')}
          </button>
        </div>
      ) : null}

      {options.isSuccess && options.data.countries.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">{t('filters.country.empty')}</p>
      ) : null}

      <div
        id={listId}
        hidden={!isOpen || countries.length === 0}
        className="mt-3 max-h-60 flex-col gap-2 overflow-y-auto pe-1 [&:not([hidden])]:flex"
      >
        {countries.map((country) => (
          <FilterCheckbox
            key={country}
            name="country"
            value={country}
            checked={selected.includes(country)}
            onChange={() => onChange(toggleValue(selected, country))}
            label={<bdi>{country}</bdi>}
          />
        ))}
      </div>
    </fieldset>
  );
}
