'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { AiIcon, SearchIcon } from '@/components/icons';

const FILTER_KEYS = ['all', 'bachelor', 'master', 'phd', 'exchange'] as const;

export function Hero() {
  const t = useTranslations('Landing.hero');
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_KEYS)[number]>('all');

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0A2243_0%,rgba(10,58,104,0.92)_100%)] pt-16 pb-20 sm:pt-20 sm:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-[295px] w-[522px] -translate-x-1/2 rounded-full bg-[#10B981] opacity-90 blur-[100px]"
      />

      <Container className="relative flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs text-[var(--color-gray-300)]">
            {t('badge')}
            <AiIcon className="h-6 w-6 text-[var(--color-gray-300)]" />
          </span>

          <div className="flex max-w-3xl flex-col items-center gap-6">
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[48px] lg:leading-[1.25]">
              {t('title')}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[var(--color-gray-300)]">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FILTER_KEYS.map((key) => {
              const isActive = key === activeFilter;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={[
                    'rounded-full px-5 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-white/10 text-[var(--color-gray-300)] hover:bg-white/15',
                  ].join(' ')}
                >
                  {t(`filters.${key}`)}
                </button>
              );
            })}
          </div>

          <div className="flex w-full max-w-3xl items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_20px_40px_rgba(2,17,34,0.25)] sm:gap-8">
            <div className="flex flex-1 items-center gap-2 px-2">
              <SearchIcon className="h-5 w-5 shrink-0 text-[var(--color-gray-400)]" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-gray-400)]"
              />
            </div>
            <button
              type="button"
              className="flex shrink-0 flex-col items-center justify-center gap-0 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <span className="text-xl font-bold leading-tight">{t('searchCount')}</span>
              <span className="text-sm leading-tight">{t('searchButton')}</span>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
