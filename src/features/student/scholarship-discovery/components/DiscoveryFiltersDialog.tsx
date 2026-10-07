'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FOCUSABLE_SELECTOR, getFocusTrapTarget } from '@/features/student/layout/focus-trap';
import {
  countActiveFilters,
  createFilterDraft,
  emptyFilterDraft,
  type FilterDraft,
} from '../lib/filter-draft';
import type { DiscoveryQuery } from '../types';
import { CountryFilter } from './CountryFilter';
import { DiscoveryFilters } from './DiscoveryFilters';

interface DiscoveryFiltersDialogProps {
  query: DiscoveryQuery;
  // Applies the whole draft as one URL update (one history entry, page reset).
  onApply: (draft: FilterDraft) => void;
}

const LG_QUERY = '(min-width: 1024px)';

// Below lg the side panel is replaced by this trigger and dialog (T048). Edits
// stay in a local draft until "Show results"; closing discards them.
export function DiscoveryFiltersDialog({ query, onApply }: DiscoveryFiltersDialogProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(() => createFilterDraft(query));
  const activeCount = countActiveFilters(query);

  function open() {
    setDraft(createFilterDraft(query));
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      // The country dropdown handles its own Escape first.
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null);
      const target = getFocusTrapTarget(
        focusable.indexOf(document.activeElement as HTMLElement),
        focusable.length,
        event.shiftKey
      );
      if (target !== null) {
        event.preventDefault();
        focusable[target].focus();
      }
    }

    // The dialog never shows at lg and above; close it if the viewport grows.
    const desktop = window.matchMedia(LG_QUERY);
    const closeOnDesktop = () => {
      if (desktop.matches) setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      desktop.removeEventListener('change', closeOnDesktop);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="flex h-[52px] shrink-0 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-sm text-text-label transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 lg:hidden"
      >
        <SlidersHorizontal aria-hidden className="size-4 shrink-0" />
        <span>{t('filtersDialog.open')}</span>
        {activeCount > 0 ? (
          <>
            <span
              aria-hidden
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white"
            >
              {activeCount}
            </span>
            <span className="sr-only">
              {t('filtersDialog.activeCount', { count: activeCount })}
            </span>
          </>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden className="absolute inset-0 bg-[#1e1b33]/30" onClick={close} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 end-0 flex w-full max-w-[420px] flex-col bg-white shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none starting:ltr:translate-x-full starting:rtl:-translate-x-full"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-300 px-4 py-3">
              <h2 id={titleId} className="text-base font-bold text-[#434343]">
                {t('filtersDialog.label')}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={t('filtersDialog.close')}
                className="flex size-10 items-center justify-center rounded-full border border-gray-300 text-[#274383] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              <DiscoveryFilters
                variant="dialog"
                query={draft}
                onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
                onClear={() => setDraft(emptyFilterDraft())}
                countryFilter={
                  <CountryFilter
                    selected={draft.countries}
                    onChange={(countries) => setDraft((current) => ({ ...current, countries }))}
                  />
                }
              />
            </div>

            <div className="flex items-center gap-3 border-t border-gray-300 px-4 py-3">
              <button
                type="button"
                onClick={() => setDraft(emptyFilterDraft())}
                className="h-11 flex-1 rounded-full border border-gray-300 bg-white text-sm font-medium text-[#434343] hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
              >
                {t('filtersDialog.clear')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  close();
                }}
                className="h-11 flex-1 rounded-full bg-orange-500 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#274383]"
              >
                {t('filtersDialog.apply')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
