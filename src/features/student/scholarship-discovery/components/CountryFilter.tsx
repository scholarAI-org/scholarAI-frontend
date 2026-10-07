'use client';

import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { FOCUSABLE_SELECTOR } from '@/features/student/layout/focus-trap';
import { useScholarshipFilterOptions } from '../hooks/useScholarshipFilterOptions';
import { mergeCountryOptions, toggleValue } from '../lib/filter-values';
import { getRovingFocusIndex } from '../lib/roving-focus';
import { FilterCheckbox } from './FilterCheckbox';

interface CountryFilterProps {
  selected: string[];
  onChange: (countries: string[]) => void;
}

// Figma dropdown (2264:4050): a trigger pill and a popover panel with a
// multi-select list. Options come only from GET /api/scholarships/filter-options;
// its loading, empty and error states live in the panel and never block results.
export function CountryFilter({ selected, onChange }: CountryFilterProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const options = useScholarshipFilterOptions();
  // Selected values missing from the options (an old URL, or options failed)
  // stay listed so they can be unticked.
  const countries = mergeCountryOptions(options.data?.countries ?? [], selected);

  const focusables = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

  // Opening moves focus to the first option once the panel is rendered.
  useEffect(() => {
    if (isOpen) focusables()[0]?.focus();
  }, [isOpen]);

  // Outside click closes; focus returns to the trigger unless the click landed
  // on another control.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Element;
      if (containerRef.current?.contains(target)) return;
      setIsOpen(false);
      if (!target.closest(FOCUSABLE_SELECTOR)) {
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  function closeAndReturnFocus() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeAndReturnFocus();
      return;
    }
    if (!isOpen || !panelRef.current?.contains(event.target as Node)) return;
    const items = focusables();
    const next = getRovingFocusIndex(
      items.indexOf(event.target as HTMLElement),
      items.length,
      event.key
    );
    if (next !== null) {
      event.preventDefault();
      items[next].focus();
    }
  }

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm text-black">{t('filters.country.legend')}</legend>
      <div
        ref={containerRef}
        className="relative mt-4"
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          // Tabbing out of the dropdown closes it without moving focus.
          if (isOpen && !containerRef.current?.contains(event.relatedTarget as Node | null)) {
            setIsOpen(false);
          }
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          onKeyDown={handleTriggerKeyDown}
          className="flex w-full items-center justify-between gap-2 rounded-full border border-gray-300 bg-white px-3 py-2.5 text-start text-xs text-[#b5b5b5] transition-colors hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
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

        {/* Overlay: absolute positioning is needed so the panel does not push content down. */}
        <div
          ref={panelRef}
          id={panelId}
          hidden={!isOpen}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-300 bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          {options.isPending ? (
            <p role="status" className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 aria-hidden className="size-4 animate-spin text-orange-500" />
              {t('filters.country.loading')}
            </p>
          ) : null}

          {options.isError ? (
            <div
              role="alert"
              className="mb-2 space-y-2 rounded-xl bg-orange-50 p-3 text-xs text-[#7c3f00]"
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
                {options.isFetching ? (
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                ) : null}
                {t('filters.country.retry')}
              </button>
            </div>
          ) : null}

          {options.isSuccess && options.data.countries.length === 0 && selected.length === 0 ? (
            <p className="text-xs text-gray-500">{t('filters.country.empty')}</p>
          ) : null}

          {countries.length > 0 ? (
            <div className="flex flex-col gap-2">
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
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
