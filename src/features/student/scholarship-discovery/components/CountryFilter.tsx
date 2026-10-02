'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useScholarshipFilterOptions } from '../hooks/useScholarshipFilterOptions';
import { mergeCountryOptions, toggleValue } from '../lib/filter-values';

interface CountryFilterProps {
  selected: string[];
  onChange: (countries: string[]) => void;
}

// Options come only from GET /api/scholarships/filter-options. Its loading, empty
// and error states are independent of the discovery results.
export function CountryFilter({ selected, onChange }: CountryFilterProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const options = useScholarshipFilterOptions();
  const countries = mergeCountryOptions(options.data?.countries ?? [], selected);

  return (
    <fieldset className="space-y-2 border-t border-[#f1f5f9] pt-4">
      <legend className="mb-2 text-sm font-medium text-[#274383]">
        {t('filters.country.legend')}
      </legend>

      {selected.length > 0 ? (
        <p className="text-xs text-[#979797]" aria-live="polite">
          {t('filters.country.selected', { count: selected.length })}
        </p>
      ) : null}

      {options.isPending ? (
        <p role="status" className="flex items-center gap-2 text-xs text-[#979797]">
          <Loader2 aria-hidden className="size-4 animate-spin text-[#f97316]" />
          {t('filters.country.loading')}
        </p>
      ) : null}

      {options.isError ? (
        <div role="alert" className="space-y-2 rounded-xl bg-orange-50 p-3 text-xs text-[#7c3f00]">
          <p className="flex items-center gap-2">
            <AlertCircle aria-hidden className="size-4 shrink-0 text-[#f97316]" />
            {t('filters.country.unavailable')}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            isLoading={options.isFetching}
            onClick={() => void options.refetch()}
          >
            {t('filters.country.retry')}
          </Button>
        </div>
      ) : null}

      {options.isSuccess && options.data.countries.length === 0 ? (
        <p className="text-xs text-[#979797]">{t('filters.country.empty')}</p>
      ) : null}

      {countries.length > 0 ? (
        <div className="max-h-60 space-y-2 overflow-y-auto pe-1">
          {countries.map((country) => (
            <Checkbox
              key={country}
              name="country"
              value={country}
              checked={selected.includes(country)}
              onChange={() => onChange(toggleValue(selected, country))}
              label={<bdi>{country}</bdi>}
              className="size-4"
            />
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}
