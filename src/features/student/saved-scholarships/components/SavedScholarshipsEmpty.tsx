'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Figma 2358:7754 — central illustration, heading, body, Explore CTA.
// The Explore CTA always navigates to /[locale]/student/scholarships (the
// discovery route stays canonical, Feature 006 does not rename it).
export function SavedScholarshipsEmpty() {
  const t = useTranslations('StudentSavedScholarships');
  const locale = useLocale();
  // locale is read for parity with the shell; next-intl's Link already applies it.
  void locale;

  return (
    <section
      aria-labelledby="saved-empty-heading"
      className="flex flex-col items-center gap-6 px-4 py-16 text-center"
    >
      {/*
        Decorative placeholder — the exact Figma 2358:7754 asset is exported
        under public/images/student-scholarships/saved-empty.svg by T038 in
        Phase 7 and this inline SVG is replaced with that reference then.
      */}
      <svg
        role="presentation"
        aria-hidden="true"
        viewBox="0 0 200 200"
        width={200}
        height={200}
        className="h-[200px] w-[200px]"
        data-testid="saved-empty-illustration"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="90" fill="#eef2f6" />
        <circle cx="100" cy="100" r="60" fill="#f8fafc" />
        <path d="M78 60h44a6 6 0 0 1 6 6v76l-28-20-28 20V66a6 6 0 0 1 6-6Z" fill="#cbd5e1" />
      </svg>
      <div className="flex flex-col gap-2">
        <h2
          id="saved-empty-heading"
          className="text-xl font-semibold text-[var(--color-text-primary)]"
        >
          {t('empty.heading')}
        </h2>
        <p className="max-w-md text-sm text-[var(--color-text-secondary)]">{t('empty.body')}</p>
      </div>
      <Link
        href="/student/scholarships"
        className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
        data-testid="saved-empty-cta"
      >
        {t('empty.cta')}
      </Link>
    </section>
  );
}
