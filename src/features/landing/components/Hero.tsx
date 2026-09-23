'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { AiIcon, SearchIcon } from '@/components/icons';
import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/components/ui/Button';

const FILTER_KEYS = ['bachelor', 'master', 'phd', 'exchange'] as const;

export function Hero() {
  const t = useTranslations('Landing.hero');

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[linear-gradient(135deg,#274383_0%,#0A2243_100%)] pt-16 pb-20 sm:pt-20 sm:pb-24"
    >
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

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className={buttonStyles({ variant: 'primary', className: 'px-6' })}
            >
              {t('start')}
            </Link>
            <a
              href="#how-it-works"
              className={buttonStyles({ variant: 'outline', className: 'px-6 text-white' })}
            >
              {t('howItWorks')}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="text-xs text-[var(--color-gray-300)]">{t('searchUnavailable')}</p>
          <div aria-hidden className="flex flex-wrap items-center justify-center gap-2">
            {FILTER_KEYS.map((key) => {
              return (
                <span
                  key={key}
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm text-[var(--color-gray-300)]"
                >
                  {t(`filters.${key}`)}
                </span>
              );
            })}
          </div>

          <div className="flex w-full max-w-3xl items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_20px_40px_rgba(2,17,34,0.25)] sm:gap-8">
            <div className="flex flex-1 items-center gap-2 px-2">
              <SearchIcon className="h-5 w-5 shrink-0 text-[var(--color-gray-400)]" />
              <input
                type="text"
                disabled
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-gray-400)]"
              />
            </div>
            <button
              type="button"
              disabled
              className="flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-3 text-white opacity-60"
            >
              <span className="text-sm leading-tight">{t('searchButton')}</span>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
