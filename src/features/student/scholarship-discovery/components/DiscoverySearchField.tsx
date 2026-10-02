'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { DISCOVERY_LIMITS } from '../constants';
import { SEARCH_DEBOUNCE_MS, createDebouncer, type Debouncer } from '../lib/debounce';
import { resolveDraftFromUrl } from '../lib/search-draft';

interface DiscoverySearchFieldProps {
  value?: string;
  onCommit: (search: string) => void;
}

// Typing edits a local draft; the URL (and so the request) changes only after
// ~300ms of idle time, on Enter, or on Clear.
export function DiscoverySearchField({ value, onCommit }: DiscoverySearchFieldProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value ?? '');
  const [syncedValue, setSyncedValue] = useState(value);
  const latestDraftRef = useRef(draft);
  const commitRef = useRef(onCommit);
  const debouncerRef = useRef<Debouncer<string> | null>(null);

  useEffect(() => {
    commitRef.current = onCommit;
    latestDraftRef.current = draft;
  });
  useEffect(() => {
    const debouncer = createDebouncer<string>(SEARCH_DEBOUNCE_MS, (next) => {
      // Skip a stale commit if the draft was re-synced from the URL meanwhile.
      if (next === latestDraftRef.current) commitRef.current(next);
    });
    debouncerRef.current = debouncer;
    return () => {
      debouncer.cancel();
      debouncerRef.current = null;
    };
  }, []);

  // The URL search changed (our commit, Back/Forward, a reset): re-sync the draft.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft((current) => resolveDraftFromUrl(current, value));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    latestDraftRef.current = draft;
    debouncerRef.current?.flush(draft);
  }

  function handleClear() {
    debouncerRef.current?.cancel();
    setDraft('');
    latestDraftRef.current = '';
    onCommit('');
    inputRef.current?.focus();
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative min-w-0 flex-1">
      <label htmlFor={inputId} className="sr-only">
        {t('search.label')}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#979797]"
      />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={draft}
        maxLength={DISCOVERY_LIMITS.searchMaxLength}
        placeholder={t('search.placeholder')}
        onChange={(event) => {
          setDraft(event.target.value);
          debouncerRef.current?.schedule(event.target.value);
        }}
        className="h-11 w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] ps-10 pe-11 text-start text-sm text-[#434343] outline-none transition-colors placeholder:text-[#979797] focus:border-[var(--color-border-focus)] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label={t('search.clear')}
          className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#979797] hover:bg-white hover:text-[#274383] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </form>
  );
}
