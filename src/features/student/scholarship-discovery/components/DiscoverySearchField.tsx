'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { DISCOVERY_LIMITS } from '../constants';
import { SEARCH_DEBOUNCE_MS, createDebouncer, type Debouncer } from '../lib/debounce';
import { resolveDraftFromUrl } from '../lib/search-draft';

// One search field per page; the empty state's "edit search" focuses it.
export const DISCOVERY_SEARCH_INPUT_ID = 'scholarship-discovery-search';

interface DiscoverySearchFieldProps {
  value?: string;
  onCommit: (search: string) => void;
}

// Typing edits a local draft; the URL (and so the request) changes only after
// ~300ms of idle time, on Enter, or on Clear.
export function DiscoverySearchField({ value, onCommit }: DiscoverySearchFieldProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const inputId = DISCOVERY_SEARCH_INPUT_ID;
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
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 shadow-[0_8px_16px_0_rgba(0,0,0,0.01)] transition-colors focus-within:border-[var(--color-border-focus)]"
    >
      <label htmlFor={inputId} className="sr-only">
        {t('search.label')}
      </label>
      <Search aria-hidden className="size-5 shrink-0 text-gray-400" />
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
        className="h-full min-w-0 flex-1 bg-transparent text-start text-xs text-[#434343] outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label={t('search.clear')}
          className="-me-2 flex size-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-[#f8fafc] hover:text-[#274383] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </form>
  );
}
